import { Router } from 'express';
import crypto from 'node:crypto';
import { config } from '../config/index.js';
import { EmailMessage, User } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, createHttpError } from '../middleware/errorHandler.js';
import {
  getGoogleAuthUrl,
  exchangeGoogleCode,
  refreshGoogleAccessToken,
  callGoogleApi,
} from '../services/googleGmailService.js';

const router = Router();

function sanitizeMailbox(mailbox) {
  if (!mailbox) return null;
  return {
    id: mailbox.id,
    email: mailbox.email,
    displayName: mailbox.displayName,
    provider: mailbox.provider,
    isActive: mailbox.isActive,
    tokenExpiry: mailbox.tokenExpiry || null,
    scopes: mailbox.scopes || [],
  };
}

function getHeaderValue(headers, key) {
  const match = (headers || []).find((header) => String(header.name || '').toLowerCase() === key.toLowerCase());
  return match?.value || '';
}

function parseEmailAddresses(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .map((item) => {
      const bracketMatch = item.match(/<([^>]+)>/);
      return bracketMatch?.[1] || item;
    })
    .filter(Boolean);
}

function collectGmailAttachments(payload) {
  const out = [];
  function walk(part) {
    if (!part) return;
    if (part.filename && String(part.filename).trim().length > 0) {
      out.push({
        id: part.body?.attachmentId || part.partId || '',
        name: part.filename,
        contentType: part.mimeType || '',
        size: Number(part.body?.size) || 0,
      });
    }
    if (Array.isArray(part.parts)) {
      part.parts.forEach(walk);
    }
  }
  walk(payload);
  return out;
}

function mapGoogleMessageToEmail({ message, mailbox }) {
  const headers = message?.payload?.headers || [];
  const fromHeader = getHeaderValue(headers, 'From');
  const subject = getHeaderValue(headers, 'Subject');
  const dateHeader = getHeaderValue(headers, 'Date');

  const fromEmailMatch = fromHeader.match(/<([^>]+)>/);
  const fromEmail = fromEmailMatch?.[1] || fromHeader;
  const fromName = fromHeader.replace(/<[^>]+>/g, '').trim() || fromEmail || 'Unknown';
  const attachments = collectGmailAttachments(message?.payload);
  const hasAttachments =
    attachments.length > 0 ||
    Boolean(
      message?.payload?.filename ||
        (Array.isArray(message?.payload?.parts) &&
          message.payload.parts.some((part) => Boolean(part?.filename))),
    );

  return {
    id: `gm_${message.id}`,
    tenantId: config.defaultTenantId,
    subject: subject || '(no subject)',
    from_name: fromName,
    from_email: fromEmail || '',
    to_emails: parseEmailAddresses(getHeaderValue(headers, 'To')),
    cc_emails: parseEmailAddresses(getHeaderValue(headers, 'Cc')),
    body_preview: message.snippet || '',
    body_text: message.snippet || '',
    received_at: message.internalDate
      ? new Date(Number(message.internalDate)).toISOString()
      : (dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString()),
    mailbox: mailbox.email || '',
    is_read: !Array.isArray(message.labelIds) || !message.labelIds.includes('UNREAD'),
    has_attachments: hasAttachments,
    attachments,
    updated_date: new Date().toISOString(),
    created_date: new Date().toISOString(),
  };
}

async function getActiveGmailMailboxForUser(userId) {
  const user = await User.findOne({ id: userId });
  if (!user) return null;

  const activeIndex = user.mailboxes.findIndex((mailbox) => mailbox.provider === 'gmail' && mailbox.isActive);
  if (activeIndex < 0) return null;

  const mailbox = user.mailboxes[activeIndex];
  const expiryTime = mailbox?.tokenExpiry ? new Date(mailbox.tokenExpiry).getTime() : 0;
  const isExpired = Boolean(expiryTime) && expiryTime <= Date.now() + 2 * 60 * 1000;
  const shouldRefresh = Boolean(
    mailbox?.refreshToken && (!mailbox?.accessToken || !expiryTime || isExpired)
  );

  if (shouldRefresh) {
    const refreshed = await refreshGoogleAccessToken(mailbox.refreshToken);
    mailbox.accessToken = refreshed.accessToken;
    mailbox.refreshToken = refreshed.refreshToken;
    mailbox.tokenExpiry = refreshed.expiresOn;
    user.markModified('mailboxes');
    await user.save();
  }

  if (isExpired && !mailbox?.refreshToken) {
    throw createHttpError(
      401,
      'Gmail token expired. Reconnect Google mailbox from Settings.',
      'GMAIL_RECONNECT_REQUIRED'
    );
  }

  if (!mailbox?.accessToken) return null;
  return typeof mailbox.toObject === 'function' ? mailbox.toObject() : mailbox;
}

// POST /auth/google/authorize-url
router.post(
  '/authorize-url',
  requireAuth,
  asyncHandler(async (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;
    req.session.userId = req.user.id;

    const url = getGoogleAuthUrl(state);
    res.json({ url });
  })
);

