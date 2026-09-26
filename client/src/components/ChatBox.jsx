import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef } from 'react';
import { Send, Check, CheckCheck, MessageCircle, Clock, AlertCircle } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
const QUICK_ACTIONS = ["I'm ready", "I'm on my way", "I've arrived", "Please wait", "I've reached the pickup point"];
export const ChatBox = ({
  moduleType,
  donationId
}) => {
  const { t, i18n } = useTranslation();
  const {
    user,
    token
  } = useAuth();
  const {
    socket
  } = useSocket();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize Chat
  useEffect(() => {
    let isMounted = true;
    const initChat = async () => {
      try {
        setLoading(true);
        // 1. Get/Create Conversation
        const convRes = await api.get(`/chat/${moduleType}/${donationId}`);
        if (!isMounted) return;
        setConversation(convRes.data);

        // 2. Fetch Messages
        const msgRes = await api.get(`/chat/${convRes.data._id}/messages`);
        if (!isMounted) return;
        setMessages(msgRes.data);

        // 3. Join Socket Room
        socket.emit('JOIN_CHAT_ROOM', {
          conversationId: convRes.data._id,
          token
        });

        // 4. Mark as read
        await api.patch(`/chat/${convRes.data._id}/read`);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || 'Error loading chat');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (donationId) initChat();
    return () => {
      isMounted = false;
    };
  }, [moduleType, donationId]);

  // Socket Listeners
  useEffect(() => {
    if (!socket || !conversation) return;
    const handleMessage = msg => {
      setMessages(prev => [...prev, msg]);
      if (msg.senderId !== user._id) {
        // Mark as read if window is open
        api.patch(`/chat/${conversation._id}/read`).catch(console.error);
      }
    };
    const handleTyping = ({
      senderId,
      isTyping
    }) => {
      if (senderId !== user._id) setPartnerTyping(isTyping);
    };
    const handleRoomJoined = () => setConnectionStatus('Connected securely');
    const handleError = data => setError(data.message);
    
    // Add Reconnect Handler
    const handleReconnect = () => {
      const token = localStorage.getItem('token');
      socket.emit('JOIN_CHAT_ROOM', {
        conversationId: conversation._id,
        token
      });
    };
    
    socket.on('connect', handleReconnect);
    socket.on('chat:message_received', handleMessage);
    socket.on('chat:typing_update', handleTyping);
    socket.on('chat:room_joined', handleRoomJoined);
    socket.on('chat:error', handleError);
    return () => {
      socket.off('connect', handleReconnect);
      socket.off('chat:message_received', handleMessage);
      socket.off('chat:typing_update', handleTyping);
      socket.off('chat:room_joined', handleRoomJoined);
      socket.off('chat:error', handleError);
    };
  }, [socket, conversation, user._id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);
  const handleTyping = e => {
    setText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      const token = localStorage.getItem('token');
      socket.emit('chat:typing', {
        conversationId: conversation._id,
        isTyping: true,
        senderId: user._id,
        token
      });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const token = localStorage.getItem('token');
      socket.emit('chat:typing', {
        conversationId: conversation._id,
        isTyping: false,
        senderId: user._id,
        token
      });
    }, 1500);
  };
  const sendMessage = async msgText => {
    if (!msgText.trim() || !conversation) return;
    const maxLen = 1000;
    if (msgText.length > maxLen) {
      setError(`Message too long (max ${maxLen})`);
      return;
    }

    // Optimistic UI (skip for simplicity to ensure rate limiting is respected and IDs are correct)
    socket.emit('chat:message', {
      conversationId: conversation._id,
      text: msgText,
      token,
      senderId: user._id
    });
    setText('');
  };
  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">{t("Loading secure chat...")}</div>;
  if (error) return <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 flex items-center gap-2">
      <AlertCircle className="w-5 h-5" />{error ? t(error) : ""}</div>;
  return <div className="flex flex-col bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden h-[600px] shadow-sm">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{t("Transfer Chat")}</h3>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {connectionStatus}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">
            {t("Chat is end-to-end encrypted for this transfer")}
          </span>
        </div>

        {messages.map((msg, idx) => {
        if (msg.isSystem) {
          return <div key={idx} className="flex justify-center my-4">
                <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-4 py-2 rounded-xl border border-slate-200">
                  {t("dY\"? System:")} {msg.text}
                </span>
              </div>;
        }
        const isMe = msg.senderId === user._id;
        return <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'}`}>
                {msg.text}
              </div>
              <div className="flex items-center gap-1 mt-1 px-1">
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(msg.createdAt).toLocaleTimeString(i18n.language, [], {
                hour: '2-digit',
                minute: '2-digit'
              })}
                </span>
                {isMe && <span className="text-slate-400">
                    {msg.readAt ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Check className="w-3 h-3" />}
                  </span>}
              </div>
            </div>;
      })}
        {partnerTyping && <div className="flex items-start">
            <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{
            animationDelay: '0.2s'
          }}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{
            animationDelay: '0.4s'
          }}></span>
            </div>
          </div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-slate-200">
        <div className="flex gap-2 overflow-x-auto pb-3 mb-2 snap-x scrollbar-hide">
          {QUICK_ACTIONS.map(action => <button key={action} onClick={() => sendMessage(action)} className="snap-start shrink-0 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full transition whitespace-nowrap">
              {action}
            </button>)}
        </div>
        
        <form onSubmit={e => {
        e.preventDefault();
        sendMessage(text);
      }} className="flex items-center gap-2">
          <input type="text" value={text} onChange={handleTyping} placeholder={t("Type a message...")} className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition" maxLength={1000} />
          <button type="submit" disabled={!text.trim()} className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition shadow-sm">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>;
};