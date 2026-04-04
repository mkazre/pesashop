import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";
import { chatAPI } from "@/services/api";
import { colors, resolveImageUrl } from "@/theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [agentTyping, setAgentTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const [settings, setSettings] = useState<any>(null);
  const [showPreChat, setShowPreChat] = useState(false);
  const [preName, setPreName] = useState("");
  const [preEmail, setPreEmail] = useState("");
  const [connected, setConnected] = useState(false);
  const [starting, setStarting] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<FlatList<any>>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load settings
  useEffect(() => {
    chatAPI.getSettings().then((res) => {
      setSettings(res.data?.data || res.data);
    }).catch(() => {});
  }, []);

  // Init visitor ID
  useEffect(() => {
    AsyncStorage.getItem("chat_visitor_id").then((stored) => {
      if (stored) {
        setVisitorId(stored);
      } else {
        const newId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        AsyncStorage.setItem("chat_visitor_id", newId);
        setVisitorId(newId);
      }
    });
  }, []);

  // Socket connection
  useEffect(() => {
    if (!visitorId) return;

    const socket = io(API_URL, {
      auth: { visitorId, isAgent: false },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("visitor:pageview", { url: "mobile-app", title: "Mobile App" });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("chat:started", (data: any) => {
      setConversationId(data.conversationId);
      setMessages(data.messages || []);
      setShowPreChat(false);
      setStarting(false);
    });

    socket.on("message:received", (data: any) => {
      setMessages((prev) => [...prev, data.message]);
      if (!open) setUnread((u) => u + 1);
    });

    socket.on("message:sent", (data: any) => {
      setMessages((prev) => [...prev, data.message]);
    });

    socket.on("agent:typing", (data: any) => setAgentTyping(data.isTyping));

    socket.on("agent:joined", (data: any) => {
      setMessages((prev) => [
        ...prev,
        { id: `sys_${Date.now()}`, senderType: "system", content: `${data.agentName} joined the conversation`, createdAt: new Date() },
      ]);
    });

    socket.on("conversation:closed", () => {
      setMessages((prev) => [
        ...prev,
        { id: `sys_${Date.now()}`, senderType: "system", content: "This conversation has been closed.", createdAt: new Date() },
      ]);
    });

    return () => { socket.disconnect(); };
  }, [visitorId]);

  const startChat = () => {
    if (!socketRef.current) return;
    setStarting(true);
    socketRef.current.emit("chat:start", {
      preChatData: preEmail ? { name: preName, email: preEmail } : null,
      source: { page: "mobile-app" },
    });
  };

  const openChat = () => {
    setOpen(true);
    setUnread(0);
    if (!conversationId && !showPreChat) {
      const needsEmail = settings?.behavior?.requireEmail;
      if (needsEmail) {
        setShowPreChat(true);
      } else {
        startChat();
      }
    }
  };

  const sendMessage = () => {
    if (!input.trim() || !conversationId || !socketRef.current) return;
    socketRef.current.emit("message:send", { content: input.trim(), type: "text" });
    setInput("");
    if (typingTimer.current) clearTimeout(typingTimer.current);
    socketRef.current.emit("typing:stop");
  };

  const handleInputChange = (text: string) => {
    setInput(text);
    if (!conversationId || !socketRef.current) return;
    socketRef.current.emit("typing:start");
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit("typing:stop");
    }, 3000);
  };

  const primaryColor = settings?.appearance?.primaryColor || colors.primary;
  const widgetTitle = settings?.text?.widgetTitle || "Chat with us";
  const widgetSubtitle = settings?.text?.widgetSubtitle || "We typically reply in minutes";
  const inputPlaceholder = settings?.text?.inputPlaceholder || "Type your message...";
  const customIconUrl = settings?.appearance?.customIconUrl || "";
  const isEnabled = settings?.enabled !== false;

  if (!isEnabled && settings !== null) return null;

  const renderMessage = ({ item }: any) => {
    const isVisitor = item.senderType === "visitor";
    const isSystem = item.senderType === "system";
    if (isSystem) {
      return (
        <View style={cs.systemMsgWrap}>
          <Text style={cs.systemMsg}>{item.content}</Text>
        </View>
      );
    }
    return (
      <View style={[cs.msgRow, isVisitor ? cs.msgRowRight : cs.msgRowLeft]}>
        <View style={[cs.bubble, isVisitor ? { backgroundColor: primaryColor } : cs.bubbleAgent]}>
          {!isVisitor && item.agentName && (
            <Text style={cs.agentName}>{item.agentName}</Text>
          )}
          <Text style={[cs.bubbleText, isVisitor && { color: "#fff" }]}>{item.content}</Text>
          <Text style={[cs.msgTime, isVisitor && { color: "rgba(255,255,255,0.7)" }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Floating button */}
      <Pressable
        onPress={openChat}
        style={[cs.fab, { backgroundColor: primaryColor }]}
      >
        {customIconUrl
          ? <Image source={{ uri: resolveImageUrl(customIconUrl) }} style={{ width: 28, height: 28 }} contentFit="contain" />
          : <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />}
        {unread > 0 && (
          <View style={cs.badge}>
            <Text style={cs.badgeText}>{unread > 9 ? "9+" : unread}</Text>
          </View>
        )}
      </Pressable>

      {/* Chat modal */}
      <Modal visible={open} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={cs.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={cs.sheet}
          >
            {/* Header */}
            <View style={[cs.header, { backgroundColor: primaryColor }]}>
              <View style={cs.headerLeft}>
                <View style={cs.onlineDot} />
                <View>
                  <Text style={cs.headerTitle}>{widgetTitle}</Text>
                  <Text style={cs.headerSub}>{widgetSubtitle}</Text>
                </View>
              </View>
              <Pressable onPress={() => setOpen(false)} style={cs.closeBtn}>
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            </View>

            {/* Pre-chat form */}
            {showPreChat ? (
              <View style={cs.preChatBody}>
                <Text style={cs.preChatTitle}>Before we start...</Text>
                <Text style={cs.fieldLabel}>Name</Text>
                <TextInput
                  style={cs.input}
                  value={preName}
                  onChangeText={setPreName}
                  placeholder="Your name"
                  placeholderTextColor={colors.gray400}
                />
                <Text style={cs.fieldLabel}>Email *</Text>
                <TextInput
                  style={cs.input}
                  value={preEmail}
                  onChangeText={setPreEmail}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.gray400}
                />
                <Pressable
                  onPress={startChat}
                  disabled={!preEmail || starting}
                  style={[cs.startBtn, { backgroundColor: primaryColor }, (!preEmail || starting) && { opacity: 0.5 }]}
                >
                  {starting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={cs.startBtnText}>Start Chat</Text>}
                </Pressable>
              </View>
            ) : (
              <>
                {/* Messages */}
                <FlatList
                  ref={listRef}
                  data={messages}
                  keyExtractor={(m) => m.id || m._id || String(m.createdAt)}
                  renderItem={renderMessage}
                  contentContainerStyle={cs.messagesList}
                  onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                  ListEmptyComponent={
                    starting
                      ? <View style={cs.connectingWrap}><ActivityIndicator color={primaryColor} /><Text style={cs.connectingText}>Connecting...</Text></View>
                      : <View style={cs.connectingWrap}><Text style={cs.connectingText}>Start your conversation below.</Text></View>
                  }
                  ListFooterComponent={
                    agentTyping ? (
                      <View style={cs.typingWrap}>
                        <View style={cs.typingBubble}>
                          <View style={[cs.typingDot, { animationDelay: "0ms" }]} />
                          <View style={[cs.typingDot, { animationDelay: "150ms" }]} />
                          <View style={[cs.typingDot, { animationDelay: "300ms" }]} />
                        </View>
                      </View>
                    ) : null
                  }
                />

                {/* Input */}
                <View style={cs.inputRow}>
                  <TextInput
                    style={cs.textInput}
                    value={input}
                    onChangeText={handleInputChange}
                    placeholder={inputPlaceholder}
                    placeholderTextColor={colors.gray400}
                    multiline
                    maxLength={1000}
                  />
                  <Pressable
                    onPress={sendMessage}
                    disabled={!input.trim() || !conversationId}
                    style={[cs.sendBtn, { backgroundColor: primaryColor }, (!input.trim() || !conversationId) && { opacity: 0.4 }]}
                  >
                    <Ionicons name="send" size={18} color="#fff" />
                  </Pressable>
                </View>
              </>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const cs = StyleSheet.create({
  fab: { position: "absolute", bottom: 90, right: 16, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 8, zIndex: 999 },
  badge: { position: "absolute", top: -4, right: -4, backgroundColor: "#ef4444", borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },

  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { backgroundColor: colors.white, height: "75%", borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: "hidden" },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80" },
  headerTitle: { fontSize: 15, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 1 },
  closeBtn: { padding: 4 },

  messagesList: { padding: 16, flexGrow: 1 },
  msgRow: { marginBottom: 8 },
  msgRowLeft: { alignItems: "flex-start" },
  msgRowRight: { alignItems: "flex-end" },
  bubble: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleAgent: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200 },
  agentName: { fontSize: 10, fontWeight: "600", color: colors.gray500, marginBottom: 2 },
  bubbleText: { fontSize: 14, color: colors.gray900, lineHeight: 20 },
  msgTime: { fontSize: 10, color: colors.gray400, marginTop: 4, textAlign: "right" },
  systemMsgWrap: { alignItems: "center", marginVertical: 6 },
  systemMsg: { fontSize: 11, color: colors.gray500, backgroundColor: colors.gray100, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },

  typingWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  typingBubble: { flexDirection: "row", gap: 4, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray200, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, alignSelf: "flex-start" },
  typingDot: { width: 8, height: 8, backgroundColor: colors.gray400, borderRadius: 4 },

  connectingWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 12 },
  connectingText: { fontSize: 13, color: colors.gray400 },

  inputRow: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.gray100, backgroundColor: colors.white, gap: 8 },
  textInput: { flex: 1, backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray200, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: colors.gray900, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },

  preChatBody: { flex: 1, padding: 20 },
  preChatTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.gray700, marginBottom: 4, marginTop: 12 },
  input: { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray200, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, color: colors.gray900 },
  startBtn: { paddingVertical: 14, alignItems: "center", justifyContent: "center", marginTop: 20 },
  startBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
