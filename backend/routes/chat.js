const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const chatService = require('../services/chatService');
const ChatSettings = require('../models/ChatSettings');
const Visitor = require('../models/Visitor');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// PUBLIC ROUTES

// Get chat widget settings (public)
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await ChatSettings.getSettings();

    // Only return public-facing settings
    const publicSettings = {
      enabled: settings.enabled,
      appearance: settings.appearance,
      text: settings.text,
      behavior: {
        autoOpenDelay: settings.behavior?.autoOpenDelay,
        showOnMobile: settings.behavior?.showOnMobile,
        soundEnabled: settings.behavior?.soundEnabled,
        requireEmail: settings.behavior?.requireEmail,
        preChatForm: settings.behavior?.preChatForm
      }
    };

    res.json({ success: true, data: publicSettings });
  } catch (error) {
    next(error);
  }
});

// Initialize visitor (public)
router.post('/visitor/init', async (req, res, next) => {
  try {
    const { visitorId, referrer, utmParams, page, title } = req.body;

    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const device = chatService.parseDeviceInfo(userAgent);

    const visitor = await chatService.getOrCreateVisitor(visitorId || chatService.generateVisitorId(), {
      ip,
      userAgent,
      referrer,
      utmParams,
      device
    });

    // Track page view if provided
    if (page) {
      await chatService.trackPageView(visitor.visitorId, { url: page, title });
    }

    res.json({
      success: true,
      data: {
        visitorId: visitor.visitorId,
        isOnline: visitor.isOnline
      }
    });
  } catch (error) {
    next(error);
  }
});

// Track page view (public)
router.post('/visitor/pageview', async (req, res, next) => {
  try {
    const { visitorId, url, title, referrer } = req.body;

    if (!visitorId) {
      return res.status(400).json({ success: false, message: 'visitorId required' });
    }

    const visitor = await chatService.trackPageView(visitorId, { url, title, referrer });

    res.json({
      success: true,
      data: {
        visitorId: visitor.visitorId,
        currentPage: visitor.currentPage
      }
    });
  } catch (error) {
    next(error);
  }
});

