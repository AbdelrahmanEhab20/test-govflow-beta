import mongoose from 'mongoose';

const SubtaskSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    tenantId: { type: String, default: 'default', index: true },

    task_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, default: 'not_started' },
    order: { type: Number, default: 0 },

    assignee_user_id: { type: String },
    due_date: { type: String },

    created_date: { type: String },
    updated_date: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Subtask = mongoose.model('Subtask', SubtaskSchema);

