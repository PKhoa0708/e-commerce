import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { chatAPI, productAPI } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { 
  Send, Search, ArrowLeft, MessageSquare, 
  ShoppingCart, User, ExternalLink, AlertCircle,
  Loader2, Check, CheckCheck
} from 'lucide-react';
import { io } from 'socket.io-client';

const Chat = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, user, isAuthenticated } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext) || {};

  // Socket state
  const [socket, setSocket] = useState(null);

  // Conversations list & states
  const [conversations, setConversations] = useState([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active conversation states
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // Draft conversation states (when entering from "Chat ngay" on ProductDetail)
  const [draftConversation, setDraftConversation] = useState(null);
  const [draftProduct, setDraftProduct] = useState(null);
  const [draftSeller, setDraftSeller] = useState(null);

  // Refs for scrolling
  const messagesEndRef = useRef(null);

  // Connect to Socket.io server
  useEffect(() => {
    if (!token || !user) return;

    const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    const socketInstance = io(socketUrl, {
      transports: ['websocket']
    });

    socketInstance.on('connect', () => {
      console.log('Connected to socket server:', socketInstance.id);
      socketInstance.emit('join_user', user._id || user.id);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // 1. Fetch conversations on load
  const fetchConversations = async (selectId = null) => {
    try {
      if (!token) return;
      const data = await chatAPI.getConversations(token);
      const list = data.conversations || [];
      setConversations(list);

      // If a selectId was requested, make sure to set it as active
      if (selectId && selectId !== 'draft') {
        setActiveConversationId(selectId);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [token]);

  // 2. Fetch product and seller details if URL parameters are present (to initialize a draft chat)
  useEffect(() => {
    const sellerId = searchParams.get('sellerId');
    const productId = searchParams.get('productId');
    
    if (sellerId && token) {
      const initDraftChat = async () => {
        try {
          let prd = null;
          let sel = null;

          if (productId) {
            const data = await productAPI.getById(productId);
            if (data.product) {
              prd = data.product;
              sel = data.product.seller;
            }
          }

          // Check if there is already a conversation with this seller in the current list
          const existing = conversations.find(c => 
            c.participants.some(p => p._id === sellerId)
          );

          if (existing) {
            setActiveConversationId(existing._id);
            setDraftConversation(null);
          } else {
            // Setup draft conversation
            const draft = {
              _id: 'draft',
              participants: [
                user,
                sel || { _id: sellerId, name: 'Người bán', role: 'seller' }
              ],
              product: prd
            };
            setDraftConversation(draft);
            setActiveConversationId('draft');
            setMessages([]);
          }
        } catch (err) {
          console.error('Error initializing draft chat:', err);
        }
      };

      // Only run when conversations list has finished loading
      if (!loadingConv) {
        initDraftChat();
      }
    }
  }, [searchParams, loadingConv, conversations, token]);

  // 3. Load messages when activeConversationId changes
  const fetchMessages = async (isPoll = false) => {
    if (!token || !activeConversationId || activeConversationId === 'draft') return;

    try {
      if (!isPoll) setLoadingMsgs(true);
      const data = await chatAPI.getMessages(token, activeConversationId);
      setMessages(data.messages || []);

      // Mark messages as read
      await chatAPI.markAsRead(token, activeConversationId);
      
      // Update unread status in the sidebar conversation list locally
      setConversations(prev => 
        prev.map(c => c._id === activeConversationId ? { ...c, unreadCount: 0 } : c)
      );
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (!isPoll) setLoadingMsgs(false);
    }
  };

  // 3. Listen to Socket events and manage rooms
  useEffect(() => {
    if (!token || !activeConversationId) return;

    fetchMessages(false);

    if (activeConversationId === 'draft' || !socket) return;

    // Join active conversation room
    socket.emit('join_conversation', activeConversationId);

    // Clean up room when activeConversationId changes
    return () => {
      socket.emit('leave_conversation', activeConversationId);
    };
  }, [activeConversationId, token, socket]);

  // 3.1. Socket Event Listeners for new messages & conversation updates
  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (data) => {
      const { message } = data;
      if (message && message.conversationId === activeConversationId) {
        setMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
    });

    socket.on('conversation_updated', (data) => {
      // Refresh the sidebar conversation list in real-time
      fetchConversations(activeConversationId);
    });

    return () => {
      socket.off('new_message');
      socket.off('conversation_updated');
    };
  }, [socket, activeConversationId]);

  // 4. Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingMsgs]);

  // 5. Send message logic
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      if (activeConversationId === 'draft' && draftConversation) {
        // Send to receiverId with optional productId
        const receiver = getOtherParticipant(draftConversation);
        if (!receiver) {
          throw new Error('Không xác định được người nhận tin nhắn.');
        }
        const receiverId = receiver._id || receiver;
        const product = draftConversation.product;

        const data = await chatAPI.sendMessage(token, {
          receiverId,
          content: textToSend,
          productId: product ? product._id : undefined
        });

        // Clear draft states
        setDraftConversation(null);
        
        // Refresh conversations and select the newly created conversation
        await fetchConversations(data.message.conversationId);
        
        // Fetch new messages
        const msgsData = await chatAPI.getMessages(token, data.message.conversationId);
        setMessages(msgsData.messages || []);
      } else {
        // Send to existing conversation ID
        await chatAPI.sendMessage(token, {
          conversationId: activeConversationId,
          content: textToSend
        });

        // Immediately fetch messages to show the sent message
        fetchMessages(true);

        // Update last message in local conversation list to keep UI responsive
        setConversations(prev => 
          prev.map(c => 
            c._id === activeConversationId 
              ? { ...c, lastMessage: textToSend, lastMessageAt: new Date().toISOString() } 
              : c
          ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
        );
      }
    } catch (err) {
      addToast?.({ message: err.message || 'Lỗi khi gửi tin nhắn.', type: 'error' });
      setInputText(textToSend); // Restore input on error
    } finally {
      setSending(false);
    }
  };

  // Helper: Format message timestamp
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    
    // If today, show hh:mm
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show dd/mm
    if (date.getFullYear() === now.getFullYear()) {
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }
    
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Helper: Format price
  const fmt = (n) => n?.toLocaleString('vi-VN') + ' ₫';

  // Get active conversation metadata
  const getActiveConversationData = () => {
    if (activeConversationId === 'draft') return draftConversation;
    return conversations.find(c => c._id === activeConversationId);
  };

  const activeConvData = getActiveConversationData();
  
  // Get other participant profile details
  const getOtherParticipant = (conv) => {
    if (!conv) return null;
    return conv.participants.find(p => {
      const pId = p._id || p;
      const uId = user?.id || user?._id;
      return pId && uId && pId.toString() !== uId.toString();
    });
  };

  const otherUser = getOtherParticipant(activeConvData);

  // Client-side filtering of conversation list
  const filteredConversations = conversations.filter(c => {
    const other = getOtherParticipant(c);
    if (!other) return false;
    return other.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Navigation Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-[#e47937] transition font-bold text-sm cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </button>
        <h1 className="text-base sm:text-lg font-black text-[#1a3150] flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#e47937]" />
          Kênh Chat UrbanCart
        </h1>
        <div className="w-20"></div> {/* Spacer for alignment */}
      </div>

      {/* Main chat window container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex gap-4 h-[calc(100vh-120px)] min-h-[500px]">
        
        {/* LEFT COLUMN: CONVERSATION LIST */}
        <div className={`w-full md:w-80 lg:w-96 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden ${
          activeConversationId ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Search bar */}
          <div className="p-4 border-b border-slate-50 relative">
            <Search className="absolute left-7 top-7 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-slate-800 placeholder-slate-400 rounded-2xl border border-transparent focus:outline-none focus:bg-white focus:border-[#e47937] text-xs font-semibold transition"
            />
          </div>

          {/* Inbox list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {loadingConv ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#e47937]" />
                <span className="text-xs font-semibold">Đang tải hộp thư...</span>
              </div>
            ) : filteredConversations.length === 0 && !draftConversation ? (
              <div className="p-12 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-bold">Không tìm thấy hội thoại nào</p>
              </div>
            ) : (
              <>
                {/* Draft chat placeholder (placed at the top if present) */}
                {draftConversation && (
                  <div
                    onClick={() => setActiveConversationId('draft')}
                    className={`p-4 flex gap-3 cursor-pointer transition select-none ${
                      activeConversationId === 'draft' ? 'bg-orange-50/50 border-l-4 border-[#e47937]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center font-black text-white text-xs shadow-sm flex-shrink-0">
                      {getOtherParticipant(draftConversation)?.name?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-xs font-black text-slate-800 truncate">
                          {getOtherParticipant(draftConversation)?.name}
                        </h4>
                        <span className="text-[9px] text-[#e47937] font-extrabold uppercase">Mới</span>
                      </div>
                      <p className="text-xs italic text-slate-400 truncate mt-0.5">Tin nhắn nháp chưa gửi...</p>
                    </div>
                  </div>
                )}

                {/* Normal conversations list */}
                {filteredConversations.map((conv) => {
                  const counterpart = getOtherParticipant(conv);
                  if (!counterpart) return null;
                  const isActive = conv._id === activeConversationId;
                  const isUnread = conv.unreadCount > 0;

                  return (
                    <div
                      key={conv._id}
                      onClick={() => {
                        setActiveConversationId(conv._id);
                        setDraftConversation(null); // Clear draft once switching
                      }}
                      className={`p-4 flex gap-3 cursor-pointer transition select-none items-center ${
                        isActive 
                          ? 'bg-orange-50/40 border-l-4 border-[#e47937]' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center font-black text-white text-xs shadow-sm flex-shrink-0">
                        {counterpart.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      
                      {/* Content preview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-xs font-black text-slate-800 truncate">
                            {counterpart.name}
                            {counterpart.role === 'seller' && (
                              <span className="ml-1 px-1 py-0.5 bg-sky-100 text-sky-600 text-[8px] font-black rounded uppercase">Shop</span>
                            )}
                          </h4>
                          <span className="text-[9px] text-slate-400 font-semibold flex-shrink-0">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${
                          isUnread ? 'text-slate-900 font-black' : 'text-slate-400 font-medium'
                        }`}>
                          {conv.lastMessage || 'Chưa có tin nhắn'}
                        </p>
                      </div>

                      {/* Unread badge */}
                      {isUnread && (
                        <span className="w-5 h-5 bg-[#e47937] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CHAT CONVERSATION DETAIL */}
        <div className={`flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden ${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        }`}>
          {activeConversationId ? (
            <>
              {/* Chat Panel Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversationId(null)}
                    className="md:hidden p-1 text-slate-400 hover:text-slate-700 transition"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                      {otherUser?.name || 'Người dùng'}
                      {otherUser?.role === 'seller' && (
                        <span className="px-1.5 py-0.5 bg-sky-100 text-sky-600 text-[9px] font-black rounded-md uppercase tracking-wide">Shop</span>
                      )}
                    </h3>
                    <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                      Đang hoạt động
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Context Banner */}
              {activeConvData?.product && (
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={activeConvData.product.images?.[0] || 'https://placehold.co/100x100?text=No+Image'}
                      alt={activeConvData.product.name}
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-white"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{activeConvData.product.name}</h4>
                      <p className="text-xs font-black text-[#e47937] mt-0.5">{fmt(activeConvData.product.price)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/product/${activeConvData.product._id}`)}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-[10px] font-black text-slate-700 rounded-lg hover:border-[#e47937] hover:text-[#e47937] transition cursor-pointer"
                  >
                    Xem Chi Tiết <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Message List area */}
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50/20 space-y-4">
                {loadingMsgs ? (
                  <div className="h-full flex items-center justify-center text-slate-400 flex-col gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-[#e47937]" />
                    <span className="text-xs font-semibold">Đang tải cuộc hội thoại...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                    <div className="p-4 bg-orange-50 rounded-full mb-3 text-[#e47937]">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700 mb-1">Bắt đầu cuộc trò chuyện</h4>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                      Hãy gửi tin nhắn đầu tiên để kết nối với đối phương về sản phẩm hoặc dịch vụ!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isOwnMessage = msg.sender.toString() === (user.id || user._id).toString();

                    return (
                      <div
                        key={msg._id || idx}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] space-y-0.5`}>
                          <div className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-sm font-medium ${
                            isOwnMessage 
                              ? 'bg-[#1a3150] text-white rounded-tr-none' 
                              : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                          }`}>
                            {msg.content}
                          </div>
                          <div className={`text-[9px] text-slate-400 font-bold px-1.5 flex items-center gap-1 ${
                            isOwnMessage ? 'justify-end' : 'justify-start'
                          }`}>
                            <span>{formatTime(msg.createdAt)}</span>
                            {isOwnMessage && (
                              msg.isRead ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                              ) : (
                                <Check className="w-3 h-3 text-slate-400" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input box */}
              <form 
                onSubmit={handleSendMessage}
                className="p-4 border-t border-slate-100 bg-white flex gap-2 items-center"
              >
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={sending}
                  className="flex-1 px-4 py-3 bg-slate-50 text-slate-800 placeholder-slate-400 rounded-2xl border border-transparent focus:outline-none focus:bg-white focus:border-[#e47937] text-xs font-semibold transition"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-3 bg-[#e47937] text-white hover:bg-[#c96222] transition rounded-2xl flex-shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/10"
                >
                  {sending ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <Send className="w-4.5 h-4.5" />
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Empty state (no chat room selected) */
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/10">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-50 to-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <MessageSquare className="w-10 h-10 text-[#e47937]" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 mb-2">Chào mừng bạn đến với Kênh Chat</h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed font-medium">
                Hãy chọn một cuộc hội thoại từ danh sách bên trái hoặc truy cập trang sản phẩm bất kỳ để trò chuyện trực tiếp với Người bán.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
