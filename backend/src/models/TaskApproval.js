import mongoose from 'mongoose';

const TaskApprovalSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    tenantId: { type: String, default: 'default', index: true },

    task_id: { type: String, required: true, index: true },
    approver_user_id: { type: String, required: true },
    approver_user_name: { type: String },

    status: { type: String, default: 'pending' }, // pending / approved / rejected
    decision_comment: { type: String },
    decided_at: { type: String },

    created_date: { type: String },
    updated_date: { type: String },
  },
  {
    timestamps: true,
  }
);

export const TaskApproval = mongoose.model('TaskApproval', TaskApprovalSchema);

