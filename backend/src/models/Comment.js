import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
  {
    id: { type: String, index: true, unique: true },
    tenantId: { type: String, default: 'default', index: true },

    entity_type: { type: String, required: true, index: true }, // e.g. 'task'
    entity_id: { type: String, required: true, index: true },

    comment_text: { type: String, required: true },
    activity_type: { type: String, default: 'comment' },
    is_system: { type: Boolean, default: false },

    user_id: { type: String },
    user_name: { type: String },

    created_date: { type: String },
    updated_date: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Comment = mongoose.model('Comment', CommentSchema);

