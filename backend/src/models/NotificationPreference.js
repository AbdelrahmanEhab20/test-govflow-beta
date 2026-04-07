import mongoose from 'mongoose';

const NotificationPreferenceSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    tenantId: { type: String, default: 'default', index: true },

    user_id: { type: String, required: true, index: true },
    user_email: { type: String },

    notify_task_assigned: { type: Boolean, default: true },
    notify_task_assigned_email: { type: Boolean, default: true },
    notify_profile_updated: { type: Boolean, default: true },
    notify_routing_rule_changes: { type: Boolean, default: true },
    notify_team_performance: { type: Boolean, default: true },
    notify_status_changes: { type: Boolean, default: true },
    notify_due_soon: { type: Boolean, default: true },
    notify_overdue: { type: Boolean, default: true },
    email_digest_frequency: { type: String, default: 'immediate' },

    created_date: { type: String },
    updated_date: { type: String },
  },
  {
    timestamps: true,
  }
);

export const NotificationPreference = mongoose.model('NotificationPreference', NotificationPreferenceSchema);

