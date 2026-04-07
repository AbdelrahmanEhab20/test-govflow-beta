import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    tenantId: { type: String, default: 'default', index: true },

    name: { type: String, required: true },
    sector: { type: String },
    description: { type: String },

    manager_user_id: { type: String },
    manager_name: { type: String },

    member_count: { type: Number, default: 0 },
    email: { type: String },
    phone: { type: String },

    parent_department_id: { type: String },
    parent_department_name: { type: String },

    is_active: { type: Boolean, default: true },

    tags: { type: [String], default: [] },
    notes: { type: String },

    created_date: { type: String },
    updated_date: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Department = mongoose.model('Department', DepartmentSchema);

