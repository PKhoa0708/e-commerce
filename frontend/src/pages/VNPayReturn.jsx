import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { paymentAPI } from '../services/api';
import { CheckCircle2, XCircle, Loader2, ShoppingBag, Home, AlertCircle } from 'lucide-react';

const VNPayReturn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, isAuthenticated } = useContext(AuthContext);

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('Đang xác thực kết quả giao dịch...');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    // Redirect if not authenticated (should not happen if they just checked out, but safe check)
    if (!isAuthenticated) {
      const checkAuthTimer = setTimeout(() => {
        if (!isAuthenticated) {
          navigate('/login');
        }
      }, 1000);
      return () => clearTimeout(checkAuthTimer);
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!token) return;

      // Extract all query params returned by VNPay
      const params = {};
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }

      try {
        const response = await paymentAPI.verifyVNPay(token, params);
        if (response.status === 'success') {
          setStatus('success');
          setMessage('Giao dịch thanh toán của bạn đã được xác nhận thành công!');
          setOrderId(response.orderId || params['vnp_TxnRef']);
        } else {
          setStatus('error');
          setMessage(response.message || 'Xác thực thanh toán thất bại.');
          setOrderId(params['vnp_TxnRef'] || '');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
        setMessage(error.message || 'Có lỗi xảy ra trong quá trình đối soát chữ ký giao dịch.');
        setOrderId(params['vnp_TxnRef'] || '');
      }
    };

    verifyPayment();
  }, [token, searchParams]);

  const formatPrice = (n) => {
    if (!n) return '';
    return (parseInt(n) / 100).toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans select-none">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden">
        {/* Decorative Top Accent Line */}
        <div className={`absolute top-0 inset-x-0 h-2 ${
          status === 'success' ? 'bg-emerald-500' : status === 'error' ? 'bg-rose-500' : 'bg-blue-500'
        }`} />

        {status === 'loading' && (
          <div className="py-8 flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Đang xác thực thanh toán</h2>
            <p className="text-sm text-slate-500 max-w-xs">{message}</p>
            <p className="text-xs text-slate-400 mt-4">Vui lòng không đóng cửa sổ hoặc tải lại trang này.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 flex flex-col items-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6 scale-up-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Thanh toán thành công!</h2>
            <p className="text-sm text-slate-600 px-2 leading-relaxed mb-6">{message}</p>

            {/* Order Brief Box */}
            <div className="bg-slate-50 rounded-2xl w-full p-4 text-left border border-slate-100 text-sm space-y-2 mb-8">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Mã đơn hàng:</span>
                <span className="text-slate-800 font-bold font-mono">#{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Số tiền thanh toán:</span>
                <span className="text-emerald-600 font-extrabold">{formatPrice(searchParams.get('vnp_Amount'))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Mã giao dịch VNPay:</span>
                <span className="text-slate-800 font-medium font-mono text-xs">{searchParams.get('vnp_TransactionNo')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Ngân hàng thanh toán:</span>
                <span className="text-slate-800 font-bold">{searchParams.get('vnp_BankCode')}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-3">
              <button
                onClick={() => navigate('/orders')}
                className="w-full py-3.5 bg-[#e47937] hover:bg-[#d0672a] text-white font-bold rounded-full shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 text-sm cursor-pointer transition-all active:scale-[0.99]"
              >
                <ShoppingBag className="w-4 h-4" /> Xem đơn hàng của tôi
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full flex items-center justify-center gap-2 text-sm cursor-pointer transition-all"
              >
                <Home className="w-4 h-4" /> Quay về Trang chủ
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 flex flex-col items-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-6 scale-up-center">
              <XCircle className="w-12 h-12 text-rose-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Thanh toán thất bại!</h2>
            <p className="text-sm text-slate-600 px-2 leading-relaxed mb-6">{message}</p>

            {/* Order Brief Box */}
            <div className="bg-slate-50 rounded-2xl w-full p-4 text-left border border-slate-100 text-sm space-y-2 mb-8">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Mã đơn hàng:</span>
                <span className="text-slate-800 font-bold font-mono">#{orderId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Số tiền thanh toán:</span>
                <span className="text-rose-500 font-extrabold">{formatPrice(searchParams.get('vnp_Amount')) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Mã lỗi phản hồi:</span>
                <span className="text-rose-500 font-bold font-mono">{searchParams.get('vnp_ResponseCode') || 'N/A'}</span>
              </div>
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={() => navigate('/orders')}
                className="w-full py-3.5 bg-[#1a3150] hover:bg-[#12243d] text-white font-bold rounded-full flex items-center justify-center gap-2 text-sm cursor-pointer transition-all active:scale-[0.99]"
              >
                Vào Lịch sử đơn hàng để thanh toán lại
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full flex items-center justify-center gap-2 text-sm cursor-pointer transition-all"
              >
                <Home className="w-4 h-4" /> Quay về Trang chủ
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .scale-up-center {
          animation: scaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleUp {
          from { transform: scale(0.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default VNPayReturn;