// GET /auth/google/callback
router.get(
  '/callback',
  asyncHandler(async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
      const redirectUrl = new URL('/Settings', config.frontendUrl);
      redirectUrl.searchParams.set('google_connected', '0');
      redirectUrl.searchParams.set('reason', String(error));
      return res.redirect(redirectUrl.toString());
    }

    if (!code || !state) {
      throw createHttpError(400, 'Missing OAuth callback parameters', 'OAUTH_CALLBACK_INVALID');
    }
    if (!req.session?.oauthState || state !== req.session.oauthState) {
      throw createHttpError(400, 'Invalid OAuth state', 'INVALID_OAUTH_STATE');
    }
    if (!req.session?.userId) {
      throw createHttpError(400, 'Missing OAuth session user', 'OAUTH_SESSION_MISSING');
    }

    const tokenRes = await exchangeGoogleCode(String(code));
    const profile = await callGoogleApi(
      tokenRes.accessToken,
      'https://www.googleapis.com/oauth2/v2/userinfo'
    );

    const mailboxEmail = profile.email || '';
    const nextMailbox = {
      id: profile.id || `gmail_${Date.now()}`,
      email: mailboxEmail,
      displayName: profile.name || mailboxEmail,
      provider: 'gmail',
      isActive: true,
      accessToken: tokenRes.accessToken,
      refreshToken: tokenRes.refreshToken || null,
      tokenExpiry: tokenRes.expiresOn || null,
      scopes: config.google.scopes,
    };

    const user = await User.findOne({ id: req.session.userId });
    if (!user) {
      throw createHttpError(404, 'Authenticated user not found', 'USER_NOT_FOUND');
    }

    user.mailboxes = user.mailboxes.map((mailbox) => {
      const baseMailbox = typeof mailbox.toObject === 'function' ? mailbox.toObject() : mailbox;
      if (baseMailbox.provider === 'gmail') {
        return { ...baseMailbox, isActive: false };
      }
      return baseMailbox;
    });

    const existingIndex = user.mailboxes.findIndex(
      (mailbox) => mailbox.provider === 'gmail' && (mailbox.email === nextMailbox.email || mailbox.id === nextMailbox.id)
    );
    if (existingIndex >= 0) {
      user.mailboxes[existingIndex] = nextMailbox;
    } else {
      user.mailboxes.push(nextMailbox);
    }
    await user.save();

    req.session.oauthState = null;

    const redirectUrl = new URL('/Settings', config.frontendUrl);
    redirectUrl.searchParams.set('google_connected', '1');
    return res.redirect(redirectUrl.toString());
  })
);

// GET /auth/google/status
router.get(
  '/status',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ id: req.user.id }).lean();
    const mailboxes = user?.mailboxes || [];
    const mailboxWithToken = mailboxes.find(
      (mailbox) => mailbox.provider === 'gmail' && mailbox.isActive && mailbox.accessToken
    );
    const fallbackMailbox = mailboxes.find(
      (mailbox) => mailbox.provider === 'gmail' && mailbox.isActive
    );

    res.json({
      connected: Boolean(mailboxWithToken),
      mailbox: sanitizeMailbox(mailboxWithToken || fallbackMailbox || null),
    });
  })
);

// GET /auth/google/inbox
router.get(
  '/inbox',
  requireAuth,
  asyncHandler(async (req, res) => {
    const mailbox = await getActiveGmailMailboxForUser(req.user.id);
    if (!mailbox?.accessToken) {
      throw createHttpError(404, 'No Gmail mailbox connected', 'GMAIL_NOT_CONNECTED');
    }

    const messageList = await callGoogleApi(
      mailbox.accessToken,
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=in:inbox'
    );

    const messages = await Promise.all(
      (messageList.messages || []).map(async (item) => callGoogleApi(
        mailbox.accessToken,
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject&metadataHeaders=Date`
      ))
    );

    res.json({ value: messages });
  })
);

// POST /auth/google/sync-inbox
router.post(
  '/sync-inbox',
  requireAuth,
  asyncHandler(async (req, res) => {
    const mailbox = await getActiveGmailMailboxForUser(req.user.id);
    if (!mailbox?.accessToken) {
      throw createHttpError(404, 'No Gmail mailbox connected', 'GMAIL_NOT_CONNECTED');
    }

    const messageList = await callGoogleApi(
      mailbox.accessToken,
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=in:inbox'
    );
    const messageIds = Array.isArray(messageList?.messages) ? messageList.messages : [];

    let inserted = 0;
    let updated = 0;

    for (const item of messageIds) {
      const message = await callGoogleApi(
        mailbox.accessToken,
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
      );
      const nextDoc = mapGoogleMessageToEmail({ message, mailbox });
      const exists = await EmailMessage.exists({ id: nextDoc.id, tenantId: config.defaultTenantId });

      await EmailMessage.findOneAndUpdate(
        { id: nextDoc.id, tenantId: config.defaultTenantId },
        {
          $set: {
            subject: nextDoc.subject,
            from_name: nextDoc.from_name,
            from_email: nextDoc.from_email,
            to_emails: nextDoc.to_emails,
            cc_emails: nextDoc.cc_emails,
            body_preview: nextDoc.body_preview,
            body_text: nextDoc.body_text,
            received_at: nextDoc.received_at,
            mailbox: nextDoc.mailbox,
            is_read: nextDoc.is_read,
            has_attachments: nextDoc.has_attachments,
            attachments: nextDoc.attachments || [],
            updated_date: nextDoc.updated_date,
          },
          $setOnInsert: {
            id: nextDoc.id,
            tenantId: nextDoc.tenantId,
            status_in_system: 'new',
            is_starred: false,
            created_date: nextDoc.created_date,
          },
        },
        { upsert: true, new: true }
      );

      if (exists) updated += 1;
      else inserted += 1;
    }

    res.json({
      success: true,
      mailbox: mailbox.email,
      fetched: messageIds.length,
      inserted,
      updated,
    });
  })
);

export default router;
