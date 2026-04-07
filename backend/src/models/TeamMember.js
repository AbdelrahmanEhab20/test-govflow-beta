import mongoose from 'mongoose';

const TeamMemberSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    tenantId: { type: String, default: 'default', index: true },

    ext_no: { type: String },
    name: { type: String, required: true },
    email: { type: String },
    job_title: { type: String },
    department_name: { type: String },
    sector_name: { type: String },
    organization_name: { type: String },
    reporting_to: { type: String },
    telephone_number: { type: String },
    mobile_number: { type: String },

    created_date: { type: String },
    updated_date: { type: String },
  },
  {
    timestamps: true,
  }
);

export const TeamMember = mongoose.model('TeamMember', TeamMemberSchema);

