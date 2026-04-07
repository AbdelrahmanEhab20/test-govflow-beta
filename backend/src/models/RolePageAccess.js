import mongoose from 'mongoose';

const RolePageAccessSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    tenantId: { type: String, default: 'default', index: true },

    role: { type: String, required: true, index: true },
    page: { type: String, required: true, index: true },
    can_access: { type: Boolean, default: false },
    order: { type: Number, default: 0 },

    created_date: { type: String },
    updated_date: { type: String },
  },
  {
    timestamps: true,
    indexes: [{ fields: { role: 1, page: 1 }, options: { unique: true } }],
  }
);

export const RolePageAccess = mongoose.model('RolePageAccess', RolePageAccessSchema);

