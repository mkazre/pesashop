const mongoose = require('mongoose');

const formSubmissionSchema = new mongoose.Schema({
  form: { type: mongoose.Schema.Types.ObjectId, ref: 'Form', required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }, // { fieldId: value }
  attachments: [{ fieldId: String, url: String, name: String }],
  status: { type: String, enum: ['new', 'read', 'archived'], default: 'new' },
}, { timestamps: true });

formSubmissionSchema.index({ form: 1, createdAt: -1 });

module.exports = mongoose.model('FormSubmission', formSubmissionSchema);
