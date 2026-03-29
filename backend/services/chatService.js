const Visitor = require('../models/Visitor');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ChatSettings = require('../models/ChatSettings');

class ChatService {
  // Track a page view for a visitor
  async trackPageView(visitorId, { url, title, referrer }) {
    let visitor = await Visitor.findOne({ visitorId });

    if (!visitor) {
      // Parse device info from user agent
      const device = this.parseDeviceInfo(visitor.userAgent);

      visitor = await Visitor.create({
        visitorId,
        ip: null, // Will be set on socket connection
        userAgent: null,
        device,
        currentPage: url,
        pageHistory: [{ url, title, timestamp: new Date() }],
        referrer,
        isOnline: true,
        lastActivity: new Date()
      });
    } else {
      await visitor.markActive(url, title);
    }

    return visitor;
  }

  // Create or get visitor
  async getOrCreateVisitor(visitorId, { ip, userAgent, referrer, utmParams, device }) {
    let visitor = await Visitor.findOne({ visitorId });

    if (visitor) {
      // Update existing visitor
      visitor.ip = ip || visitor.ip;
      visitor.userAgent = userAgent || visitor.userAgent;
      visitor.device = device || visitor.device;
      visitor.referrer = referrer || visitor.referrer;
      if (utmParams) {
        visitor.utmSource = utmParams.source || visitor.utmSource;
        visitor.utmMedium = utmParams.medium || visitor.utmMedium;
        visitor.utmCampaign = utmParams.campaign || visitor.utmCampaign;
      }
      visitor.isOnline = true;
      visitor.lastActivity = new Date();
      await visitor.save();
    } else {
      // Create new visitor
      visitor = await Visitor.create({
        visitorId,
        ip,
        userAgent,
        device,
        referrer,
        utmSource: utmParams?.source,
        utmMedium: utmParams?.medium,
        utmCampaign: utmParams?.campaign,
        isOnline: true,
        lastActivity: new Date()
      });
    }

    return visitor;
  }

  // Start a new conversation
  async startConversation({ visitorId, userId, preChatData, source }) {
    // Find or create visitor
    let visitor = await Visitor.findOne({ visitorId });

    if (!visitor) {
      throw new Error('Visitor not found');
    }

    // Update visitor with pre-chat data
    if (preChatData) {
      visitor.name = preChatData.name || visitor.name;
      visitor.email = preChatData.email || visitor.email;
      visitor.phone = preChatData.phone || visitor.phone;
      await visitor.save();
    }

    // Check for existing active conversation
    let conversation = await Conversation.findOne({
      visitor: visitor._id,
      status: { $in: ['active', 'pending', 'waiting'] }
    });

    if (conversation) {
      // Return existing conversation with messages
      const messages = await Message.find({ conversation: conversation._id })
        .sort({ createdAt: 1 })
        .limit(100);

      return { conversation, messages };
    }

    // Create new conversation
    conversation = await Conversation.create({
      visitor: visitor._id,
      visitorId: visitor.visitorId,
      userId,
      preChatData,
      source,
      status: 'pending',
      startedAt: new Date()
    });

    // Get welcome message from settings
    const settings = await ChatSettings.getSettings();
    const welcomeMessage = settings?.text?.welcomeMessage ||
      'Hi there! 👋 How can we help you today?';

    // Create welcome message
    const welcomeMsg = await Message.create({
      conversation: conversation._id,
      senderType: 'system',
      content: welcomeMessage,
      type: 'text'
    });

    // Update conversation last message
    conversation.lastMessage = {
      content: welcomeMessage,
      senderType: 'system',
      timestamp: new Date()
    };
    await conversation.save();

    return { conversation, messages: [welcomeMsg] };
  }

