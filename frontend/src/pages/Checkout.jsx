import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { orderAPI, addressAPI } from '../services/api';
import {
  ArrowLeft, MapPin, Phone, User, CreditCard,
  Wallet, Truck, ShieldCheck, Package, ChevronRight, Plus
} from 'lucide-react';

const SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 30000;

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, subtotal, clearCart } = useContext(CartContext);
  const { addToast } = useContext(ToastContext) || {};
  const { user, token } = useContext(AuthContext);

  const shippingFee = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;
  const fmt = (n) => n.toLocaleString('vi-VN') + ' ₫';

  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: '',
    address: '',
    city: '',
    note: '',
    paymentMethod: 'cod', // 'cod' | 'bank' | 'momo'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address integration states
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (!token) return;
      try {
        setLoadingAddresses(true);
        const data = await addressAPI.getAll(token);
        setSavedAddresses(data || []);
        
        // Auto-select default address if it exists
        const defaultAddr = data.find(addr => addr.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id);
          
          // Find matching city from the CITIES list
          const matchedCity = CITIES.find(c => 
            defaultAddr.detailAddress.toLowerCase().includes(c.toLowerCase())
          ) || '';
          
          setForm(prev => ({
            ...prev,
            fullName: defaultAddr.receiverName,
            phone: defaultAddr.receiverPhone,
            address: defaultAddr.detailAddress,
            city: matchedCity
          }));
        }
      } catch (err) {
        console.error('Lỗi khi tải địa chỉ đã lưu:', err);
      } finally {
        setLoadingAddresses(false);
      }
    };
    
    fetchSavedAddresses();
  }, [token]);

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id);
    const matchedCity = CITIES.find(c => 
      addr.detailAddress.toLowerCase().includes(c.toLowerCase())
    ) || '';
    
    setForm(prev => ({
      ...prev,
      fullName: addr.receiverName,
      phone: addr.receiverPhone,
      address: addr.detailAddress,
      city: matchedCity
    }));
    setErrors({});
  };

  const handleUseCustomAddress = () => {
    setSelectedAddressId('custom');
    setForm(prev => ({
      ...prev,
      fullName: user?.name || '',
      phone: '',
      address: '',
      city: ''
    }));
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    
    // Clear selectedAddressId if user modifies address fields manually
    if (['fullName', 'phone', 'address', 'city'].includes(name)) {
      setSelectedAddressId(null);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên.';
    if (!form.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại.';
    else if (!/^(0[3-9]\d{8})$/.test(form.phone.trim())) newErrors.phone = 'Số điện thoại không hợp lệ.';
    if (!form.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ.';
    if (!form.city.trim()) newErrors.city = 'Vui lòng chọn tỉnh/thành phố.';
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      addToast?.({ message: 'Vui lòng điền đầy đủ thông tin!', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Map cart items sang format API
      const items = cartItems.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        image: item.product.images?.[0] || '',
        price: item.product.price,
        quantity: item.quantity,
        size: item.size || '',
        color: item.color || '',
      }));

      const res = await orderAPI.create(token, {
        items,
        shippingInfo: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city,
          note: form.note.trim(),
        },
        paymentMethod: form.paymentMethod,
      });

      clearCart();
      if (form.paymentMethod === 'vnpay' && res.paymentUrl) {
        addToast?.({ message: '🔄 Đang chuyển hướng đến cổng thanh toán VNPay...', type: 'info', duration: 3000 });
        window.location.href = res.paymentUrl;
      } else {
        addToast?.({ message: '🎉 Đặt hàng thành công! Cảm ơn bạn đã mua sắm.', type: 'success', duration: 5000 });
        navigate('/order-success');
      }
    } catch (e) {
      addToast?.({ message: e.message || 'Lỗi đặt hàng.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentOptions = [
    {
      id: 'cod',
      icon: <Wallet className="w-5 h-5 text-[#e47937]" />,
      label: 'Thanh toán khi nhận hàng (COD)',
      desc: 'Trả tiền mặt khi giao hàng đến tận tay',
    },
    {
      id: 'bank',
      icon: <CreditCard className="w-5 h-5 text-blue-500" />,
      label: 'Chuyển khoản ngân hàng',
      desc: 'Vietcombank · Techcombank · BIDV',
    },
    {
      id: 'momo',
      icon: (
        <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">M</span>
      ),
      label: 'Ví MoMo',
      desc: 'Thanh toán nhanh qua ứng dụng MoMo',
    },
    {
      id: 'vnpay',
      icon: (
        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">VN</span>
      ),
      label: 'Cổng thanh toán VNPay',
      desc: 'Thanh toán trực tiếp qua Thẻ ATM / QR Code / Internet Banking',
    },
  ];

  const CITIES = [
    'Hà Nội','TP. Hồ Chí Minh','Đà Nẵng','Hải Phòng','Cần Thơ',
    'An Giang','Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu',
    'Bắc Ninh','Bến Tre','Bình Định','Bình Dương','Bình Phước',
    'Bình Thuận','Cà Mau','Cao Bằng','Đắk Lắk','Đắk Nông',
    'Điện Biên','Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang',
    'Hà Nam','Hà Tĩnh','Hải Dương','Hậu Giang','Hòa Bình',
    'Hưng Yên','Khánh Hòa','Kiên Giang','Kon Tum','Lai Châu',
    'Lâm Đồng','Lạng Sơn','Lào Cai','Long An','Nam Định',
    'Nghệ An','Ninh Bình','Ninh Thuận','Phú Thọ','Phú Yên',
    'Quảng Bình','Quảng Nam','Quảng Ngãi','Quảng Ninh','Quảng Trị',
    'Sóc Trăng','Sơn La','Tây Ninh','Thái Bình','Thái Nguyên',
    'Thanh Hóa','Thừa Thiên Huế','Tiền Giang','Trà Vinh','Tuyên Quang',
    'Vĩnh Long','Vĩnh Phúc','Yên Bái',
  ];

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="text-center bg-white rounded-3xl border border-slate-100 shadow-xl p-10 max-w-sm w-full">
          <Package className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-black text-slate-800 mb-2">Giỏ hàng trống</h1>
          <p className="text-slate-400 text-sm mb-6">Không có sản phẩm để thanh toán.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-[#1a3150] text-white font-extrabold rounded-full text-sm cursor-pointer"
          >
            Mua sắm ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 mb-8">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-slate-500 hover:text-[#e47937] transition font-bold text-sm cursor-pointer select-none mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại giỏ hàng
        </button>

        {/* Breadcrumb steps */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-4">
          <span className="text-[#e47937] font-black">Giỏ hàng</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800 font-black underline underline-offset-2">Thông tin giao hàng</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Thanh toán</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── LEFT: Form ── */}
        <div className="lg:col-span-3 space-y-6">

          {/* Delivery info card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-orange-50 rounded-lg">
                <MapPin className="w-4 h-4 text-[#e47937]" />
              </div>
              <h2 className="text-base font-black text-slate-800">Thông tin giao hàng</h2>
            </div>

            {/* Saved Addresses Selector */}
            {savedAddresses.length > 0 && (
              <div className="space-y-2.5 pb-4 border-b border-slate-100">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Địa chỉ đã lưu của bạn
                </span>
                {loadingAddresses ? (
                  <div className="flex items-center gap-2 py-4">
                    <div className="w-4 h-4 border-2 border-[#e47937] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-slate-400">Đang tải địa chỉ...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr._id;
                      return (
                        <div
                          key={addr._id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition select-none flex flex-col justify-between text-left
                            ${isSelected 
                              ? 'border-[#e47937] bg-orange-50/30 ring-2 ring-orange-100/50' 
                              : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-800">{addr.receiverName}</span>
                              <span className="text-[10px] text-slate-300">•</span>
                              <span className="text-xs font-semibold text-slate-500">{addr.receiverPhone}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold mt-1.5 line-clamp-2">
                              {addr.detailAddress}
                            </p>
                          </div>
                          {addr.isDefault && (
                            <div className="mt-2.5">
                              <span className="px-2 py-0.5 bg-[#e47937]/10 text-[#e47937] text-[9px] font-black rounded-full uppercase tracking-wider">
                                Mặc định
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Manual input card */}
                    <div
                      onClick={handleUseCustomAddress}
                      className={`p-4 rounded-2xl border-2 border-dashed cursor-pointer transition select-none flex flex-col justify-center items-center text-center min-h-[90px]
                        ${selectedAddressId === 'custom'
                          ? 'border-[#e47937] bg-orange-50/30'
                          : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50 bg-white'}`}
                    >
                      <Plus className={`w-5 h-5 mb-1 ${selectedAddressId === 'custom' ? 'text-[#e47937]' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-700">Sử dụng địa chỉ khác</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">Nhập thủ công địa chỉ mới</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Full name */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide">
                <User className="w-3.5 h-3.5" /> Họ và tên
              </label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className={`w-full border ${errors.fullName ? 'border-red-400 bg-red-50' : 'border-slate-200'} 
                  rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 
                  placeholder:text-slate-300 focus:outline-none focus:border-[#e47937] focus:ring-2 focus:ring-orange-100 transition`}
              />
              {errors.fullName && <p className="text-xs text-red-500 font-semibold">{errors.fullName}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide">
                <Phone className="w-3.5 h-3.5" /> Số điện thoại
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0912345678"
                className={`w-full border ${errors.phone ? 'border-red-400 bg-red-50' : 'border-slate-200'} 
                  rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 
                  placeholder:text-slate-300 focus:outline-none focus:border-[#e47937] focus:ring-2 focus:ring-orange-100 transition`}
              />
              {errors.phone && <p className="text-xs text-red-500 font-semibold">{errors.phone}</p>}
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5" /> Tỉnh / Thành phố
              </label>
              <select
                name="city"
                value={form.city}
                onChange={handleChange}
                className={`w-full border ${errors.city ? 'border-red-400 bg-red-50' : 'border-slate-200'} 
                  rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 bg-white
                  focus:outline-none focus:border-[#e47937] focus:ring-2 focus:ring-orange-100 transition cursor-pointer`}
              >
                <option value="">-- Chọn tỉnh/thành phố --</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.city && <p className="text-xs text-red-500 font-semibold">{errors.city}</p>}
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5" /> Địa chỉ cụ thể
              </label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="123 Đường ABC, Phường XYZ, Quận 1"
                className={`w-full border ${errors.address ? 'border-red-400 bg-red-50' : 'border-slate-200'} 
                  rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 
                  placeholder:text-slate-300 focus:outline-none focus:border-[#e47937] focus:ring-2 focus:ring-orange-100 transition`}
              />
              {errors.address && <p className="text-xs text-red-500 font-semibold">{errors.address}</p>}
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Ghi chú cho người giao (tuỳ chọn)
              </label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                rows={2}
                placeholder="Giao giờ hành chính, gọi trước 30 phút..."
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 
                  placeholder:text-slate-300 focus:outline-none focus:border-[#e47937] focus:ring-2 focus:ring-orange-100 transition resize-none"
              />
            </div>
          </div>

          {/* Payment method card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <CreditCard className="w-4 h-4 text-blue-500" />
              </div>
              <h2 className="text-base font-black text-slate-800">Phương thức thanh toán</h2>
            </div>
            <div className="space-y-3">
              {paymentOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition
                    ${form.paymentMethod === opt.id
                      ? 'border-[#e47937] bg-orange-50'
                      : 'border-slate-100 hover:border-slate-300 bg-white'}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={opt.id}
                    checked={form.paymentMethod === opt.id}
                    onChange={handleChange}
                    className="accent-[#e47937] w-4 h-4 flex-shrink-0"
                  />
                  {opt.icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-slate-800">{opt.label}</p>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Order review ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sticky top-6 space-y-5">
            <h2 className="text-base font-black text-slate-800 border-b border-slate-100 pb-3">
              Xem lại đơn hàng ({cartItems.length} sản phẩm)
            </h2>

            {/* Mini product list */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              {cartItems.map((item) => (
                <div key={`${item.product._id}-${item.size}-${item.color}`} className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img
                      src={item.product.images?.[0] || 'https://placehold.co/80x80?text=?'}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-700 line-clamp-1">{item.product.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {[item.size, item.color].filter(Boolean).join(' · ')} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-black text-slate-800 flex-shrink-0">
                    {fmt(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2.5">
              <div className="flex justify-between text-sm font-semibold text-slate-600">
                <span>Tạm tính</span>
                <span className="font-extrabold text-slate-800">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-slate-600">
                <span className="flex items-center gap-1.5"><Truck className="w-4 h-4" />Phí vận chuyển</span>
                {shippingFee === 0
                  ? <span className="font-extrabold text-green-600">Miễn phí</span>
                  : <span className="font-extrabold text-slate-800">{fmt(shippingFee)}</span>
                }
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                <span className="text-base font-black text-slate-800">Tổng cộng</span>
                <span className="text-xl font-black text-[#e47937]">{fmt(total)}</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3">
              <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-[11px] text-slate-500 font-semibold">
                Đơn hàng được bảo vệ bởi chính sách đổi trả trong 7 ngày.
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 bg-[#e47937] hover:bg-[#c96222] disabled:bg-slate-300 disabled:cursor-not-allowed
                text-white font-extrabold rounded-full text-sm shadow-lg shadow-orange-500/20 
                transition cursor-pointer select-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                <>Đặt hàng ngay ({fmt(total)})</>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
