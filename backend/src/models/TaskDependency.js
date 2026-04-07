import mongoose from 'mongoose';

const TaskDependencySchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    tenantId: { type: String, default: 'default', index: true },

    dependent_task_id: { type: String, required: true, index: true },
    prerequisite_task_id: { type: String, required: true, index: true },
    dependency_type: { type: String, default: 'finish_to_start' },
    is_active: { type: Boolean, default: true },

    created_date: { type: String },
    updated_date: { type: String },
  },
  {
    timestamps: true,
  }
);

export const TaskDependency = mongoose.model('TaskDependency', TaskDependencySchema);

