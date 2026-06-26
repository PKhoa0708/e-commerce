import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { wishlistAPI } from '../services/api';
import { ArrowLeft, Heart, Trash2, ShoppingBag, Star } from 'lucide-react';

const Wishlist = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useContext(AuthContext);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchWishlist();
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      const data = await wishlistAPI.getAll(token);
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    try {
      await wishlistAPI.remove(token, productId);
      setItems(prev => prev.filter(item => item.product._id !== productId));
    } catch (err) {
      console.error('Failed to remove:', err);
    } finally {
      setRemovingId(null);
    }
  };

  const fmt = (n) => n?.toLocaleString('vi-VN') + ' ₫';

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">Đang tải danh sách yêu thích...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* ── Top navigation ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-[#e47937] transition font-bold text-sm cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-red-50 rounded-2xl">
            <Heart className="w-6 h-6 text-red-500 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">Yêu thích của tôi</h1>
            <p className="text-xs text-slate-400 font-semibold">{items.length} sản phẩm</p>
          </div>
        </div>

        {/* ── Empty state ── */}
        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-red-300" />
            </div>
            <h2 className="text-lg font-bold text-slate-700 mb-2">Chưa có sản phẩm yêu thích</h2>
            <p className="text-sm text-slate-400 mb-6">Khám phá và thêm sản phẩm bạn yêu thích vào đây!</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-[#e47937] text-white font-bold rounded-full text-sm hover:bg-[#c96222] transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 inline mr-2" />
              Khám phá ngay
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-4 items-center hover:shadow-md transition group"
                >
                  {/* Product image */}
                  <div
                    onClick={() => navigate(`/product/${product._id}`)}
                    className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 cursor-pointer border border-slate-100"
                  >
                    <img
                      src={product.images?.[0] || 'https://placehold.co/200x200?text=No+Image'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <h3
                      onClick={() => navigate(`/product/${product._id}`)}
                      className="text-sm font-bold text-slate-800 line-clamp-1 cursor-pointer hover:text-[#e47937] transition"
                    >
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-0.5">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{product.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-slate-300 mx-1">•</span>
                      <span className="text-slate-400">{product.category}</span>
                    </div>
                    <p className="text-base font-black text-[#e47937] mt-1">{fmt(product.price)}</p>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(product._id)}
                    disabled={removingId === product._id}
                    className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer disabled:opacity-50"
                    title="Xóa khỏi yêu thích"
                  >
                    {removingId === product._id ? (
                      <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
