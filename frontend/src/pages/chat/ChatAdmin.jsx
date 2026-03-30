import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import {
  MessageCircle, Users, Send, Check, CheckCheck, MoreVertical,
  Phone, Mail, Globe, Monitor, Smartphone, Clock, ArrowLeft,
  Search, Filter, Bell, Settings, LogOut, ChevronDown, X
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ChatAdmin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('chat_token'));
  const [socket, setSocket] = useState(null);

  // Data states
  const [conversations, setConversations] = useState([]);
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, waiting, mine
  const [showVisitorPanel, setShowVisitorPanel] = useState(false);
  const [stats, setStats] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    position: 'bottom-right',
    primaryColor: '#2563eb',
    greeting: 'Hi there! How can we help you today?',
    inputPlaceholder: 'Type your message...'
  });

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Check auth on mount
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.data);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('chat_token');
      setToken(null);
    }
  };

  // Initialize socket when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const newSocket = io(API_URL, {
      auth: { token, isAgent: true },
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Agent connected to chat');
    });

    newSocket.on('conversations:list', (data) => {
      setConversations(data.conversations);
    });

    newSocket.on('conversation:new', (data) => {
      setConversations(prev => [data.conversation, ...prev]);
      playNotificationSound();
    });

    newSocket.on('conversation:assigned', (data) => {
      setConversations(prev =>
        prev.map(c =>
          c.id === data.conversationId
            ? { ...c, assignedTo: { _id: data.agentId, name: data.agentName } }
            : c
        )
      );
    });

    newSocket.on('conversation:closed', (data) => {
      setConversations(prev =>
        prev.map(c =>
          c.id === data.conversationId ? { ...c, status: 'closed' } : c
        )
      );
      if (selectedConversation?.id === data.conversationId) {
        setSelectedConversation(null);
      }
    });

    newSocket.on('visitors:list', (data) => {
      setActiveVisitors(data.visitors);
    });

    newSocket.on('visitor:new', (data) => {
      setActiveVisitors(prev => [data, ...prev]);
    });

    newSocket.on('visitor:offline', (data) => {
      setActiveVisitors(prev =>
        prev.filter(v => v.visitorId !== data.visitorId)
      );
    });

    newSocket.on('message:received', (data) => {
      if (selectedConversation?.id === data.conversationId) {
        setMessages(prev => [...prev, data.message]);
      }
      // Update conversation last message
      setConversations(prev =>
        prev.map(c =>
          c.id === data.conversationId
            ? {
                ...c,
                lastMessage: {
                  content: data.message.content,
                  senderType: data.message.senderType,
                  timestamp: new Date()
                }
              }
            : c
        )
      );
      playNotificationSound();
    });

    newSocket.on('visitor:typing', (data) => {
      if (selectedConversation?.visitorId === data.visitorId) {
        setVisitorTyping(data.isTyping);
      }
    });

    return () => newSocket.disconnect();
  }, [isAuthenticated, token]);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedConversation || !token) return;

    const loadMessages = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/chat/admin/conversations/${selectedConversation.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(response.data.data.messages);

        // Join conversation room
        socket?.emit('conversation:join', { conversationId: selectedConversation.id });

        // Mark as read
        socket?.emit('conversation:read', { conversationId: selectedConversation.id });
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();

    return () => {
      socket?.emit('conversation:leave', { conversationId: selectedConversation.id });
    };
  }, [selectedConversation, token, socket]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, visitorTyping]);

  // Load chat settings
  useEffect(() => {
    if (!token) return;

    const loadSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/chat/settings`);
        if (response.data.success) {
          const data = response.data.data;
          setSettings({
            position: data.appearance?.position || 'bottom-right',
            primaryColor: data.appearance?.primaryColor || '#2563eb',
            greeting: data.widget?.greeting || 'Hi there! How can we help you today?',
            inputPlaceholder: data.widget?.inputPlaceholder || 'Type your message...'
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, [token]);
  useEffect(() => {
    if (!token) return;

    const loadStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/chat/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const playNotificationSound = () => {
    const audio = new Audio('/chat-notification.mp3');
    audio.play().catch(() => {});
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      const { token, user } = response.data;

      if (!['admin', 'shop_manager', 'support'].includes(user.role)) {
        throw new Error('Unauthorized role for chat');
      }

      localStorage.setItem('chat_token', token);
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_token');
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
    socket?.disconnect();
  };

  const handleSaveSettings = async () => {
    try {
      await axios.put(`${API_URL}/api/chat/admin/settings`, {
        appearance: {
          position: settings.position,
          primaryColor: settings.primaryColor
        },
        widget: {
          greeting: settings.greeting,
          inputPlaceholder: settings.inputPlaceholder
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleAssignConversation = (conversationId) => {
    socket?.emit('conversation:assign', { conversationId });
  };

  const handleCloseConversation = (conversationId) => {
    socket?.emit('conversation:close', { conversationId });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedConversation) return;

    socket?.emit('message:send', {
      conversationId: selectedConversation.id,
      content: inputMessage,
      type: 'text'
    });

    setInputMessage('');
    handleTypingStop();
  };

  const handleTypingStart = () => {
    if (!selectedConversation) return;

    socket?.emit('typing:start', { conversationId: selectedConversation.id });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(handleTypingStop, 3000);
  };

  const handleTypingStop = () => {
    if (!selectedConversation) return;
    socket?.emit('typing:stop', { conversationId: selectedConversation.id });
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (filter === 'waiting') return conv.status === 'waiting' && !conv.assignedTo;
    if (filter === 'mine') return conv.assignedTo?._id === user?._id;
    return true;
  }).filter(conv => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      conv.visitor?.name?.toLowerCase().includes(search) ||
      conv.visitor?.email?.toLowerCase().includes(search) ||
      conv.visitor?.visitorId?.toLowerCase().includes(search) ||
      conv.lastMessage?.content?.toLowerCase().includes(search)
    );
  });

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <MessageCircle className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Live Chat</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Online
              {stats && (
                <span className="ml-2">
                  • {stats.activeNow} visitors • {stats.activeConversations} chats
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVisitorPanel(!showVisitorPanel)}
            className="p-2 hover:bg-gray-100 rounded-lg relative"
          >
            <Users size={20} />
            {activeVisitors.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                {activeVisitors.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Settings size={20} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Bell size={20} />
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">{user?.name?.[0] || 'A'}</span>
              </div>
              <ChevronDown size={16} />
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border hidden group-hover:block">
              <div className="p-3 border-b">
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-full md:w-80 bg-white border-r flex flex-col">
          {/* Filters */}
          <div className="p-3 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-1">
              {['all', 'waiting', 'mine'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-sm font-medium capitalize ${
                    filter === f
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f}
                  {f === 'waiting' && (
                    <span className="ml-1">
                      {conversations.filter(c => c.status === 'waiting' && !c.assignedTo).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 text-left border-b hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-lg">👤</span>
                      </div>
                      {conv.visitor?.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {conv.visitor?.name || 'Anonymous'}
                        </p>
                        <span className="text-xs text-gray-500">
                          {conv.lastMessageAt && formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {conv.status === 'waiting' && !conv.assignedTo && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            Waiting
                          </span>
                        )}
                        {conv.assignedTo?._id === user?._id && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            Assigned to you
                          </span>
                        )}
                        {conv.visitor?.currentPage && (
                          <span className="text-xs text-gray-400 truncate">
                            {new URL(conv.visitor.currentPage).pathname}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <p className="font-medium">
                    {selectedConversation.visitor?.name || 'Anonymous'}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {selectedConversation.visitor?.isOnline ? (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Online
                      </>
                    ) : (
                      <>
                        <Clock size={14} />
                        Last seen {formatDistanceToNow(new Date(selectedConversation.visitor?.lastActivity))} ago
                      </>
                    )}
                    {selectedConversation.visitor?.currentPage && (
                      <>
                        <Globe size={14} />
                        {new URL(selectedConversation.visitor.currentPage).pathname}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!selectedConversation.assignedTo && (
                  <button
                    onClick={() => handleAssignConversation(selectedConversation.id)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Take Chat
                  </button>
                )}
                <button
                  onClick={() => setShowVisitorPanel(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Users size={20} />
                </button>
                <button
                  onClick={() => handleCloseConversation(selectedConversation.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-red-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderType === 'agent' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.senderType === 'agent'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : message.senderType === 'system'
                        ? 'bg-gray-200 text-gray-600 text-sm text-center mx-auto'
                        : 'bg-white border rounded-bl-md'
                    }`}
                  >
                    {message.senderType === 'visitor' && (
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {selectedConversation.visitor?.name || 'Visitor'}
                      </p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs opacity-60">
                        {format(new Date(message.createdAt), 'HH:mm')}
                      </span>
                      {message.senderType === 'agent' && (
                        <>
                          {message.status === 'read' ? (
                            <CheckCheck size={12} className="opacity-60" />
                          ) : (
                            <Check size={12} className="opacity-60" />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Visitor typing */}
              {visitorTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    handleTypingStart();
                  }}
                  onBlur={handleTypingStop}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Select a conversation to start chatting</p>
              <p className="text-sm text-gray-400 mt-1">
                {conversations.filter(c => c.status === 'waiting' && !c.assignedTo).length} chats waiting
              </p>
            </div>
          </div>
        )}

        {/* Settings Panel (slide-over) */}
        {showSettings && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowSettings(false)}
            />
            <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold">Chat Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 space-y-6">
                {/* Position Setting */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Widget Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['bottom-right', 'bottom-left', 'top-right', 'top-left'].map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setSettings({ ...settings, position: pos })}
                        className={`p-3 border rounded-lg text-sm capitalize ${
                          settings.position === pos
                            ? 'bg-blue-100 border-blue-500 text-blue-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pos.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      placeholder="#2563eb"
                    />
                  </div>
                </div>

                {/* Greeting Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Greeting Message
                  </label>
                  <textarea
                    value={settings.greeting}
                    onChange={(e) => setSettings({ ...settings, greeting: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm h-20 resize-none"
                    placeholder="Hi there! How can we help you today?"
                  />
                </div>

                {/* Input Placeholder */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Input Placeholder
                  </label>
                  <input
                    type="text"
                    value={settings.inputPlaceholder}
                    onChange={(e) => setSettings({ ...settings, inputPlaceholder: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Type your message..."
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveSettings}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Login Screen Component
const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Chat Login</h1>
          <p className="text-gray-500">Sign in to access live chat</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAdmin;
