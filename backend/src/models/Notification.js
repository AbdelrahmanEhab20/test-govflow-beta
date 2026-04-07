import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    tenantId: { type: String, default: 'default', index: true },

    user_id: { type: String, required: true, index: true },
    title: { type: String },
    message: { type: String },
    type: { type: String }, // e.g. 'task_assigned', 'due_soon'

    related_task_id: { type: String },
    related_email_id: { type: String },

    is_read: { type: Boolean, default: false, index: true },

    created_date: { type: String },
    updated_date: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model('Notification', NotificationSchema);

