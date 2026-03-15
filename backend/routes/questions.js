const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ProductQuestion = require('../models/ProductQuestion');
const Product = require('../models/Product');

// ── PUBLIC ROUTES ──────────────────────────────────────────────────────────

// GET questions for a product (public, paginated)
router.get('/product/:productId', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort === 'popular' ? { answerCount: -1, createdAt: -1 } : { isPinned: -1, createdAt: -1 };

    const query = { product: req.params.productId, status: 'visible' };

    const [questions, total] = await Promise.all([
      ProductQuestion.find(query)
        .populate('user', 'firstName lastName')
        .populate('answers.user', 'firstName lastName role')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductQuestion.countDocuments(query),
    ]);

    // Filter out hidden/deleted answers for public view
    questions.forEach(q => {
      q.answers = (q.answers || []).filter(a => a.status === 'visible');
    });

    res.json({
      success: true,
      data: questions,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (error) {
    next(error);
  }
});

// POST ask a question (logged in users only)
router.post('/', protect, async (req, res, next) => {
  try {
    const { productId, question, tags } = req.body;

    if (!productId || !question) {
      return res.status(400).json({ success: false, message: 'Product ID and question are required' });
    }
    if (question.length < 5) {
      return res.status(400).json({ success: false, message: 'Question must be at least 5 characters' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Rate limit: max 3 questions per product per user per day
    const oneDayAgo = new Date(Date.now() - 86400000);
    const recentCount = await ProductQuestion.countDocuments({
      product: productId,
      user: req.user._id,
      createdAt: { $gte: oneDayAgo },
    });
    if (recentCount >= 3) {
      return res.status(429).json({ success: false, message: 'You can ask up to 3 questions per product per day' });
    }

    const qa = await ProductQuestion.create({
      product: productId,
      user: req.user._id,
      question,
      tags: tags || [],
    });

    await qa.populate('user', 'firstName lastName');
    res.status(201).json({ success: true, data: qa });
  } catch (error) {
    next(error);
  }
});

// POST answer a question (logged in users — customers and admins)
router.post('/:questionId/answer', protect, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || content.length < 2) {
      return res.status(400).json({ success: false, message: 'Answer must be at least 2 characters' });
    }

    const qa = await ProductQuestion.findById(req.params.questionId);
    if (!qa || qa.status !== 'visible') {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const isAdmin = ['admin', 'shop_manager'].includes(req.user.role);

    qa.answers.push({
      user: req.user._id,
      content,
      isAdminAnswer: isAdmin,
    });

    await qa.save();
    await qa.populate('user', 'firstName lastName');
    await qa.populate('answers.user', 'firstName lastName role');

    res.status(201).json({ success: true, data: qa });
  } catch (error) {
    next(error);
  }
});

// POST vote on an answer
router.post('/:questionId/answers/:answerId/vote', protect, async (req, res, next) => {
  try {
    const { vote } = req.body;
    if (!['helpful', 'unhelpful'].includes(vote)) {
      return res.status(400).json({ success: false, message: 'Vote must be helpful or unhelpful' });
    }

    const qa = await ProductQuestion.findById(req.params.questionId);
    if (!qa) return res.status(404).json({ success: false, message: 'Question not found' });

    const answer = qa.answers.id(req.params.answerId);
    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found' });

    const existingVote = answer.helpfulVotes.find(v => v.user.toString() === req.user._id.toString());
    if (existingVote) {
      existingVote.vote = vote;
    } else {
      answer.helpfulVotes.push({ user: req.user._id, vote });
    }
    answer.helpfulCount = answer.helpfulVotes.filter(v => v.vote === 'helpful').length;
    await qa.save();

    res.json({ success: true, data: { helpfulCount: answer.helpfulCount } });
  } catch (error) {
    next(error);
  }
});

// ── ADMIN ROUTES ──────────────────────────────────────────────────────────

// GET all questions (admin — with filters)
router.get('/admin/all', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.product) query.product = req.query.product;
    if (req.query.unanswered === 'true') query.answerCount = 0;
    if (req.query.search) {
      query.question = { $regex: req.query.search, $options: 'i' };
    }

    const [questions, total] = await Promise.all([
      ProductQuestion.find(query)
        .populate('product', 'name slug images featuredImage')
        .populate('user', 'firstName lastName email')
        .populate('answers.user', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductQuestion.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: questions,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (error) {
    next(error);
  }
});

// GET admin Q&A summary stats
router.get('/admin/stats', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const [total, unanswered, thisWeek, statusCounts] = await Promise.all([
      ProductQuestion.countDocuments(),
      ProductQuestion.countDocuments({ answerCount: 0, status: 'visible' }),
      ProductQuestion.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } }),
      ProductQuestion.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const totalAnswers = await ProductQuestion.aggregate([
      { $project: { answerCount: { $size: '$answers' } } },
      { $group: { _id: null, total: { $sum: '$answerCount' } } },
    ]);

    res.json({
      success: true,
      data: {
        total,
        unanswered,
        thisWeek,
        totalAnswers: totalAnswers[0]?.total || 0,
        byStatus: Object.fromEntries(statusCounts.map(s => [s._id, s.count])),
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT update question status (admin — hide/show/delete)
router.put('/admin/:questionId', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { status, isPinned, isResolved } = req.body;
    const update = {};
    if (status) update.status = status;
    if (isPinned !== undefined) update.isPinned = isPinned;
    if (isResolved !== undefined) update.isResolved = isResolved;

    const qa = await ProductQuestion.findByIdAndUpdate(req.params.questionId, update, { new: true })
      .populate('product', 'name slug images featuredImage')
      .populate('user', 'firstName lastName email')
      .populate('answers.user', 'firstName lastName email role');

    if (!qa) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, data: qa });
  } catch (error) {
    next(error);
  }
});

// DELETE a specific answer (admin)
router.delete('/admin/:questionId/answers/:answerId', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const qa = await ProductQuestion.findById(req.params.questionId);
    if (!qa) return res.status(404).json({ success: false, message: 'Question not found' });

    const answer = qa.answers.id(req.params.answerId);
    if (!answer) return res.status(404).json({ success: false, message: 'Answer not found' });

    answer.status = 'deleted';
    answer.deletedBy = req.user._id;
    answer.deletedAt = new Date();
    await qa.save();

    res.json({ success: true, message: 'Answer deleted' });
  } catch (error) {
    next(error);
  }
});

// DELETE entire question and all answers (admin)
router.delete('/admin/:questionId', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const qa = await ProductQuestion.findByIdAndDelete(req.params.questionId);
    if (!qa) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, message: 'Question and all answers deleted' });
  } catch (error) {
    next(error);
  }
});

// POST bulk delete questions (admin)
router.post('/admin/bulk-delete', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { questionIds } = req.body;
    if (!questionIds?.length) return res.status(400).json({ success: false, message: 'Provide questionIds array' });
    const result = await ProductQuestion.deleteMany({ _id: { $in: questionIds } });
    res.json({ success: true, message: `${result.deletedCount} questions deleted` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
