import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    tenantId: { type: String, default: 'default', index: true },

    pillar: { type: String, required: true }, // main title in UI
    brief_description: { type: String },
    deliverables: { type: String },

    lead_user_id: { type: String, index: true },
    lead_user_name: { type: String },
    support_users: { type: [String], default: [] },
    support_user_names: { type: [String], default: [] },

    start_date: { type: String }, // ISO date (YYYY-MM-DD)
    due_date: { type: String },   // ISO date

    status: { type: String, default: 'not_started', index: true },
    completion_percent: { type: Number, default: 0 },
    priority: { type: String, default: 'medium' },

    stakeholders: { type: [String], default: [] },
    dependencies: { type: String }, // free-text notes in mock
    notes: { type: String },
    tags: { type: [String], default: [] },

    workflow_stage_id: { type: String, index: true },
    is_archived: { type: Boolean, default: false, index: true },

    requires_approval: { type: Boolean, default: false },
    approval_status: { type: String, default: 'draft' },

    source_email_id: { type: String }, // link back to Email

    created_date: { type: String },
    updated_date: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Task = mongoose.model('Task', TaskSchema);

