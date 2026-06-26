import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { orderAPI } from '../services/api';
import {
  ArrowLeft, Package, Truck, CheckCircle,
  Clock, XCircle, ShoppingBag, ChevronDown, ChevronUp
} from 'lucide-react';


/* ── Status badge config ── */
const STATUS_CONFIG = {
  pending:   { label: 'Chờ xác nhận', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
  confirmed: { label: 'Đã xác nhận',  color: 'text-blue-600',  bg: 'bg-blue-50',  border: 'border-blue-200',  icon: CheckCircle },
  shipping:  { label: 'Đang giao',     color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: Truck },
  delivered: { label: 'Đã giao',       color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle },
  cancelled: { label: 'Đã hủy',        color: 'text-red-500',   bg: 'bg-red-50',   border: 'border-red-200',   icon: XCircle },
};

const PAYMENT_LABEL = { cod: 'COD', bank: 'Chuyển khoản', momo: 'MoMo' };

const fmt = (n) => (n ?? 0).toLocaleString('vi-VN') + ' ₫';
const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

/* ── Expandable order card ── */
const OrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition duration-200">
      {/* Header row */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${cfg.bg} ${cfg.border} border`}>
            <Package className={`w-4 h-4 ${cfg.color}`} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 font-mono">#{order._id.slice(-8).toUpperCase()}</p>
            <p className="text-sm font-extrabold text-slate-800">{fmtDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
            <StatusIcon className="w-3 h-3" /> {cfg.label}
          </span>
          {/* Total */}
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-400 font-semibold">Tổng tiền</p>
            <p className="text-sm font-black text-[#e47937]">{fmt(order.total)}</p>
          </div>
          {/* Expand icon */}
          {expanded
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
          {/* Items */}
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                  <img
                    src={item.image || item.product?.images?.[0] || 'https://placehold.co/80x80?text=?'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold text-slate-800 line-clamp-1">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {[item.size, item.color].filter(Boolean).join(' · ')} × {item.quantity}
                  </p>
                </div>
                <span className="text-xs font-black text-slate-700 flex-shrink-0">
                  {fmt(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Shipping & payment info */}
          <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="font-black text-slate-500 uppercase tracking-wide mb-1">Giao đến</p>
              <p className="font-extrabold text-slate-800">{order.shippingInfo?.fullName}</p>
              <p className="text-slate-500 font-semibold">{order.shippingInfo?.phone}</p>
              <p className="text-slate-500 font-semibold">{order.shippingInfo?.address}, {order.shippingInfo?.city}</p>
              {order.shippingInfo?.note && (
                <p className="text-slate-400 italic mt-1">"{order.shippingInfo.note}"</p>
              )}
            </div>
            <div>
              <p className="font-black text-slate-500 uppercase tracking-wide mb-1">Thanh toán</p>
              <p className="font-extrabold text-slate-800">{PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Tạm tính</span><span className="font-bold text-slate-700">{fmt(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Phí ship</span>
                  <span className={order.shippingFee === 0 ? 'font-bold text-green-600' : 'font-bold text-slate-700'}>
                    {order.shippingFee === 0 ? 'Miễn phí' : fmt(order.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-black text-slate-800">
                  <span>Tổng cộng</span><span className="text-[#e47937]">{fmt(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main Orders Page ── */
const Orders = () => {
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext) || {};

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const fetch_ = async () => {
      try {
        const data = await orderAPI.getMine(token);
        setOrders(data);
      } catch {
        addToast?.({ message: 'Không thể tải lịch sử đơn hàng.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [token]);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#e47937] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Navigation */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-[#e47937] transition font-bold text-sm cursor-pointer select-none mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            Lịch sử đơn hàng
          </h1>
          <span className="text-sm text-slate-400 font-semibold">{orders.length} đơn</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer select-none border
                ${filter === f.id
                  ? 'bg-[#1a3150] text-white border-[#1a3150] shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
            >
              {f.label}
              {f.id !== 'all' && (
                <span className="ml-1 opacity-60">
                  ({orders.filter(o => o.status === f.id).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
            <ShoppingBag className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <h2 className="text-base font-black text-slate-600 mb-1">
              {filter === 'all' ? 'Bạn chưa có đơn hàng nào' : `Không có đơn hàng "${FILTERS.find(f=>f.id===filter)?.label}"`}
            </h2>
            <p className="text-slate-400 text-xs font-semibold mb-6">
              Hãy khám phá hàng ngàn sản phẩm tại UrbanCart!
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-[#e47937] text-white font-extrabold rounded-full text-xs shadow-lg shadow-orange-500/20 transition cursor-pointer"
            >
              Mua sắm ngay
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
