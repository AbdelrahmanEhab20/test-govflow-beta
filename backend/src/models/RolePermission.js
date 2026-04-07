import mongoose from 'mongoose';

const RolePermissionSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    tenantId: { type: String, default: 'default', index: true },

    role: { type: String, required: true, index: true },
    permission: { type: String, required: true, index: true },
    granted: { type: Boolean, default: false },

    created_date: { type: String },
    updated_date: { type: String },
  },
  {
    timestamps: true,
    indexes: [{ fields: { role: 1, permission: 1 }, options: { unique: true } }],
  }
);

export const RolePermission = mongoose.model('RolePermission', RolePermissionSchema);

