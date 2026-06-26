import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Home, ShoppingBag, Package } from 'lucide-react';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-50 flex items-center justify-center px-4 py-16 font-sans">
      <div className="max-w-md w-full text-center">

        {/* Animated success checkmark */}
        <div className="relative inline-flex mb-8">
          <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-ping" />
          <div className="relative inline-flex p-6 bg-white border-4 border-green-400 rounded-full shadow-2xl shadow-green-400/20">
            <CheckCircle className="w-16 h-16 text-green-500" strokeWidth={2} />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
          Đặt hàng thành công! 🎉
        </h1>
        <p className="text-slate-500 font-semibold text-sm mb-8 leading-relaxed max-w-xs mx-auto">
          Cảm ơn bạn đã mua sắm tại <span className="text-[#e47937] font-extrabold">UrbanCart</span>.
          Đơn hàng của bạn đang được xử lý và sẽ được giao trong <strong>2–5 ngày làm việc</strong>.
        </p>

        {/* Order status timeline */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-8 text-left">
          <h2 className="text-sm font-black text-slate-700 mb-4">Trạng thái đơn hàng</h2>
          <div className="space-y-4">
            {[
              { label: 'Đặt hàng thành công', desc: 'Hệ thống đã nhận đơn hàng của bạn', done: true },
              { label: 'Xác nhận đơn hàng', desc: 'Người bán đang xem xét đơn hàng', done: true },
              { label: 'Đang đóng gói', desc: 'Sản phẩm đang được chuẩn bị', done: false },
              { label: 'Đang giao hàng', desc: 'Shipper đang trên đường giao', done: false },
            ].map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center
                  ${step.done ? 'bg-green-500' : 'bg-slate-200'}`}
                >
                  {step.done ? (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-extrabold ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info card */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-8 flex items-start gap-3 text-left">
          <Package className="w-5 h-5 text-[#e47937] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 font-semibold leading-relaxed">
            Bạn sẽ nhận được thông báo qua điện thoại khi đơn hàng được xác nhận.
            Nếu cần hỗ trợ, vui lòng liên hệ hotline <strong>1800-123-456</strong>.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 py-3.5
              bg-[#1a3150] hover:bg-[#152740] text-white font-extrabold rounded-full text-sm
              shadow-sm transition cursor-pointer select-none"
          >
            <Home className="w-4 h-4" /> Về trang chủ
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 py-3.5
              bg-white border-2 border-[#e47937] text-[#e47937] hover:bg-orange-50
              font-extrabold rounded-full text-sm transition cursor-pointer select-none"
          >
            <ShoppingBag className="w-4 h-4" /> Tiếp tục mua sắm
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
