import { Router } from 'express';
import crypto from 'node:crypto';
import { config } from '../config/index.js';
import { EmailMessage, User } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, createHttpError } from '../middleware/errorHandler.js';
import {
  getMicrosoftAuthUrl,
  exchangeMicrosoftCode,
  callGraph,
  refreshMicrosoftAccessToken,
} from '../services/microsoftGraphService.js';

const router = Router();

function sanitizeMailbox(mailbox) {
  if (!mailbox) return null;
  return {
    id: mailbox.id,
    microsoftAccountId: mailbox.microsoftAccountId,
    email: mailbox.email,
    displayName: mailbox.displayName,
    provider: mailbox.provider,
    isActive: mailbox.isActive,
    tokenExpiry: mailbox.tokenExpiry || null,
    scopes: mailbox.scopes || [],
  };
}

async function getActiveOutlookMailboxForUser(userId) {
  const user = await User.findOne({ id: userId });
  if (!user) return null;

  const activeIndex = user.mailboxes.findIndex(
    (mb) => mb.provider === 'outlook' && mb.isActive
  );
  if (activeIndex < 0) return null;

  const mailbox = user.mailboxes[activeIndex];
  const expiryTime = mailbox?.tokenExpiry ? new Date(mailbox.tokenExpiry).getTime() : 0;
  const isExpired = Boolean(expiryTime) && expiryTime <= Date.now() + 2 * 60 * 1000;
  const shouldRefresh = Boolean(
    mailbox?.refreshToken && (!mailbox?.accessToken || !expiryTime || isExpired)
  );

  if (shouldRefresh) {
    const refreshed = await refreshMicrosoftAccessToken(mailbox.refreshToken);
    mailbox.accessToken = refreshed.accessToken;
    mailbox.refreshToken = refreshed.refreshToken;
    mailbox.tokenExpiry = refreshed.expiresOn;
    user.markModified('mailboxes');
    await user.save();
  }

  if (isExpired && !mailbox?.refreshToken) {
    throw createHttpError(
      401,
      'Outlook token expired. Reconnect Microsoft mailbox from Settings.',
      'OUTLOOK_RECONNECT_REQUIRED'
    );
  }

  if (!mailbox?.accessToken) {
    return null;
  }

  return typeof mailbox.toObject === 'function' ? mailbox.toObject() : mailbox;
}

function mapGraphMessageToEmail({ message, mailbox }) {
  const now = new Date().toISOString();
  const from = message?.from?.emailAddress || {};
  const toRecipients = Array.isArray(message?.toRecipients) ? message.toRecipients : [];
  const ccRecipients = Array.isArray(message?.ccRecipients) ? message.ccRecipients : [];
  const category =
    Array.isArray(message?.categories) && message.categories.length > 0
      ? String(message.categories[0]).toLowerCase()
      : null;

  return {
    id: `ms_${message.id}`,
    tenantId: config.defaultTenantId,
    subject: message.subject || '(no subject)',
    from_name: from.name || from.address || 'Unknown',
    from_email: from.address || '',
    to_emails: toRecipients
      .map((item) => item?.emailAddress?.address)
      .filter(Boolean),
    cc_emails: ccRecipients
      .map((item) => item?.emailAddress?.address)
      .filter(Boolean),
    body_preview: message.bodyPreview || '',
    body_text: message.bodyPreview || '',
    received_at: message.receivedDateTime || now,
    mailbox: mailbox.email || '',
    is_read: Boolean(message.isRead),
    has_attachments: Boolean(message.hasAttachments),
    attachments: [],
    category,
    suggested_category: category,
    updated_date: now,
    created_date: now,
  };
}

// POST /auth/microsoft/authorize-url
router.post(
  '/authorize-url',
  requireAuth,
  asyncHandler(async (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;
    req.session.userId = req.user.id;

    const url = await getMicrosoftAuthUrl(state);
    res.json({ url });
  })
);

// GET /auth/microsoft/callback
router.get(
  '/callback',
  asyncHandler(async (req, res) => {
    const { code, state, error, error_description: errorDescription } = req.query;

    if (error) {
      const redirectUrl = new URL('/Settings', config.frontendUrl);
      redirectUrl.searchParams.set('ms_connected', '0');
      redirectUrl.searchParams.set('reason', String(errorDescription || error));
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

    const tokenRes = await exchangeMicrosoftCode(String(code));
    const profile = await callGraph(tokenRes.accessToken, '/me');

    const mailboxEmail = profile.mail || profile.userPrincipalName || '';
    const nextMailbox = {
      id: profile.id,
      microsoftAccountId: profile.id,
      email: mailboxEmail,
      displayName: profile.displayName || mailboxEmail,
      provider: 'outlook',
      isActive: true,
      accessToken: tokenRes.accessToken,
      refreshToken: tokenRes.refreshToken,
      tokenExpiry: tokenRes.expiresOn || null,
      scopes: config.microsoft.scopes,
    };

    const user = await User.findOne({ id: req.session.userId });
    if (!user) {
      throw createHttpError(404, 'Authenticated user not found', 'USER_NOT_FOUND');
    }

    user.mailboxes = user.mailboxes.map((mailbox) => {
      const baseMailbox = typeof mailbox.toObject === 'function' ? mailbox.toObject() : mailbox;
      if (baseMailbox.provider === 'outlook') {
        return { ...baseMailbox, isActive: false };
      }
      return baseMailbox;
    });

    const existingIndex = user.mailboxes.findIndex(
      (mailbox) => mailbox.provider === 'outlook' && (mailbox.email === nextMailbox.email || mailbox.id === nextMailbox.id)
    );
    if (existingIndex >= 0) {
      user.mailboxes[existingIndex] = nextMailbox;
    } else {
      user.mailboxes.push(nextMailbox);
    }
    await user.save();

    req.session.oauthState = null;

    const redirectUrl = new URL('/Settings', config.frontendUrl);
    redirectUrl.searchParams.set('ms_connected', '1');
    return res.redirect(redirectUrl.toString());
  })
);

// GET /auth/microsoft/status
router.get(
  '/status',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ id: req.user.id }).lean();
    const mailboxes = user?.mailboxes || [];
    const mailboxWithToken = mailboxes.find(
      (mb) => mb.provider === 'outlook' && mb.isActive && mb.accessToken
    );
    const fallbackMailbox = mailboxes.find(
      (mb) => mb.provider === 'outlook' && mb.isActive
    );
    const mailbox = mailboxWithToken || fallbackMailbox || null;
    res.json({
      connected: Boolean(mailboxWithToken),
      mailbox: sanitizeMailbox(mailbox),
    });
  })
);

