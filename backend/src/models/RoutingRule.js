import mongoose from 'mongoose';

const ConditionSchema = new mongoose.Schema(
  {
    condition_type: { type: String, required: true },
    condition_value: { type: String, required: true },
  },
  { _id: false }
);

const ActionSchema = new mongoose.Schema(
  {
    action_type: { type: String, required: true },
    action_value: { type: String, required: true },
  },
  { _id: false }
);

const RoutingRuleSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    tenantId: { type: String, default: 'default', index: true },

    name: { type: String, required: true },
    order: { type: Number, default: 0, index: true },

    condition_type: { type: String },
    condition_value: { type: String },
    action_type: { type: String },
    action_value: { type: String },

    // More structured storage for future rules
    conditions: { type: [ConditionSchema], default: [] },
    actions: { type: [ActionSchema], default: [] },

    is_active: { type: Boolean, default: true },

    created_date: { type: String },
    updated_date: { type: String },
  },
  {
    timestamps: true,
  }
);

export const RoutingRule = mongoose.model('RoutingRule', RoutingRuleSchema);

