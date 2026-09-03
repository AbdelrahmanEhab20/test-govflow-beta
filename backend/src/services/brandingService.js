import { config } from '../config/index.js';
import { TenantSettings } from '../models/index.js';
import { createHttpError } from '../middleware/errorHandler.js';

export const BRANDING_FIELDS = [
  'appName',
  'companyName',
  'logoUrl',
  'faviconUrl',
  'primaryColor',
  'secondaryColor',
  'accentColor',
  'sidebarTitle',
  'tagline',
  'supportEmail',
  'websiteUrl',
  'showGovflowCredit',
  'govflowCreditText',
  'govflowCreditUrl',
  'envLabel',
];

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function envBrandingDefaults() {
  return {
    ...config.branding,
    envLabel: config.branding.envLabel || 'beta',
  };
}

function stripUndefined(obj = {}) {
  const next = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      next[key] = value;
    }
  }
  return next;
}

/**
 * Merge env bootstrap branding with DB overrides (DB wins).
 */
export function mergeBranding(dbBranding = {}) {
  return {
    ...envBrandingDefaults(),
    ...stripUndefined(dbBranding),
  };
}

export async function getResolvedBranding(tenantId = config.defaultTenantId) {
  const doc = await TenantSettings.findOne({ tenantId }).lean();
  return mergeBranding(doc?.branding || {});
}

export function toPublicSettingsPayload(branding) {
  return {
    auth_required: true,
    appName: branding.appName,
    logoUrl: branding.logoUrl,
    faviconUrl: branding.faviconUrl,
    primaryColor: branding.primaryColor,
    secondaryColor: branding.secondaryColor,
    accentColor: branding.accentColor,
    companyName: branding.companyName,
    sidebarTitle: branding.sidebarTitle,
    tagline: branding.tagline,
    supportEmail: branding.supportEmail,
    websiteUrl: branding.websiteUrl,
    showGovflowCredit: branding.showGovflowCredit !== false,
    govflowCreditText: branding.govflowCreditText,
    govflowCreditUrl: branding.govflowCreditUrl,
    envLabel: branding.envLabel || 'beta',
  };
}

function validateOptionalUrl(field, value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  // Allow relative paths like /logo.svg
  if (trimmed.startsWith('/')) return trimmed;
  try {
    // eslint-disable-next-line no-new
    new URL(trimmed);
    return trimmed;
  } catch {
    throw createHttpError(400, `${field} must be a valid URL or path`, 'INVALID_BRANDING_URL');
  }
}

function validateOptionalColor(field, value) {
  if (value === undefined || value === null || value === '') return undefined;
  const trimmed = String(value).trim();
  if (!HEX_COLOR_RE.test(trimmed)) {
    throw createHttpError(400, `${field} must be a hex color (e.g. #2563eb)`, 'INVALID_BRANDING_COLOR');
  }
  return trimmed;
}

export function sanitizeBrandingPatch(body = {}) {
  const patch = {};

  for (const field of BRANDING_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const value = body[field];

    if (field === 'showGovflowCredit') {
      patch[field] = Boolean(value);
      continue;
    }

    if (['primaryColor', 'secondaryColor', 'accentColor'].includes(field)) {
      const color = validateOptionalColor(field, value);
      if (color !== undefined) patch[field] = color;
      continue;
    }

    if (['logoUrl', 'faviconUrl', 'websiteUrl', 'govflowCreditUrl'].includes(field)) {
      patch[field] = validateOptionalUrl(field, value);
      continue;
    }

    if (typeof value === 'string') {
      patch[field] = value.trim();
    } else if (value === null) {
      patch[field] = '';
    }
  }

  return patch;
}

export async function updateTenantBranding({
  tenantId = config.defaultTenantId,
  patch,
  updatedBy,
}) {
  const sanitized = sanitizeBrandingPatch(patch);
  if (Object.keys(sanitized).length === 0) {
    throw createHttpError(400, 'No branding fields provided', 'EMPTY_BRANDING_PATCH');
  }

  const setFields = {};
  for (const [key, value] of Object.entries(sanitized)) {
    setFields[`branding.${key}`] = value;
  }
  if (updatedBy) {
    setFields.updatedBy = updatedBy;
  }

  const doc = await TenantSettings.findOneAndUpdate(
    { tenantId },
    { $set: setFields },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return mergeBranding(doc?.branding || {});
}
