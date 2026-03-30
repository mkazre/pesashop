const mongoose = require('mongoose');

const chatSettingsSchema = new mongoose.Schema({
  // Widget visibility
  enabled: {
    type: Boolean,
    default: true
  },

  // Appearance
  appearance: {
    // Widget position
    position: {
      type: String,
      enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      default: 'bottom-right'
    },

    // Colors
    primaryColor: {
      type: String,
      default: '#3B82F6' // blue-500
    },
    secondaryColor: {
      type: String,
      default: '#1E40AF' // blue-800
    },
    backgroundColor: {
      type: String,
      default: '#FFFFFF'
    },
    textColor: {
      type: String,
      default: '#1F2937' // gray-800
    },

    // Widget button
    widgetIcon: {
      type: String,
      default: 'chat' // chat, message, support, help
    },
    widgetSize: {
      type: Number,
      default: 56 // pixels
    },

    // Logo/Avatar
    logoUrl: String,
    agentAvatarUrl: String,

    // Margins (pixels)
    marginTop: { type: Number, default: 20 },
    marginBottom: { type: Number, default: 20 },
    marginLeft: { type: Number, default: 20 },
    marginRight: { type: Number, default: 20 },

    // Custom icon image URL
    customIconUrl: String,

    // Border radius
    borderRadius: {
      type: Number,
      default: 16
    }
  },

  // Text content
  text: {
    widgetTitle: {
      type: String,
      default: 'Chat with us'
    },
    widgetSubtitle: {
      type: String,
      default: 'We typically reply in minutes'
    },
    welcomeMessage: {
      type: String,
      default: 'Hi there! 👋 How can we help you today?'
    },
    offlineMessage: {
      type: String,
      default: 'We are currently offline. Leave a message and we will get back to you!'
    },
    inputPlaceholder: {
      type: String,
      default: 'Type your message...'
    },
    sendButtonText: {
      type: String,
      default: 'Send'
    },
    fileButtonText: {
      type: String,
      default: 'Attach file'
    }
  },

  // Behavior
  behavior: {
    // Auto open after seconds (0 = never)
    autoOpenDelay: {
      type: Number,
      default: 0
    },

    // Show on mobile
    showOnMobile: {
      type: Boolean,
      default: true
    },

    // Sound notifications for visitor
    soundEnabled: {
      type: Boolean,
      default: true
    },

    // Require email before chat
    requireEmail: {
      type: Boolean,
      default: false
    },

    // Pre-chat form
    preChatForm: {
      enabled: { type: Boolean, default: false },
      fields: [{
        name: String,
        label: String,
        type: { type: String, enum: ['text', 'email', 'phone', 'textarea'] },
        required: { type: Boolean, default: false }
      }]
    },

    // Pages to show/hide widget
    showOnPages: [String], // empty = all pages
    hideOnPages: [String]
  },

  // Operating hours
  operatingHours: {
    enabled: { type: Boolean, default: false },
    timezone: { type: String, default: 'UTC' },
    schedule: [{
      day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      open: String, // HH:mm format
      close: String,
      closed: { type: Boolean, default: false }
    }]
  },

  // Notifications
  notifications: {
    // Sound for new messages
    soundEnabled: { type: Boolean, default: true },
    soundFile: String,

    // Desktop notifications
    desktopEnabled: { type: Boolean, default: true },

    // Email notifications for offline messages
    emailNotifications: { type: Boolean, default: true },
    notificationEmail: String
  },

  // Canned responses (quick replies)
  cannedResponses: [{
    id: String,
    shortcut: String, // e.g., "/hello"
    message: String,
    category: String
  }],

  // GDPR / Privacy
  privacy: {
    showPrivacyNotice: { type: Boolean, default: false },
    privacyNoticeText: String,
    dataRetentionDays: { type: Number, default: 365 }
  },

  // Custom CSS (advanced)
  customCss: String
}, {
  timestamps: true
});

// Singleton pattern - only one settings document
chatSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('ChatSettings', chatSettingsSchema);
