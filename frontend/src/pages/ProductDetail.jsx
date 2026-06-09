import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { ArrowLeft, ShoppingCart, Star, Heart, Check, Plus, Minus, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useContext(AuthContext);
  
  // CartContext (Giả định CartContext có addToCart, nếu chưa có hoặc lỗi, chúng ta sẽ bắt lỗi và hiển thị thông báo)
  const cartContext = useContext(CartContext) || {};
  const { addToCart } = cartContext;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Interactive UI states
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await fetch(`${API_URL}/products/${id}`);
        const data = await res.json();

        if (res.ok && data.product) {
          setProduct(data.product);
          // Set default image
          if (data.product.images && data.product.images.length > 0) {
            setSelectedImage(data.product.images[0]);
          }
          // Set default variants if available
          if (data.product.variants?.sizes?.length > 0) {
            setSelectedSize(data.product.variants.sizes[0]);
          }
          if (data.product.variants?.colors?.length > 0) {
            setSelectedColor(data.product.variants.colors[0]);
          }
        } else {
          setErrorMsg(data.message || 'Sản phẩm không tồn tại trong hệ thống.');
        }
      } catch (err) {
        console.error('Error fetching product detail:', err);
        setErrorMsg('Không thể kết nối với máy chủ Backend. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, API_URL]);

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleIncrease = () => {
    if (product && quantity < product.stockQuantity) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (product.variants?.sizes?.length > 0 && !selectedSize) {
      setErrorMsg('Vui lòng chọn Kích thước.');
      return;
    }
    if (product.variants?.colors?.length > 0 && !selectedColor) {
      setErrorMsg('Vui lòng chọn Màu sắc.');
      return;
    }

    if (addToCart) {
      addToCart(product, quantity, { size: selectedSize, color: selectedColor });
      setActionSuccess('Đã thêm sản phẩm vào giỏ hàng thành công!');
      setTimeout(() => setActionSuccess(''), 3000);
    } else {
      // Mock fallback if CartContext is skeleton
      alert(`Đã thêm vào giỏ hàng: ${product.name} (SL: ${quantity}, Size: ${selectedSize}, Màu: ${selectedColor})`);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;

    if (product.variants?.sizes?.length > 0 && !selectedSize) {
      setErrorMsg('Vui lòng chọn Kích thước.');
      return;
    }
    if (product.variants?.colors?.length > 0 && !selectedColor) {
      setErrorMsg('Vui lòng chọn Màu sắc.');
      return;
    }

    if (addToCart) {
      addToCart(product, quantity, { size: selectedSize, color: selectedColor });
    }
    navigate('/cart');
  };

  // Render Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-7xl mx-auto animate-pulse space-y-8">
          <div className="h-6 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-96 bg-slate-200 rounded-3xl"></div>
              <div className="flex gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 w-20 bg-slate-200 rounded-2xl"></div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-10 bg-slate-200 rounded w-3/4"></div>
              <div className="h-6 bg-slate-200 rounded w-1/3"></div>
              <div className="h-16 bg-slate-200 rounded"></div>
              <div className="h-10 bg-slate-200 rounded w-1/2"></div>
              <div className="h-12 bg-slate-200 rounded-full w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Error Message
  if (errorMsg || !product) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 font-sans flex flex-col items-center justify-center">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-slate-100 shadow-xl">
          <div className="p-4 bg-red-50 text-red-500 rounded-full inline-block mb-4">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-800">Không tìm thấy sản phẩm</h2>
          <p className="text-slate-400 text-sm mt-2 mb-6">{errorMsg || 'Sản phẩm không tồn tại hoặc đường dẫn bị sai.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-[#1a3150] hover:bg-[#152740] text-white font-bold rounded-full text-sm transition shadow-sm cursor-pointer"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const priceFormatted = product.price.toLocaleString('vi-VN') + ' đ';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      
      {/* Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-[#e47937] transition font-bold text-sm cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>

      {/* Main product box */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden p-6 sm:p-8">
          
          {/* Status Alert Panels */}
          {actionSuccess && (
            <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-2xl text-sm font-bold border border-green-100 text-center animate-bounce shadow-sm">
              {actionSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* 1. Left: Product Gallery */}
            <div className="space-y-4">
              {/* Large Image Showcase */}
              <div className="w-full h-80 sm:h-[450px] overflow-hidden rounded-3xl bg-slate-50 border border-slate-100 relative shadow-sm group">
                <img
                  src={selectedImage || 'https://placehold.co/600x600?text=No+Image'}
                  alt={product.name}
                  className="w-full h-full object-cover transition duration-500 pointer-events-none"
                />
                
                {/* Favorite Button */}
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`absolute top-6 right-6 p-3 rounded-full shadow-md backdrop-blur-xs transition hover:scale-105 active:scale-95 cursor-pointer ${
                    isLiked 
                      ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                      : 'bg-white/95 text-slate-400 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Thumbnails row */}
              {product.images && product.images.length > 0 && (
                <div className="flex flex-wrap gap-3.5 pt-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`h-20 w-20 rounded-2xl overflow-hidden border-2 bg-slate-50 transition hover:scale-102 cursor-pointer ${
                        selectedImage === img 
                          ? 'border-[#e47937] ring-4 ring-orange-500/5' 
                          : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <img src={img} alt={`thumbnail-${idx}`} className="w-full h-full object-cover pointer-events-none" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Right: Info details */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                
                {/* Category label */}
                <span className="text-xs font-black uppercase tracking-wider text-[#e47937] block">
                  {product.category}
                </span>

                {/* Name */}
                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
                  {product.name}
                </h1>

                {/* Star rating & sales status */}
                <div className="flex items-center gap-4 text-sm font-semibold">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-slate-800 font-bold">{product.rating ? product.rating.toFixed(1) : '0.0'}</span>
                  </div>
                  <span className="text-slate-200">|</span>
                  <span className="text-slate-500">
                    Đã bán <span className="text-slate-800 font-bold">120+</span> {/* Dummy sales info */}
                  </span>
                  <span className="text-slate-200">|</span>
                  <span className={`font-bold ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {product.stockQuantity > 0 ? `Còn hàng: ${product.stockQuantity}` : 'Hết hàng'}
                  </span>
                </div>

                {/* Price Display */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-bold block uppercase tracking-wide mb-1">Giá khuyến mãi</span>
                    <span className="text-3xl font-black text-[#e47937] tracking-tight">{priceFormatted}</span>
                  </div>
                  <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Giảm 10%
                  </span>
                </div>

                {/* Short description preview */}
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  {product.description.length > 150 
                    ? `${product.description.substring(0, 150)}...` 
                    : product.description}
                </p>

                {/* Variants area */}
                <div className="space-y-4 pt-2">
                  {/* Colors Select */}
                  {product.variants?.colors && product.variants.colors.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-xs font-black text-slate-700 uppercase tracking-wider">Màu sắc</span>
                      <div className="flex flex-wrap gap-2.5">
                        {product.variants.colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer select-none flex items-center gap-1.5 ${
                              selectedColor === color
                                ? 'border-[#e47937] text-[#e47937] bg-orange-500/5 ring-2 ring-orange-500/10'
                                : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                            }`}
                          >
                            {selectedColor === color && <Check className="w-3.5 h-3.5" />}
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sizes Select */}
                  {product.variants?.sizes && product.variants.sizes.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-xs font-black text-slate-700 uppercase tracking-wider">Kích cỡ</span>
                      <div className="flex flex-wrap gap-2.5">
                        {product.variants.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer select-none flex items-center gap-1.5 ${
                              selectedSize === size
                                ? 'border-[#e47937] text-[#e47937] bg-orange-500/5 ring-2 ring-orange-500/10'
                                : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                            }`}
                          >
                            {selectedSize === size && <Check className="w-3.5 h-3.5" />}
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity and Stock details */}
                  <div className="space-y-2 pt-2">
                    <span className="block text-xs font-black text-slate-700 uppercase tracking-wider">Số lượng</span>
                    <div className="flex items-center gap-4">
                      {/* Quantity counter */}
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                        <button
                          type="button"
                          onClick={handleDecrease}
                          disabled={quantity <= 1}
                          className="p-2 text-slate-500 hover:text-slate-800 disabled:text-slate-300 transition cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-5 text-sm font-black text-slate-800 select-none min-w-[40px] text-center">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={handleIncrease}
                          disabled={quantity >= product.stockQuantity}
                          className="p-2 text-slate-500 hover:text-slate-800 disabled:text-slate-300 transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Call-to-actions */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stockQuantity === 0}
                  className="flex-1 px-8 py-3.5 border border-[#e47937] text-[#e47937] hover:bg-orange-50 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 font-extrabold rounded-full text-sm flex items-center justify-center gap-2 transition cursor-pointer select-none active:scale-98"
                >
                  <ShoppingCart className="w-4.5 h-4.5" /> Thêm vào giỏ hàng
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={product.stockQuantity === 0}
                  className="flex-1 px-8 py-3.5 bg-[#e47937] hover:bg-[#c96222] disabled:bg-slate-200 text-white font-extrabold rounded-full text-sm shadow-lg shadow-orange-500/15 transition cursor-pointer select-none active:scale-98"
                >
                  Mua ngay
                </button>
              </div>

            </div>

          </div>

          {/* 3. Bottom: Full Description */}
          <div className="mt-12 pt-8 border-t border-slate-100">
            <h2 className="text-lg font-black text-slate-800 tracking-tight mb-4 pb-2 border-b border-slate-100">
              Chi Tiết Sản Phẩm
            </h2>
            <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-medium space-y-4">
              {product.description}
            </div>
          </div>

          {/* Core premium policies grid */}
          <div className="mt-12 bg-slate-50 rounded-2xl p-6 border border-slate-100/50 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs font-extrabold text-slate-600">
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#e47937]" />
              <span>Chính Hãng 100%</span>
              <span className="text-[10px] text-slate-400 font-medium font-sans">Hoàn tiền 200% nếu phát hiện giả</span>
            </div>
            <div className="flex flex-col items-center gap-2 border-y sm:border-y-0 sm:border-x border-slate-200 py-4 sm:py-0">
              <Truck className="w-6 h-6 text-[#e47937]" />
              <span>Giao Hàng Siêu Tốc</span>
              <span className="text-[10px] text-slate-400 font-medium font-sans">Nhận hàng trong vòng 2-3 ngày</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 text-[#e47937]" />
              <span>7 Ngày Đổi Trả</span>
              <span className="text-[10px] text-slate-400 font-medium font-sans">Miễn phí đổi hàng nếu không vừa size</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
