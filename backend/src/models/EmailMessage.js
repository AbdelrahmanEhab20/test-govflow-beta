import mongoose from 'mongoose';

const EmailMessageSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    tenantId: { type: String, default: 'default', index: true },

    subject: { type: String },
    from_name: { type: String },
    from_email: { type: String },
    to_emails: { type: [String], default: [] },
    cc_emails: { type: [String], default: [] },

    body_preview: { type: String },
    body_text: { type: String },
    body_html: { type: String },

    received_at: { type: String }, // ISO datetime

    status_in_system: { type: String, default: 'new', index: true }, // new/triaged/converted/archived
    mailbox: { type: String },
    is_read: { type: Boolean, default: false },
    is_starred: { type: Boolean, default: false },
    category: { type: String },
    suggested_category: { type: String },
    suggested_priority: { type: String },
    tags: { type: [String], default: [] },
    has_attachments: { type: Boolean, default: false },
    /** Metadata only (names/sizes); binaries are not stored. Populated by inbox sync where available. */
    attachments: {
      type: [
        {
          id: { type: String },
          name: { type: String },
          contentType: { type: String },
          size: { type: Number },
        },
      ],
      default: [],
    },

    assigned_to_user_id: { type: String },
    linked_task_id: { type: String, index: true },

    created_date: { type: String },
    updated_date: { type: String },
  },
  {
    timestamps: true,
  }
);

EmailMessageSchema.index({ tenantId: 1, mailbox: 1, received_at: -1 });

export const EmailMessage = mongoose.model('EmailMessage', EmailMessageSchema);