// GET /auth/microsoft/inbox
router.get(
  '/inbox',
  requireAuth,
  asyncHandler(async (req, res) => {
    const mailbox = await getActiveOutlookMailboxForUser(req.user.id);
    if (!mailbox?.accessToken) {
      throw createHttpError(404, 'No Outlook mailbox connected', 'OUTLOOK_NOT_CONNECTED');
    }
    const messages = await callGraph(
      mailbox.accessToken,
      '/me/messages?$top=20&$select=id,subject,from,receivedDateTime'
    );
    res.json(messages);
  })
);

// GET /auth/microsoft/contacts
router.get(
  '/contacts',
  requireAuth,
  asyncHandler(async (req, res) => {
    const mailbox = await getActiveOutlookMailboxForUser(req.user.id);
    if (!mailbox?.accessToken) {
      throw createHttpError(404, 'No Outlook mailbox connected', 'OUTLOOK_NOT_CONNECTED');
    }
    const contacts = await callGraph(
      mailbox.accessToken,
      '/me/contacts?$select=displayName,emailAddresses,jobTitle,department'
    );
    res.json(contacts);
  })
);

// GET /auth/microsoft/me (debug)
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const mailbox = await getActiveOutlookMailboxForUser(req.user.id);
    if (!mailbox?.accessToken) {
      throw createHttpError(404, 'No Outlook mailbox connected', 'OUTLOOK_NOT_CONNECTED');
    }
    const me = await callGraph(
      mailbox.accessToken,
      '/me?$select=id,displayName,mail,userPrincipalName,givenName,surname'
    );
    res.json(me);
  })
);

// GET /auth/microsoft/mail-folders (debug)
router.get(
  '/mail-folders',
  requireAuth,
  asyncHandler(async (req, res) => {
    const mailbox = await getActiveOutlookMailboxForUser(req.user.id);
    if (!mailbox?.accessToken) {
      throw createHttpError(404, 'No Outlook mailbox connected', 'OUTLOOK_NOT_CONNECTED');
    }
    const folders = await callGraph(
      mailbox.accessToken,
      '/me/mailFolders?$top=50&$select=id,displayName,totalItemCount,unreadItemCount'
    );
    res.json(folders);
  })
);

// POST /auth/microsoft/sync-inbox
router.post(
  '/sync-inbox',
  requireAuth,
  asyncHandler(async (req, res) => {
    const mailbox = await getActiveOutlookMailboxForUser(req.user.id);
    if (!mailbox?.accessToken) {
      throw createHttpError(404, 'No Outlook mailbox connected', 'OUTLOOK_NOT_CONNECTED');
    }

    const messages = await callGraph(
      mailbox.accessToken,
      '/me/messages?$top=50&$select=id,subject,from,toRecipients,ccRecipients,bodyPreview,receivedDateTime,isRead,hasAttachments,categories'
    );
    const items = Array.isArray(messages?.value) ? messages.value : [];

    let inserted = 0;
    let updated = 0;

    for (const message of items) {
      let attachmentMeta = [];
      if (message.hasAttachments && message.id) {
        try {
          const att = await callGraph(
            mailbox.accessToken,
            `/me/messages/${encodeURIComponent(message.id)}/attachments?$top=50&$select=id,name,size,contentType,isInline`,
          );
          attachmentMeta = (Array.isArray(att?.value) ? att.value : [])
            .filter((a) => !a.isInline)
            .map((a) => ({
              id: a.id,
              name: a.name || 'attachment',
              contentType: a.contentType || '',
              size: Number(a.size) || 0,
            }));
        } catch {
          attachmentMeta = [];
        }
      }

      const nextDoc = mapGraphMessageToEmail({ message, mailbox });
      nextDoc.attachments = attachmentMeta;
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
            attachments: nextDoc.attachments,
            category: nextDoc.category,
            suggested_category: nextDoc.suggested_category,
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
      fetched: items.length,
      inserted,
      updated,
    });
  })
);

export default router;
