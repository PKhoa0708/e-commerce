import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { orderAPI } from '../services/api';
import {
  ArrowLeft, Package, User, Phone, MapPin, Truck, CheckCircle, Clock, XCircle, ChevronDown, ShoppingBag, CreditCard
} from 'lucide-react';

/* ── Status configurations ── */
const STATUS_CONFIG = {
  pending:   { label: 'Chờ xác nhận', color: 'text-amber-600', bg: 'bg-gradient-to-r from-amber-50 to-orange-50/50', border: 'border-amber-200/70', icon: Clock },
  confirmed: { label: 'Đã xác nhận',  color: 'text-blue-600',  bg: 'bg-gradient-to-r from-blue-50 to-indigo-50/50',  border: 'border-blue-200/70',  icon: CheckCircle },
  shipping:  { label: 'Đang giao',     color: 'text-indigo-600', bg: 'bg-gradient-to-r from-indigo-50 to-purple-50/50', border: 'border-indigo-200/70', icon: Truck },
  delivered: { label: 'Đã giao',       color: 'text-green-600', bg: 'bg-gradient-to-r from-green-50 to-emerald-50/50', border: 'border-green-200/70', icon: CheckCircle },
  cancelled: { label: 'Đã hủy',        color: 'text-red-500',   bg: 'bg-gradient-to-r from-red-50 to-rose-50/50',   border: 'border-red-200/70',   icon: XCircle },
};

const PAYMENT_CONFIG = {
  cod:   { label: 'Thanh toán COD', bg: 'bg-slate-100/80', text: 'text-slate-600', border: 'border-slate-200/50' },
  bank:  { label: 'Chuyển khoản NH', bg: 'bg-blue-50/80', text: 'text-blue-600', border: 'border-blue-200/50' },
  vnpay: { label: 'Cổng VNPay', bg: 'bg-sky-50/80', text: 'text-sky-600', border: 'border-sky-200/50' },
  momo:  { label: 'Ví MoMo', bg: 'bg-pink-50/80', text: 'text-pink-600', border: 'border-pink-200/50' }
};

