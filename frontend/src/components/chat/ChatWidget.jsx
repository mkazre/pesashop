import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { MessageCircle, X, Send, Paperclip, ChevronDown, User, Bot } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ChatWidget = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [visitorId, setVisitorId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showPreChat, setShowPreChat] = useState(false);
  const [preChatData, setPreChatData] = useState({ name: '', email: '' });
  const [unreadCount, setUnreadCount] = useState(0);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Generate or retrieve visitor ID
  useEffect(() => {
    const storedId = localStorage.getItem('chat_visitor_id');
    if (storedId) {
      setVisitorId(storedId);
    } else {
      const newId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chat_visitor_id', newId);
      setVisitorId(newId);
    }
  }, []);

  // Load chat settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/chat/settings`);
        setSettings(response.data.data);
      } catch (error) {
        console.error('Failed to load chat settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!visitorId) return;

    const socket = io(API_URL, {
      auth: { visitorId, isAgent: false },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Chat connected');

      // Initialize visitor on backend
      socket.emit('visitor:pageview', {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('chat:started', (data) => {
      setConversationId(data.conversationId);
      setMessages(data.messages);
      setShowPreChat(false);
    });

    socket.on('message:received', (data) => {
      setMessages(prev => [...prev, data.message]);
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
      playNotificationSound();
    });

    socket.on('message:sent', (data) => {
      setMessages(prev => [...prev, data.message]);
    });

    socket.on('agent:typing', (data) => {
      setAgentTyping(data.isTyping);
    });

    socket.on('agent:joined', (data) => {
      setMessages(prev => [...prev, {
        id: `system_${Date.now()}`,
        senderType: 'system',
        content: `${data.agentName} has joined the conversation`,
        createdAt: new Date()
      }]);
    });

    socket.on('conversation:closed', () => {
      setMessages(prev => [...prev, {
        id: `system_${Date.now()}`,
        senderType: 'system',
        content: 'This conversation has been closed',
        createdAt: new Date()
      }]);
    });

    return () => {
      socket.disconnect();
    };
  }, [visitorId]);

  // Track page changes (SPA-aware)
  useEffect(() => {
    if (!socketRef.current || !isConnected) return;

    let lastUrl = window.location.href;

    const emitPageView = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl || !lastUrl) {
        lastUrl = currentUrl;
        socketRef.current?.emit('visitor:pageview', {
          url: currentUrl,
          title: document.title
        });
      }
    };

    // Intercept pushState/replaceState for React Router navigations
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState = function (...args) { origPush(...args); emitPageView(); };
    history.replaceState = function (...args) { origReplace(...args); emitPageView(); };

    window.addEventListener('popstate', emitPageView);

    // Poll as fallback for any missed navigations
    const poll = setInterval(emitPageView, 3000);

    // Track initial page
    lastUrl = '';
    emitPageView();

    return () => {
      history.pushState = origPush;
      history.replaceState = origReplace;
      window.removeEventListener('popstate', emitPageView);
      clearInterval(poll);
    };
  }, [isConnected]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentTyping]);

  // Auto-open after delay
  useEffect(() => {
    if (settings?.behavior?.autoOpenDelay > 0 && !conversationId) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, settings.behavior.autoOpenDelay * 1000);
      return () => clearTimeout(timer);
    }
  }, [settings, conversationId]);

  const playNotificationSound = () => {
    if (settings?.behavior?.soundEnabled) {
      const audio = new Audio('/chat-notification.mp3');
      audio.play().catch(() => {});
    }
  };

  const handleStartChat = () => {
    if (settings?.behavior?.requireEmail && !preChatData.email) {
      setShowPreChat(true);
      setIsOpen(true);
      return;
    }

    socketRef.current.emit('chat:start', {
      preChatData: preChatData.email ? preChatData : null,
      source: {
        page: window.location.href,
        referrer: document.referrer
      }
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !conversationId) return;

    socketRef.current.emit('message:send', {
      content: inputMessage,
      type: 'text'
    });

    setInputMessage('');
    handleTypingStop();
  };

  const handleTypingStart = () => {
    if (!conversationId) return;

    socketRef.current.emit('typing:start');

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(handleTypingStop, 3000);
  };

  const handleTypingStop = () => {
    if (!conversationId) return;
    socketRef.current.emit('typing:stop');
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    handleTypingStart();
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
      if (!conversationId && !showPreChat) {
        handleStartChat();
      }
    }
  };

  const handlePreChatSubmit = (e) => {
    e.preventDefault();
    handleStartChat();
  };

  // Get appearance settings
  const primaryColor = settings?.appearance?.primaryColor || '#3B82F6';
  const position = settings?.appearance?.position || 'bottom-right';
  const widgetTitle = settings?.text?.widgetTitle || 'Chat with us';
  const widgetSubtitle = settings?.text?.widgetSubtitle || 'We typically reply in minutes';
  const inputPlaceholder = settings?.text?.inputPlaceholder || 'Type your message...';
  const widgetSize = settings?.appearance?.widgetSize || 56;
  const iconSize = Math.round(widgetSize * 0.43);
  const marginTop = settings?.appearance?.marginTop ?? 20;
  const marginBottom = settings?.appearance?.marginBottom ?? 20;
  const marginLeft = settings?.appearance?.marginLeft ?? 20;
  const marginRight = settings?.appearance?.marginRight ?? 20;
  const customIconUrl = settings?.appearance?.customIconUrl || '';

  const positionStyles = {
    'bottom-right': { bottom: marginBottom, right: marginRight },
    'bottom-left': { bottom: marginBottom, left: marginLeft },
    'top-right': { top: marginTop, right: marginRight },
    'top-left': { top: marginTop, left: marginLeft }
  };

  // Default to showing widget if settings haven't loaded
  const isEnabled = settings?.enabled !== false;

  // Hide on admin routes
  const path = location.pathname;
  if (path.startsWith('/admin') || path.startsWith('/chat-admin')) return null;

  if (isEnabled === false) return null;

  return (
    <div className="fixed z-50" style={positionStyles[position] || positionStyles['bottom-right']}>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-white shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${
            isMinimized
              ? 'h-14 w-80 rounded-2xl'
              : 'fixed bottom-0 left-0 right-0 max-h-[70vh] sm:relative sm:bottom-auto sm:left-auto sm:right-auto sm:max-h-none sm:h-[420px] sm:w-96 sm:rounded-2xl rounded-t-2xl'
          }`}
          style={{ borderColor: primaryColor }}
        >
          {/* Header */}
          <div
            className="p-4 flex items-center justify-between text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <div>
                <h3 className="font-semibold text-sm">{widgetTitle}</h3>
                <p className="text-xs opacity-80">{widgetSubtitle}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <ChevronDown size={18} className={isMinimized ? 'rotate-180' : ''} />
              </button>
              <button
                onClick={toggleChat}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Pre-chat Form */}
              {showPreChat ? (
                <div className="p-4 flex-1 overflow-y-auto">
                  <h4 className="font-medium mb-4">Before we start...</h4>
                  <form onSubmit={handlePreChatSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={preChatData.name}
                        onChange={(e) => setPreChatData({ ...preChatData, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                        style={{ focusRingColor: primaryColor }}
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={preChatData.email}
                        onChange={(e) => setPreChatData({ ...preChatData, email: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                        style={{ focusRingColor: primaryColor }}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 px-4 rounded-lg text-white font-medium"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Start Chat
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderType === 'visitor' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            message.senderType === 'visitor'
                              ? 'text-white rounded-br-md'
                              : message.senderType === 'system'
                              ? 'bg-gray-200 text-gray-600 text-sm text-center'
                              : 'bg-white border rounded-bl-md'
                          }`}
                          style={
                            message.senderType === 'visitor'
                              ? { backgroundColor: primaryColor }
                              : {}
                          }
                        >
                          {message.senderType === 'agent' && (
                            <p className="text-xs font-medium text-gray-500 mb-1">
                              {message.agentName}
                            </p>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs mt-1 opacity-60">
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Agent typing indicator */}
                    {agentTyping && (
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
                  <form onSubmit={handleSendMessage} className="p-3 border-t bg-white safe-bottom">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={handleInputChange}
                        onBlur={handleTypingStop}
                        placeholder={inputPlaceholder}
                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 text-sm"
                        style={{ focusRingColor: primaryColor }}
                      />
                      <button
                        type="submit"
                        disabled={!inputMessage.trim() || !conversationId}
                        className="p-2 rounded-full text-white disabled:opacity-50"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Widget Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="relative rounded-full shadow-lg text-white hover:scale-110 transition-transform flex items-center justify-center"
          style={{
            backgroundColor: primaryColor,
            width: widgetSize,
            height: widgetSize
          }}
        >
          {customIconUrl ? (
            <img
              src={customIconUrl}
              alt="Chat"
              style={{ width: iconSize * 1.5, height: iconSize * 1.5 }}
              className="object-contain rounded-full"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            />
          ) : null}
          <MessageCircle size={iconSize} style={customIconUrl ? { display: 'none' } : {}} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
