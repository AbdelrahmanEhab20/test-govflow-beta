import mongoose from 'mongoose';

const BrandingSchema = new mongoose.Schema(
  {
    appName: { type: String },
    companyName: { type: String },
    logoUrl: { type: String },
    faviconUrl: { type: String },
    primaryColor: { type: String },
    secondaryColor: { type: String },
    accentColor: { type: String },
    sidebarTitle: { type: String },
    tagline: { type: String },
    supportEmail: { type: String },
    websiteUrl: { type: String },
    showGovflowCredit: { type: Boolean },
    govflowCreditText: { type: String },
    govflowCreditUrl: { type: String },
    envLabel: { type: String },
  },
  { _id: false }
);

const TenantSettingsSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, unique: true, index: true },
    branding: { type: BrandingSchema, default: () => ({}) },
    updatedBy: { type: String },
  },
  {
    timestamps: true,
  }
);

export const TenantSettings = mongoose.model('TenantSettings', TenantSettingsSchema);