// Start conversation (public)
router.post('/conversations/start', async (req, res, next) => {
  try {
    const { visitorId, preChatData, source } = req.body;

    if (!visitorId) {
      return res.status(400).json({ success: false, message: 'visitorId required' });
    }

    const { conversation, messages } = await chatService.startConversation({
      visitorId,
      preChatData,
      source
    });

    res.json({
      success: true,
      data: {
        conversation: {
          id: conversation._id,
          conversationId: conversation.conversationId,
          status: conversation.status,
          startedAt: conversation.startedAt
        },
        messages: messages.map(m => ({
          id: m._id,
          content: m.content,
          senderType: m.senderType,
          createdAt: m.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get conversation history (public - by visitorId)
router.get('/conversations/visitor/:visitorId', async (req, res, next) => {
  try {
    const { visitorId } = req.params;
    const conversations = await chatService.getVisitorConversations(visitorId);

    res.json({
      success: true,
      data: conversations.map(c => ({
        id: c._id,
        conversationId: c.conversationId,
        status: c.status,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        startedAt: c.startedAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// PROTECTED ROUTES (Admin/Agent)

// Get all active visitors
router.get('/admin/visitors', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const visitors = await chatService.getActiveVisitors();

    res.json({
      success: true,
      count: visitors.length,
      data: visitors.map(v => ({
        id: v._id,
        visitorId: v.visitorId,
        isOnline: v.isOnline,
        currentPage: v.currentPage,
        pageHistory: v.pageHistory?.slice(-5),
        device: v.device,
        country: v.country,
        city: v.city,
        name: v.name,
        email: v.email,
        lastActivity: v.lastActivity,
        createdAt: v.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get all conversations
router.get('/admin/conversations', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { status, assignedToMe, limit = 20 } = req.query;

    let query = {};
    if (status) query.status = status;
    if (assignedToMe === 'true') query.assignedTo = req.user._id;

    const conversations = await Conversation.find(query)
      .populate('visitor', 'visitorId name email currentPage device isOnline lastActivity')
      .populate('assignedTo', 'name email')
      .sort({ lastMessageAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: conversations.length,
      data: conversations.map(c => ({
        id: c._id,
        conversationId: c.conversationId,
        visitor: c.visitor,
        status: c.status,
        assignedTo: c.assignedTo,
        assignedAt: c.assignedAt,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        priority: c.priority,
        startedAt: c.startedAt,
        stats: c.stats
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Get single conversation with messages
router.get('/admin/conversations/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit, before } = req.query;

    const { conversation, messages } = await chatService.getConversation(id, {
      limit: parseInt(limit) || 50,
      before
    });

    res.json({
      success: true,
      data: {
        conversation: {
          id: conversation._id,
          conversationId: conversation.conversationId,
          visitor: conversation.visitor,
          userId: conversation.userId,
          status: conversation.status,
          assignedTo: conversation.assignedTo,
          assignedAt: conversation.assignedAt,
          preChatData: conversation.preChatData,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          priority: conversation.priority,
          rating: conversation.rating,
          startedAt: conversation.startedAt,
          endedAt: conversation.endedAt,
          stats: conversation.stats,
          notes: conversation.notes
        },
        messages: messages.map(m => ({
          id: m._id,
          senderType: m.senderType,
          agentId: m.agentId,
          agentName: m.agentName,
          content: m.content,
          type: m.type,
          attachments: m.attachments,
          status: m.status,
          readAt: m.readAt,
          createdAt: m.createdAt,
          replyTo: m.replyTo
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Assign conversation to agent
router.post('/admin/conversations/:id/assign', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const agentId = req.user._id;

    const conversation = await chatService.assignConversation(id, agentId);

    res.json({
      success: true,
      data: {
        id: conversation._id,
        assignedTo: conversation.assignedTo,
        assignedAt: conversation.assignedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Close conversation
router.post('/admin/conversations/:id/close', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const agentId = req.user._id;

    const conversation = await chatService.closeConversation(id, agentId);

    res.json({
      success: true,
      message: 'Conversation closed',
      data: {
        id: conversation._id,
        status: conversation.status,
        endedAt: conversation.endedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Send message as agent
router.post('/admin/conversations/:id/messages', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, type = 'text' } = req.body;
    const agentId = req.user._id;
    const agentName = req.user.name || req.user.email;

    const message = await chatService.createMessage({
      conversationId: id,
      senderType: 'agent',
      agentId,
      agentName,
      content,
      type
    });

    res.json({
      success: true,
      data: {
        id: message._id,
        content: message.content,
        senderType: message.senderType,
        agentName: message.agentName,
        type: message.type,
        status: message.status,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Mark messages as read
router.post('/admin/conversations/:id/read', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    await chatService.markMessagesAsRead(id, req.user._id);

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
});

// Add note to conversation
router.post('/admin/conversations/:id/notes', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const conversation = await Conversation.findByIdAndUpdate(
      id,
      {
        $push: {
          notes: {
            content,
            agentId: req.user._id,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      data: conversation.notes
    });
  } catch (error) {
    next(error);
  }
});

// Get chat statistics
router.get('/admin/stats', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { timeRange = '24h' } = req.query;

    const stats = await chatService.getVisitorStats(timeRange);

    // Additional stats
    const [activeConversations, waitingConversations, avgResponseTime] = await Promise.all([
      Conversation.countDocuments({ status: 'active' }),
      Conversation.countDocuments({ status: 'waiting', assignedTo: { $exists: false } }),
      // Calculate average response time (simplified)
      Conversation.aggregate([
        { $match: { status: 'closed', startedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
        {
          $project: {
            duration: { $subtract: ['$endedAt', '$startedAt'] }
          }
        },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$duration' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        ...stats,
        activeConversations,
        waitingConversations,
        avgConversationDuration: avgResponseTime[0]?.avgDuration || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// CHAT SETTINGS MANAGEMENT

// Get full chat settings (admin)
router.get('/admin/settings', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const settings = await ChatSettings.getSettings();

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

// Update chat settings (admin)
router.put('/admin/settings', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const settings = await ChatSettings.getSettings();

    // Update fields
    const updatableFields = [
      'enabled', 'appearance', 'text', 'behavior',
      'operatingHours', 'notifications', 'cannedResponses', 'privacy', 'customCss'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();

    res.json({
      success: true,
      message: 'Settings updated',
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

// Canned responses management
router.get('/admin/canned-responses', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const settings = await ChatSettings.getSettings();

    res.json({
      success: true,
      data: settings.cannedResponses || []
    });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/canned-responses', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { shortcut, message, category } = req.body;

    const settings = await ChatSettings.getSettings();

    const newResponse = {
      id: `canned_${Date.now()}`,
      shortcut,
      message,
      category
    };

    settings.cannedResponses.push(newResponse);
    await settings.save();

    res.json({
      success: true,
      data: newResponse
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/admin/canned-responses/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const settings = await ChatSettings.getSettings();
    settings.cannedResponses = settings.cannedResponses.filter(r => r.id !== id);
    await settings.save();

    res.json({
      success: true,
      message: 'Canned response deleted'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
