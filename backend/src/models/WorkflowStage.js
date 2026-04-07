import mongoose from 'mongoose';

const WorkflowStageSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    tenantId: { type: String, default: 'default', index: true },

    name: { type: String, required: true },
    description: { type: String },
    order: { type: Number, default: 0, index: true },
    color: { type: String },
    is_active: { type: Boolean, default: true },
    require_approval: { type: Boolean, default: false },
    allowed_transitions: { type: [String], default: [] },

    created_date: { type: String },
    updated_date: { type: String },
  },
  {
    timestamps: true,
  }
);

export const WorkflowStage = mongoose.model('WorkflowStage', WorkflowStageSchema);

