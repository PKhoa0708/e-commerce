import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Plus, Package, Eye, Star, Info, Inbox } from 'lucide-react';

const MyProducts = () => {
  const { token, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchMyProducts = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/products/my`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (res.ok) {
          setProducts(data.products || []);
        } else {
          setErrorMsg(data.message || 'Không thể tải danh sách sản phẩm.');
        }
      } catch (err) {
        console.error('Error fetching my products:', err);
        setErrorMsg('Không thể kết nối với máy chủ Backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyProducts();
  }, [API_URL, token]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header navigation bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-500 hover:text-[#e47937] transition font-semibold text-sm mb-2 cursor-pointer select-none"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại Trang chủ
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              Sản Phẩm Đang Bán
            </h1>
            <p className="text-slate-400 text-sm mt-1">Quản lý các sản phẩm bạn đã đăng trên hệ thống</p>
          </div>

          <button
            onClick={() => navigate('/sell')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#e47937] hover:bg-[#c96222] text-white font-extrabold rounded-full text-sm shadow-md hover:scale-102 active:scale-98 transition duration-200 cursor-pointer select-none"
          >
            <Plus className="w-5 h-5" /> Đăng bán sản phẩm mới
          </button>
        </div>

        {/* Error message panel */}
        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-semibold text-center border border-red-100 mb-8">
            {errorMsg}
          </div>
        )}

        {/* List / Grid display */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm animate-pulse h-[340px] flex flex-col justify-between">
                <div className="w-full h-44 bg-slate-100 rounded-2xl mb-3"></div>
                <div>
                  <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="h-5 bg-slate-100 rounded w-1/3"></div>
                  <div className="h-8 bg-slate-100 rounded-full w-8"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {products.length === 0 ? (
              <div className="max-w-md mx-auto text-center py-16 px-4 bg-white rounded-3xl border border-slate-100 shadow-xl flex flex-col items-center">
                <div className="p-4 bg-orange-50 text-[#e47937] rounded-full mb-4">
                  <Inbox className="w-12 h-12" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Chưa có sản phẩm đăng bán</h3>
                <p className="text-slate-400 text-sm mt-2 mb-6">
                  Bạn chưa đăng bất kỳ sản phẩm nào lên UrbanCart. Hãy bắt đầu kinh doanh ngay hôm nay!
                </p>
                <button
                  onClick={() => navigate('/sell')}
                  className="px-6 py-2.5 bg-[#1a3150] hover:bg-[#152740] text-white font-bold rounded-full text-sm transition shadow-sm"
                >
                  Đăng bán ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => {
                  const priceFormatted = product.price.toLocaleString('vi-VN') + ' ₫';
                  return (
                    <div
                      key={product._id}
                      className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between relative group h-[340px]"
                    >
                      <div>
                        {/* Image view */}
                        <div className="w-full h-44 overflow-hidden rounded-2xl bg-slate-100 mb-3 border border-slate-100 relative">
                          <img
                            src={product.images && product.images[0] ? product.images[0] : 'https://placehold.co/300x300?text=No+Image'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                          />
                          <span className="absolute bottom-2 left-2 bg-slate-900/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {product.category}
                          </span>
                        </div>

                        {/* Title & Info */}
                        <div className="px-1">
                          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-[#e47937] uppercase tracking-wider">
                            <span>{product.category}</span>
                            <span>•</span>
                            <span className="text-slate-400">Kho: {product.stockQuantity}</span>
                          </div>
                          <h3 className="text-sm font-extrabold text-slate-800 line-clamp-2 leading-tight">
                            {product.name}
                          </h3>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="px-1 mt-2">
                        {/* Rating block */}
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 mb-1">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{product.rating ? product.rating.toFixed(1) : '0.0'}</span>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm sm:text-base font-black text-[#e47937]">
                            {priceFormatted}
                          </span>

                          <button
                            onClick={() => navigate(`/product/${product._id}`)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1a3150] text-white text-xs font-bold rounded-full hover:bg-[#e47937] transition duration-200"
                            title="Xem trên shop"
                          >
                            <Eye className="w-3.5 h-3.5" /> Chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyProducts;
