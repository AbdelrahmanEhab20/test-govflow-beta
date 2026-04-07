import mongoose from 'mongoose';

const MailboxSchema = new mongoose.Schema(
  {
    id: { type: String },
    microsoftAccountId: { type: String },
    email: { type: String },
    displayName: { type: String },
    provider: { type: String }, // e.g. 'outlook'
    isActive: { type: Boolean, default: false },
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiry: { type: Date },
    scopes: { type: [String], default: [] },
  },
  { _id: false }
);

const NotificationPreferencesSchema = new mongoose.Schema(
  {
    email_assignments: { type: Boolean, default: true },
    email_due_reminders: { type: Boolean, default: true },
    email_mentions: { type: Boolean, default: true },
    in_app_all: { type: Boolean, default: true },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    // Keep a string id field compatible with frontend/mock data
    id: { type: String, index: true, unique: true },
    tenantId: { type: String, default: 'default', index: true },

    full_name: { type: String, required: true },
    full_name_ar: { type: String },
    email: { type: String, required: true, index: true },
    password_hash: { type: String, select: false },
    status: {
      type: String,
      enum: ['pending', 'active', 'inactive'],
      default: 'pending',
      index: true,
    },
    invite_token: { type: String, index: true },
    invite_token_expires: { type: Date },
    reset_token: { type: String, index: true },
    reset_token_expires: { type: Date },
    role: { type: String, default: 'user', index: true },

    department: { type: String },
    department_id: { type: String, index: true },
    position: { type: String },
    phone: { type: String },
    avatar_url: { type: String },

    onboarding_completed: { type: Boolean, default: false },

    notification_preferences: { type: NotificationPreferencesSchema, default: () => ({}) },
    mailboxes: { type: [MailboxSchema], default: [] },

    created_date: { type: String },
    updated_date: { type: String },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', UserSchema);

