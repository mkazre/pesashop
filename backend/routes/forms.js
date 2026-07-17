const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const Form = require('../models/Form');
const FormSubmission = require('../models/FormSubmission');
const Settings = require('../models/Settings');
const emailService = require('../services/emailService');

// Form submissions are public (no login required), so — like reviews.js's
// image upload — this can't reuse /api/media/upload (admin-only). File
// fields are uploaded in the same multipart request as the rest of the
// submission, keyed by the field's _id, so req.files[].path is a real
// filesystem path usable directly as an email attachment (matches the
// pattern in laybyApplications.js) without a second round-trip.
const formUploadDir = path.join(__dirname, '../uploads/forms');
if (!fs.existsSync(formUploadDir)) fs.mkdirSync(formUploadDir, { recursive: true });

const formUploadStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, formUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `form-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});
const uploadFormFiles = multer({ storage: formUploadStorage, limits: { fileSize: 20 * 1024 * 1024 } });

// Same non-ObjectId client-generated _id issue as AppPage/Menu — see
// appPages.js's cleanBlocks() for the original writeup.
function cleanFields(fields) {
  if (!fields || !Array.isArray(fields)) return fields;
  return fields.map((field) => {
    const cleaned = { ...field };
    if (cleaned._id && !/^[0-9a-fA-F]{24}$/.test(cleaned._id.toString())) {
      delete cleaned._id;
    }
    return cleaned;
  });
}

// ── Public ────────────────────────────────────────────────────────

// GET a form's public shape — fields/style only, never notificationEmail
router.get('/public/:id', async (req, res, next) => {
  try {
    const form = await Form.findOne({ _id: req.params.id, status: 'active' })
      .select('title description fields style submitButtonText successMessage');
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    res.json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
});

// POST a submission — multipart/form-data: a "data" field holding a JSON
// string of { fieldId: value }, plus any file fields as actual file parts
// named by their fieldId.
router.post('/:id/submit', uploadFormFiles.any(), async (req, res, next) => {
  try {
    const form = await Form.findOne({ _id: req.params.id, status: 'active' });
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    let data = {};
    try {
      data = req.body.data ? JSON.parse(req.body.data) : req.body;
    } catch (_) {
      data = req.body;
    }

    const files = req.files || [];
    files.forEach((file) => {
      data[file.fieldname] = file.originalname;
    });

    const missing = form.fields.filter(
      (f) => f.required && f.fieldType !== 'section-break' && !data?.[f._id.toString()]
    );
    if (missing.length > 0) {
      return res.status(400).json({ success: false, message: `Missing required field(s): ${missing.map((f) => f.label).join(', ')}` });
    }

    const attachments = files.map((file) => ({
      fieldId: file.fieldname,
      url: `/uploads/forms/${file.filename}`,
      name: file.originalname,
    }));

    const submission = await FormSubmission.create({
      form: form._id,
      data,
      attachments,
    });

    const settings = await Settings.getSettings();
    const notifyEmail = form.notificationEmail || settings.storeEmail;
    if (notifyEmail) {
      const rows = form.fields
        .filter((f) => f.fieldType !== 'section-break')
        .map((f) => `<p><strong>${f.label}:</strong> ${data?.[f._id.toString()] ?? ''}</p>`)
        .join('');
      try {
        await emailService.sendEmail({
          to: notifyEmail,
          subject: `New submission: ${form.title}`,
          html: `<h2>New form submission — ${form.title}</h2>${rows}`,
          attachments: files.map((file) => ({ filename: file.originalname, path: file.path })),
        });
      } catch (mailErr) {
        console.error('Form notification email failed:', mailErr.message);
      }
    }

    if (form.sendConfirmationToSubmitter && form.confirmationEmailField) {
      const submitterEmail = data?.[form.confirmationEmailField];
      if (submitterEmail) {
        try {
          await emailService.sendEmail({
            to: submitterEmail,
            subject: `We received your submission — ${form.title}`,
            html: `<p>Thank you! We've received your submission for <strong>${form.title}</strong>.</p>`,
          });
        } catch (_) {}
      }
    }

    res.status(201).json({ success: true, message: form.successMessage, data: { id: submission._id } });
  } catch (error) {
    next(error);
  }
});

// ── Admin ─────────────────────────────────────────────────────────

router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const forms = await Form.find().select('title status updatedAt fields').sort({ updatedAt: -1 });
    const withCounts = await Promise.all(
      forms.map(async (f) => {
        const submissionCount = await FormSubmission.countDocuments({ form: f._id });
        return { ...f.toObject(), fieldCount: f.fields.length, submissionCount };
      })
    );
    res.json({ success: true, data: withCounts });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    res.json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
});

router.post('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { title, description, fields, style, submitButtonText, successMessage, notificationEmail, sendConfirmationToSubmitter, confirmationEmailField, status } = req.body;
    const form = await Form.create({
      title,
      description: description || '',
      fields: cleanFields(fields || []),
      style: style || {},
      submitButtonText: submitButtonText || 'Submit',
      successMessage: successMessage || 'Thank you! Your submission has been received.',
      notificationEmail: notificationEmail || '',
      sendConfirmationToSubmitter: !!sendConfirmationToSubmitter,
      confirmationEmailField: confirmationEmailField || '',
      status: status || 'active',
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });

    const { title, description, fields, style, submitButtonText, successMessage, notificationEmail, sendConfirmationToSubmitter, confirmationEmailField, status } = req.body;
    if (title !== undefined) form.title = title;
    if (description !== undefined) form.description = description;
    if (fields !== undefined) form.fields = cleanFields(fields);
    if (style !== undefined) form.style = style;
    if (submitButtonText !== undefined) form.submitButtonText = submitButtonText;
    if (successMessage !== undefined) form.successMessage = successMessage;
    if (notificationEmail !== undefined) form.notificationEmail = notificationEmail;
    if (sendConfirmationToSubmitter !== undefined) form.sendConfirmationToSubmitter = sendConfirmationToSubmitter;
    if (confirmationEmailField !== undefined) form.confirmationEmailField = confirmationEmailField;
    if (status !== undefined) form.status = status;

    await form.save();
    res.json({ success: true, data: form, message: 'Form updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const form = await Form.findByIdAndDelete(req.params.id);
    if (!form) return res.status(404).json({ success: false, message: 'Form not found' });
    await FormSubmission.deleteMany({ form: form._id });
    res.json({ success: true, message: 'Form deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/duplicate', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const original = await Form.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Form not found' });

    const duplicate = new Form({
      ...original.toObject(),
      _id: undefined,
      title: `${original.title} (Copy)`,
      createdBy: req.user.id,
      createdAt: undefined,
      updatedAt: undefined,
    });
    await duplicate.save();

    res.status(201).json({ success: true, data: duplicate });
  } catch (error) {
    next(error);
  }
});

// GET submissions for a form (paginated)
router.get('/:id/submissions', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { form: req.params.id };
    const total = await FormSubmission.countDocuments(filter);
    const submissions = await FormSubmission.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: submissions, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/submissions/:submissionId', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const submission = await FormSubmission.findOneAndUpdate(
      { _id: req.params.submissionId, form: req.params.id },
      { status },
      { new: true }
    );
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
    res.json({ success: true, data: submission });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/submissions/:submissionId', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const submission = await FormSubmission.findOneAndDelete({ _id: req.params.submissionId, form: req.params.id });
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
    res.json({ success: true, message: 'Submission deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