  // Create a message
  async createMessage({ conversationId, senderType, visitorId, agentId, agentName, content, type = 'text', attachments = [] }) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      senderType,
      visitorId,
      agentId,
      agentName,
      content,
      type,
      attachments,
      status: 'sent'
    });

    // Update conversation stats and last message
    conversation.lastMessage = {
      content: content.substring(0, 200),
      senderType,
      timestamp: new Date()
    };
    conversation.lastMessageAt = new Date();

    if (senderType === 'visitor') {
      conversation.stats.visitorMessages += 1;
    } else if (senderType === 'agent') {
      conversation.stats.agentMessages += 1;
    }
    conversation.stats.totalMessages += 1;

    // If visitor sends message and no agent assigned, mark as waiting
    if (senderType === 'visitor' && !conversation.assignedTo) {
      conversation.status = 'waiting';
    }

    await conversation.save();

    return message;
  }

  // Get conversation with messages
  async getConversation(conversationId, options = {}) {
    const { limit = 50, before } = options;

    const conversation = await Conversation.findById(conversationId)
      .populate('visitor', 'visitorId name email currentPage device isOnline')
      .populate('assignedTo', 'name email');

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Build query for messages
    const query = { conversation: conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('replyTo');

    return {
      conversation,
      messages: messages.reverse() // Return in chronological order
    };
  }

  // Get visitor conversations
  async getVisitorConversations(visitorId, options = {}) {
    const { status, limit = 20 } = options;

    const query = { visitorId };
    if (status) {
      query.status = status;
    }

    const conversations = await Conversation.find(query)
      .populate('assignedTo', 'name email')
      .sort({ lastMessageAt: -1 })
      .limit(limit);

    return conversations;
  }

  // Get conversations for agent
  async getAgentConversations(agentId, options = {}) {
    const { status, limit = 20 } = options;

    const query = {};
    if (status) {
      query.status = status;
    }

    // If agent specified, get their assigned conversations + unassigned waiting ones
    if (agentId) {
      if (status === 'waiting' || status === 'pending') {
        // Get unassigned waiting conversations
        query.assignedTo = { $exists: false };
      } else {
        // Get conversations assigned to this agent
        query.assignedTo = agentId;
      }
    }

    const conversations = await Conversation.find(query)
      .populate('visitor', 'visitorId name email currentPage device isOnline lastActivity')
      .populate('assignedTo', 'name email')
      .sort({ lastMessageAt: -1 })
      .limit(limit);

    return conversations;
  }

  // Assign conversation to agent
  async assignConversation(conversationId, agentId) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    await conversation.assign(agentId);

    // Create system message
    await Message.create({
      conversation: conversationId,
      senderType: 'system',
      content: 'An agent has joined the conversation',
      type: 'text'
    });

    return conversation;
  }

  // Close conversation
  async closeConversation(conversationId, agentId) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    await conversation.close(agentId);

    // Create system message
    await Message.create({
      conversation: conversationId,
      senderType: 'system',
      content: 'This conversation has been closed',
      type: 'text'
    });

    return conversation;
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId, readerId) {
    await Message.updateMany(
      {
        conversation: conversationId,
        senderType: { $ne: 'visitor' },
        status: { $ne: 'read' }
      },
      {
        status: 'read',
        readAt: new Date()
      }
    );

    return { success: true };
  }

  // Get active visitors
  async getActiveVisitors(limit = 50) {
    return await Visitor.find({ isOnline: true })
      .sort({ lastActivity: -1 })
      .limit(limit);
  }

  // Get visitor statistics
  async getVisitorStats(timeRange = '24h') {
    const now = new Date();
    let startTime;

    switch (timeRange) {
      case '1h':
        startTime = new Date(now - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now - 24 * 60 * 60 * 1000);
    }

    const [totalVisitors, activeNow, conversationsStarted, messagesSent] = await Promise.all([
      Visitor.countDocuments({ createdAt: { $gte: startTime } }),
      Visitor.countDocuments({ isOnline: true }),
      Conversation.countDocuments({ startedAt: { $gte: startTime } }),
      Message.countDocuments({ createdAt: { $gte: startTime } })
    ]);

    return {
      totalVisitors,
      activeNow,
      conversationsStarted,
      messagesSent,
      timeRange
    };
  }

  // Parse device info from user agent
  parseDeviceInfo(userAgent) {
    if (!userAgent) return { type: 'desktop', browser: 'unknown', os: 'unknown' };

    const ua = userAgent.toLowerCase();

    // Detect device type
    let type = 'desktop';
    if (/mobile|android|iphone|ipad|ipod/.test(ua)) {
      type = /ipad|tablet/.test(ua) ? 'tablet' : 'mobile';
    }

    // Detect browser
    let browser = 'unknown';
    if (/chrome/.test(ua)) browser = 'Chrome';
    else if (/firefox/.test(ua)) browser = 'Firefox';
    else if (/safari/.test(ua)) browser = 'Safari';
    else if (/edge/.test(ua)) browser = 'Edge';
    else if (/opera/.test(ua)) browser = 'Opera';

    // Detect OS
    let os = 'unknown';
    if (/windows/.test(ua)) os = 'Windows';
    else if (/macintosh|mac os/.test(ua)) os = 'macOS';
    else if (/linux/.test(ua)) os = 'Linux';
    else if (/android/.test(ua)) os = 'Android';
    else if (/iphone|ipad|ios/.test(ua)) os = 'iOS';

    return { type, browser, os };
  }

  // Generate unique visitor ID
  generateVisitorId() {
    return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new ChatService();