const fmt = (n) => (n ?? 0).toLocaleString('vi-VN') + ' ₫';
const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/* ── Expandable order card for Seller ── */
const SellerOrderCard = ({ order, currentUserId, onUpdateStatus, isActionLoading }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  // Filter items in the order that belong to this seller
  const sellerItems = order.items.filter(item => {
    const sellerId = item.product?.seller?._id || item.product?.seller || '';
    return sellerId.toString() === currentUserId?.toString();
  });

  // Calculate the subtotal for this seller's products in the order
  const sellerSubtotal = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const payCfg = PAYMENT_CONFIG[order.paymentMethod] || {
    label: order.paymentMethod?.toUpperCase() || 'Khác',
    bg: 'bg-slate-100/80',
    text: 'text-slate-600',
    border: 'border-slate-200/50'
  };

  return (
    <div className={`group bg-white/70 backdrop-blur-md rounded-3xl border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden hover:shadow-[0_12px_30px_rgba(0,0,0,0.05)] hover:border-slate-200/60 hover:scale-[1.005] transition-all duration-300 ${expanded ? 'shadow-[0_12px_30px_rgba(0,0,0,0.06)] border-slate-200/80 bg-white' : ''}`}>
      {/* Header Summary Row */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-5 cursor-pointer select-none gap-4 active:bg-slate-50/50 transition-colors duration-150"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${cfg.bg} ${cfg.border} border shadow-sm transition-transform duration-300 group-hover:scale-105`}>
            <Package className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold font-mono text-[10px] tracking-wider">
                #{order._id.slice(-8).toUpperCase()}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-semibold">{fmtDate(order.createdAt)}</span>
            </div>
            <p className="text-sm font-extrabold text-slate-800 mt-1">
              Khách hàng: <span className="font-bold text-[#1a3150]">{order.shippingInfo?.fullName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100/80">
          <div className="flex items-center gap-4">
            {/* Status Badge */}
            <span className={`flex items-center gap-1.5 text-[10px] font-black tracking-wide px-3.5 py-1.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm`}>
              <StatusIcon className="w-3.5 h-3.5" /> {cfg.label}
            </span>
            
            {/* Seller Items Total Value */}
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Doanh thu bán</p>
              <p className="text-base font-black text-[#e47937] tracking-tight">{fmt(sellerSubtotal)}</p>
            </div>
          </div>

          {/* Chevron Toggle */}
          <div className="p-1 rounded-full hover:bg-slate-100 transition-colors duration-200">
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ease-out ${expanded ? 'rotate-180 text-orange-500' : ''}`} />
          </div>
        </div>
      </div>

      {/* Expanded Content Details with CSS Grid smooth height transition */}
      <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-slate-100/80 px-6 pb-6 pt-5 space-y-5 bg-slate-50/30">
            
            {/* Customer Details Section */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-[#1a3150] pl-2">Thông tin người mua</h4>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{order.shippingInfo?.fullName}</span>
                  {order.user?.email && <span className="text-[10px] text-slate-400 font-normal">({order.user.email})</span>}
                </div>
                <div className="flex items-center gap-2.5 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{order.shippingInfo?.phone}</span>
                </div>
              </div>
              <div className="space-y-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-orange-500 pl-2">Địa chỉ nhận hàng</h4>
                <div className="flex items-start gap-2.5 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{order.shippingInfo?.address}, {order.shippingInfo?.city}</span>
                </div>
                {order.shippingInfo?.note && (
                  <p className="text-slate-400 italic text-[11px] font-medium pl-6 bg-slate-50 py-1.5 px-3 rounded-lg border-l-2 border-slate-200">
                    " {order.shippingInfo.note} "
                  </p>
                )}
              </div>
            </div>

            {/* List of Products (Filtered to Seller's Own Products) */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">Sản phẩm từ cửa hàng của bạn ({sellerItems.length})</h4>
              
              <div className="divide-y divide-slate-100">
                {sellerItems.map((item, idx) => (
                  <div key={idx} className="group/item flex items-center gap-4 py-3 first:pt-0 last:pb-0 hover:bg-slate-50/40 rounded-xl px-2 -mx-2 transition-colors duration-200">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-100 shadow-sm">
                      <img
                        src={item.image || 'https://placehold.co/80x80?text=?'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 line-clamp-1 group-hover/item:text-[#e47937] transition-colors duration-200">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">
                        {[item.size, item.color].filter(Boolean).join(' · ')} × {item.quantity}
                      </p>
                    </div>
                    <span className="text-xs font-black text-slate-700 flex-shrink-0 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {fmt(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Subtotal row */}
              <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs font-black text-slate-800">
                <span className="text-slate-500">Tạm tính bán sản phẩm:</span>
                <span className="text-[#e47937] text-base font-black tracking-tight">{fmt(sellerSubtotal)}</span>
              </div>
            </div>

            {/* Checkout Totals & Status Updates Toolbar */}
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              
              {/* Payment Method Details */}
              <div className="text-xs font-semibold flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-black uppercase tracking-wider mb-0.5">Thanh toán</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${payCfg.bg} ${payCfg.text} ${payCfg.border} shadow-sm`}>
                      {payCfg.label}
                    </span>
                    <span className="text-slate-500 font-bold">Tổng tiền cả đơn: <strong className="text-slate-800 font-extrabold">{fmt(order.total)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Seller Action Buttons for Fulfillment Status updates */}
              <div className="flex items-center gap-2.5 flex-wrap md:justify-end">
                {order.status === 'pending' && (
                  <>
                    <button
                      disabled={isActionLoading}
                      onClick={() => onUpdateStatus(order._id, 'cancelled')}
                      className="px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      Hủy đơn
                    </button>
                    <button
                      disabled={isActionLoading}
                      onClick={() => onUpdateStatus(order._id, 'confirmed')}
                      className="px-4.5 py-2 bg-gradient-to-r from-[#1a3150] to-[#2b4c78] hover:shadow-[#1a3150]/15 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      Xác nhận đơn hàng
                    </button>
                  </>
                )}

                {order.status === 'confirmed' && (
                  <button
                    disabled={isActionLoading}
                    onClick={() => onUpdateStatus(order._id, 'shipping')}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#e47937] to-[#f49357] hover:shadow-orange-500/15 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4" /> Bắt đầu giao hàng
                  </button>
                )}

                {order.status === 'shipping' && (
                  <button
                    disabled={isActionLoading}
                    onClick={() => onUpdateStatus(order._id, 'delivered')}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-green-500/15 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Hoàn thành giao hàng
                  </button>
                )}

                {order.status === 'delivered' && (
                  <div className="flex items-center gap-2 text-green-600 text-xs font-black bg-green-50 border border-green-200 px-4 py-2.5 rounded-xl shadow-sm">
                    <CheckCircle className="w-4 h-4" /> Đơn hàng đã giao thành công
                  </div>
                )}

                {order.status === 'cancelled' && (
                  <div className="flex items-center gap-2 text-red-500 text-xs font-black bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl shadow-sm">
                    <XCircle className="w-4 h-4" /> Đơn hàng đã bị hủy
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main SellerOrders Page Component ── */
const SellerOrders = () => {
  const navigate = useNavigate();
  const { token, user, isAuthenticated } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext) || {};

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  // Load seller orders on mount
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderAPI.getSellerOrders(token);
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching seller orders:', err);
      addToast?.({ message: 'Không thể tải đơn hàng được mua.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [token, isAuthenticated]);

  // Update order status
  const handleUpdateStatus = async (orderId, nextStatus) => {
    setActionLoading(true);
    try {
      await orderAPI.updateStatus(token, orderId, nextStatus);
      addToast?.({ message: 'Cập nhật trạng thái đơn hàng thành công!', type: 'success' });
      // Reload orders list
      const data = await orderAPI.getSellerOrders(token);
      setOrders(data || []);
    } catch (err) {
      console.error('Error updating order status:', err);
      addToast?.({ message: err.message || 'Lỗi cập nhật trạng thái đơn.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const FILTERS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ xác nhận' },
    { id: 'confirmed', label: 'Đã xác nhận' },
    { id: 'shipping', label: 'Đang giao' },
    { id: 'delivered', label: 'Đã giao' },
    { id: 'cancelled', label: 'Đã hủy' },
  ];

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/30 to-purple-200/20 blur-3xl -z-10" />
        <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-gradient-to-bl from-orange-100/40 to-amber-200/20 blur-3xl -z-10" />
        
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-100/80 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-orange-500 border-r-amber-500 rounded-full animate-spin" />
          </div>
          <p className="text-slate-500 font-bold text-sm tracking-wide animate-pulse">Đang tải danh sách đơn hàng mua...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans pb-20 relative overflow-hidden">
      {/* Dynamic inline styles for smooth animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.06); opacity: 0.65; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/30 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-gradient-to-bl from-orange-100/50 to-amber-200/30 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-blue-100/30 to-teal-100/20 blur-3xl -z-10 pointer-events-none" />

      {/* Navigation Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 mb-8 relative z-10">
        <button
          onClick={() => navigate('/my-products')}
          className="group flex items-center gap-2 text-slate-500 hover:text-[#e47937] transition-all font-bold text-sm cursor-pointer select-none mb-4 active:scale-95 duration-200"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" /> Quay lại Kênh người bán
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 bg-clip-text text-transparent">
              Đơn Hàng Được Mua
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-semibold">Theo dõi và cập nhật trạng thái vận đơn cho sản phẩm của bạn.</p>
          </div>
          <span className="text-xs bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50 text-[#e47937] font-black px-4.5 py-2.5 rounded-full self-start sm:self-center shadow-sm hover:shadow-md transition-all duration-300">
            {orders.length} Đơn hàng
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 relative z-10">
        
        {/* State filter buttons */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 px-1 scrollbar-none select-none">
          {FILTERS.map((f) => {
            const count = f.id === 'all' ? orders.length : orders.filter(o => o.status === f.id).length;
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex-shrink-0 px-4.5 py-2.5 rounded-full text-xs font-black transition-all duration-200 cursor-pointer active:scale-95 hover:scale-[1.02] border
                  ${isActive
                    ? 'bg-gradient-to-r from-[#1a3150] to-[#2b4c78] text-white border-transparent shadow-sm shadow-[#1a3150]/20'
                    : 'bg-white/80 backdrop-blur-md text-slate-500 border-slate-200/60 hover:text-slate-700 hover:border-slate-300 hover:bg-white shadow-sm'}`}
              >
                {f.label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Orders list render */}
        {filtered.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-md rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-16 text-center transition-all duration-300 hover:shadow-lg">
            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-50 to-slate-100/50 border border-slate-100/80 shadow-inner">
              <ShoppingBag className="w-10 h-10 text-slate-300/80 animate-float" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-400 animate-ping" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-400" />
            </div>
            <h2 className="text-base font-black text-slate-700 mb-1">
              {filter === 'all'
                ? 'Không có đơn mua nào'
                : `Không có đơn hàng nào ở trạng thái "${FILTERS.find(f => f.id === filter)?.label}"`}
            </h2>
            <p className="text-slate-400 text-xs font-semibold mb-2 max-w-sm mx-auto leading-relaxed">
              Các đơn hàng khách mua sản phẩm của bạn sẽ tự động hiển thị tại đây.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((order) => (
              <SellerOrderCard
                key={order._id}
                order={order}
                currentUserId={user?.id || user?._id}
                onUpdateStatus={handleUpdateStatus}
                isActionLoading={actionLoading}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default SellerOrders;
