const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const chatService = require('../services/chatService');

let io;

// Active connections tracking
const connectedVisitors = new Map(); // socketId -> visitorId
const connectedAgents = new Map(); // socketId -> { userId, name }
const agentSockets = new Map(); // userId -> Set of socketIds

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
        if (/^https?:\/\/([a-z0-9-]+\.)?pesashop\.com$/.test(origin)) return callback(null, true);
        const allowed = [process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean);
        if (allowed.includes(origin)) return callback(null, true);
        callback(null, false);
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  // Middleware to authenticate connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const visitorId = socket.handshake.auth.visitorId;
      const isAgent = socket.handshake.auth.isAgent;

      if (isAgent && token) {
        // Authenticate agent
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !['admin', 'shop_manager', 'support'].includes(user.role)) {
          return next(new Error('Unauthorized'));
        }

        socket.userId = user._id.toString();
        socket.userName = user.name || user.email;
        socket.userRole = user.role;
        socket.isAgent = true;

        next();
      } else if (visitorId) {
        // Authenticate visitor
        socket.visitorId = visitorId;
        socket.isAgent = false;

        // Find or create visitor
        let visitor = await Visitor.findOne({ visitorId });
        if (!visitor) {
          visitor = await Visitor.create({
            visitorId,
            ip: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent']
          });
        }

        socket.visitor = visitor;
        next();
      } else {
        next(new Error('Authentication required'));
      }
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (${socket.isAgent ? 'Agent' : 'Visitor'})`);

    if (socket.isAgent) {
      handleAgentConnection(socket);
    } else {
      handleVisitorConnection(socket);
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      handleDisconnection(socket);
    });
  });

  return io;
};

// Handle agent connection
const handleAgentConnection = (socket) => {
  const { userId, userName } = socket;

  connectedAgents.set(socket.id, { userId, name: userName, socketId: socket.id });

  // Track multiple sockets per agent (multiple devices/tabs)
  if (!agentSockets.has(userId)) {
    agentSockets.set(userId, new Set());
  }
  agentSockets.get(userId).add(socket.id);

  // Join agent room for broadcasts
  socket.join('agents');
  socket.join(`agent_${userId}`);

  // Send active visitors list
  sendActiveVisitors(socket);

  // Send active conversations
  sendActiveConversations(socket);

  // Handle agent taking a conversation
  socket.on('conversation:assign', async (data) => {
    try {
      const { conversationId } = data;
      const conversation = await Conversation.findById(conversationId);

      if (conversation) {
        await conversation.assign(userId);

        // Notify all agents
        io.to('agents').emit('conversation:assigned', {
          conversationId,
          agentId: userId,
          agentName: userName
        });

        // Notify visitor
        io.to(`visitor_${conversation.visitorId}`).emit('agent:joined', {
          agentName: userName
        });
      }
    } catch (error) {
      console.error('Assign conversation error:', error);
    }
  });

  // Handle agent message
  socket.on('message:send', async (data) => {
    try {
      const { conversationId, content, type = 'text' } = data;

      const message = await chatService.createMessage({
        conversationId,
        senderType: 'agent',
        agentId: userId,
        agentName: userName,
        content,
        type
      });

      // Send to visitor
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        io.to(`visitor_${conversation.visitorId}`).emit('message:received', {
          message: formatMessage(message),
          agentName: userName
        });
      }

      // Confirm to agent
      socket.emit('message:sent', { message: formatMessage(message) });

      // Broadcast to other agents viewing this conversation
      socket.to(`conversation_${conversationId}`).emit('message:new', {
        message: formatMessage(message)
      });
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('message:error', { error: error.message });
    }
  });

  // Handle typing indicator
  socket.on('typing:start', async (data) => {
    const { conversationId } = data;
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      await Conversation.findByIdAndUpdate(conversationId, {
        'agentTyping.isTyping': true,
        'agentTyping.startedAt': new Date(),
        'agentTyping.agentId': userId
      });

      io.to(`visitor_${conversation.visitorId}`).emit('agent:typing', {
        isTyping: true,
        agentName: userName
      });
    }
  });

  socket.on('typing:stop', async (data) => {
    const { conversationId } = data;
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      await Conversation.findByIdAndUpdate(conversationId, {
        'agentTyping.isTyping': false
      });

      io.to(`visitor_${conversation.visitorId}`).emit('agent:typing', {
        isTyping: false
      });
    }
  });

  // Join conversation room for updates
  socket.on('conversation:join', (data) => {
    const { conversationId } = data;
    socket.join(`conversation_${conversationId}`);
  });

  socket.on('conversation:leave', (data) => {
    const { conversationId } = data;
    socket.leave(`conversation_${conversationId}`);
  });

  // Handle conversation close
  socket.on('conversation:close', async (data) => {
    try {
      const { conversationId } = data;
      const conversation = await Conversation.findById(conversationId);

      if (conversation) {
        await conversation.close(userId);

        io.to(`visitor_${conversation.visitorId}`).emit('conversation:closed');
        io.to('agents').emit('conversation:closed', { conversationId });
      }
    } catch (error) {
      console.error('Close conversation error:', error);
    }
  });
};

// Handle visitor connection
const handleVisitorConnection = (socket) => {
  const { visitorId, visitor } = socket;

  connectedVisitors.set(socket.id, visitorId);

  // Join visitor-specific room
  socket.join(`visitor_${visitorId}`);

  // Update visitor status
  if (visitor) {
    visitor.isOnline = true;
    visitor.socketId = socket.id;
    visitor.lastActivity = new Date();
    visitor.save();
  }

  // Notify agents of new visitor
  socket.to('agents').emit('visitor:new', {
    visitorId,
    currentPage: visitor?.currentPage,
    device: visitor?.device
  });

  // Handle page change
  socket.on('visitor:pageview', async (data) => {
    try {
      const { url, title, referrer } = data;

      const updatedVisitor = await chatService.trackPageView(visitorId, {
        url,
        title,
        referrer
      });

      // Notify agents of page change
      io.to('agents').emit('visitor:pageChanged', {
        visitorId,
        url,
        title,
        timestamp: new Date()
      });

      socket.visitor = updatedVisitor;
    } catch (error) {
      console.error('Pageview tracking error:', error);
    }
  });

  // Handle chat start
  socket.on('chat:start', async (data) => {
    try {
      const { preChatData, source } = data;

      const { conversation, messages } = await chatService.startConversation({
        visitorId,
        userId: visitor?.userId,
        preChatData,
        source
      });

      socket.conversationId = conversation._id.toString();
      socket.join(`conversation_${conversation._id}`);

      // Send confirmation to visitor
      socket.emit('chat:started', {
        conversationId: conversation._id,
        conversationIdStr: conversation.conversationId,
        messages: messages.map(formatMessage)
      });

      // Notify agents of new conversation
      io.to('agents').emit('conversation:new', {
        conversation: formatConversation(conversation),
        visitor: formatVisitor(socket.visitor)
      });
    } catch (error) {
      console.error('Start chat error:', error);
      socket.emit('chat:error', { error: error.message });
    }
  });

  // Handle visitor message
  socket.on('message:send', async (data) => {
    try {
      const { content, type = 'text' } = data;
      const conversationId = socket.conversationId;

      if (!conversationId) {
        return socket.emit('message:error', { error: 'No active conversation' });
      }

      const message = await chatService.createMessage({
        conversationId,
        senderType: 'visitor',
        visitorId,
        content,
        type
      });

      // Send to all agents in conversation room
      io.to(`conversation_${conversationId}`).to('agents').emit('message:received', {
        conversationId,
        message: formatMessage(message),
        visitorId
      });

      // Confirm to visitor
      socket.emit('message:sent', { message: formatMessage(message) });
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('message:error', { error: error.message });
    }
  });

  // Handle visitor typing
  socket.on('typing:start', async () => {
    const conversationId = socket.conversationId;
    if (conversationId) {
      await Conversation.findByIdAndUpdate(conversationId, {
        'visitorTyping.isTyping': true,
        'visitorTyping.startedAt': new Date()
      });

      io.to(`conversation_${conversationId}`).emit('visitor:typing', {
        conversationId,
        isTyping: true,
        visitorId
      });
    }
  });

  socket.on('typing:stop', async () => {
    const conversationId = socket.conversationId;
    if (conversationId) {
      await Conversation.findByIdAndUpdate(conversationId, {
        'visitorTyping.isTyping': false
      });

      io.to(`conversation_${conversationId}`).emit('visitor:typing', {
        conversationId,
        isTyping: false,
        visitorId
      });
    }
  });

  // Handle chat end
  socket.on('chat:end', async () => {
    const conversationId = socket.conversationId;
    if (conversationId) {
      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        await conversation.close();

        io.to(`conversation_${conversationId}`).emit('conversation:ended');
      }
    }
  });
};

// Handle disconnection
const handleDisconnection = (socket) => {
  console.log(`Socket disconnected: ${socket.id}`);

  if (socket.isAgent) {
    const { userId } = socket;
    connectedAgents.delete(socket.id);

    // Remove from agent sockets tracking
    if (agentSockets.has(userId)) {
      agentSockets.get(userId).delete(socket.id);
      if (agentSockets.get(userId).size === 0) {
        agentSockets.delete(userId);
        // Agent fully offline
        io.to('agents').emit('agent:offline', { agentId: userId });
      }
    }
  } else {
    const visitorId = connectedVisitors.get(socket.id);
    connectedVisitors.delete(socket.id);

    if (visitorId) {
      // Mark visitor as offline after a delay
      setTimeout(async () => {
        const stillConnected = Array.from(connectedVisitors.values()).includes(visitorId);
        if (!stillConnected) {
          await Visitor.findOneAndUpdate(
            { visitorId },
            { isOnline: false, socketId: null }
          );

          io.to('agents').emit('visitor:offline', { visitorId });
        }
      }, 5000);
    }
  }
};

// Helper functions
const sendActiveVisitors = async (socket) => {
  try {
    const visitors = await Visitor.find({ isOnline: true })
      .sort({ lastActivity: -1 })
      .limit(50);

    socket.emit('visitors:list', {
      visitors: visitors.map(formatVisitor)
    });
  } catch (error) {
    console.error('Send active visitors error:', error);
  }
};

const sendActiveConversations = async (socket) => {
  try {
    const conversations = await Conversation.find({
      status: { $in: ['active', 'pending', 'waiting'] }
    })
      .populate('visitor', 'visitorId currentPage device name email')
      .populate('assignedTo', 'name email')
      .sort({ lastMessageAt: -1 })
      .limit(50);

    socket.emit('conversations:list', {
      conversations: conversations.map(formatConversation)
    });
  } catch (error) {
    console.error('Send active conversations error:', error);
  }
};

const formatMessage = (message) => ({
  id: message._id,
  conversation: message.conversation,
  senderType: message.senderType,
  agentId: message.agentId,
  agentName: message.agentName,
  content: message.content,
  type: message.type,
  attachments: message.attachments,
  status: message.status,
  createdAt: message.createdAt,
  replyTo: message.replyTo
});

const formatConversation = (conversation) => ({
  id: conversation._id,
  conversationId: conversation.conversationId,
  visitor: conversation.visitor,
  visitorId: conversation.visitorId,
  status: conversation.status,
  assignedTo: conversation.assignedTo,
  assignedAt: conversation.assignedAt,
  lastMessage: conversation.lastMessage,
  lastMessageAt: conversation.lastMessageAt,
  startedAt: conversation.startedAt,
  priority: conversation.priority,
  preChatData: conversation.preChatData,
  stats: conversation.stats,
  visitorTyping: conversation.visitorTyping,
  agentTyping: conversation.agentTyping
});

const formatVisitor = (visitor) => ({
  id: visitor._id,
  visitorId: visitor.visitorId,
  isOnline: visitor.isOnline,
  currentPage: visitor.currentPage,
  pageHistory: visitor.pageHistory?.slice(-5),
  device: visitor.device,
  country: visitor.country,
  city: visitor.city,
  name: visitor.name,
  email: visitor.email,
  lastActivity: visitor.lastActivity,
  userId: visitor.userId,
  sessions: visitor.sessions
});

// Cleanup stale visitors periodically
setInterval(async () => {
  try {
    const cleaned = await Visitor.cleanupStale(5);
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} stale visitors`);

      // Notify agents
      const ioInstance = getIo();
      if (ioInstance) {
        ioInstance.to('agents').emit('visitors:refresh');
      }
    }
  } catch (error) {
    console.error('Cleanup stale visitors error:', error);
  }
}, 60000); // Every minute

const getIo = () => io;

module.exports = {
  initializeSocket,
  getIo
};
