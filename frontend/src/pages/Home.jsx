import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { Search, ShoppingCart, LogOut, ChevronLeft, ChevronRight, Star, Heart, Package, Plus } from 'lucide-react';

const Home = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  
  // Custom Slider Banner state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const dragStartX = useRef(0);
  const isDragging = useRef(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const banners = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&auto=format&fit=crop&q=80',
      title: 'MUA SẮM ĐÔ THỊ',
      subtitle: 'Đón đầu xu hướng thời trang đường phố cao cấp.'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&auto=format&fit=crop&q=80',
      title: 'THƯƠNG HIỆU HÀNG ĐẦU',
      subtitle: 'Nâng tầm phong cách cá nhân của bạn.'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1472851294608-062f824d296e?w=1000&auto=format&fit=crop&q=80',
      title: 'SIÊU DEAL CUỐI TUẦN',
      subtitle: 'Nhận ngay ưu đãi giảm giá đến 50% toàn bộ gian hàng.'
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1000&auto=format&fit=crop&q=80',
      title: 'PHONG CÁCH TỐI GIẢN',
      subtitle: 'Thời trang thanh lịch, nhẹ nhàng và cá tính.'
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=1000&auto=format&fit=crop&q=80',
      title: 'BỘ SƯU TẬP MỚI',
      subtitle: 'Độc quyền ra mắt duy nhất tại UrbanCart.'
    }
  ];

  // Fetch products on load
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const queryParams = (user?.id || user?._id) ? `?excludeSeller=${user.id || user._id}` : '';
        const res = await fetch(`${API_URL}/products${queryParams}`);
        const data = await res.json();
        if (res.ok) {
          setProducts(data.products || []);
        } else {
          setErrorMsg(data.message || 'Không thể tải danh sách sản phẩm.');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setErrorMsg('Không thể kết nối với máy chủ Backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [API_URL, user]);

  // Autoplay Slider Banner logic
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, banners.length]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Touch handlers for Mobile Swipe
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    setIsPaused(false);
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) {
      handleNextSlide();
    } else if (diff < -50) {
      handlePrevSlide();
    }
  };

  // Mouse handlers for Desktop Drag
  const handleMouseDown = (e) => {
    setIsPaused(true);
    dragStartX.current = e.clientX;
    isDragging.current = true;
  };

  const handleMouseUp = (e) => {
    setIsPaused(false);
    if (!isDragging.current) return;
    isDragging.current = false;
    const dragEndX = e.clientX;
    const diff = dragStartX.current - dragEndX;
    if (diff > 50) {
      handleNextSlide();
    } else if (diff < -50) {
      handlePrevSlide();
    }
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    isDragging.current = false;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calculate cart count
  const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  // Filter products by search query and category
  const filteredProducts = products.filter((product) => {
    // 1. Search Query Filter
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Category Filter
    if (activeCategory === 'Tất cả') return matchesSearch;
    if (activeCategory === 'Thời trang') {
      return matchesSearch && product.category.includes('Thời trang');
    }
    return matchesSearch && product.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* 1. Header Area */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo SVG matching reference style */}
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate('/')}>
            <svg className="w-9 h-9 flex-shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="2" y1="20" x2="12" y2="20" stroke="#e47937" strokeWidth="3" strokeLinecap="round" />
              <line x1="0" y1="27" x2="14" y2="27" stroke="#e47937" strokeWidth="3" strokeLinecap="round" />
              <line x1="3" y1="34" x2="11" y2="34" stroke="#e47937" strokeWidth="3" strokeLinecap="round" />
              <path
                d="M18 16 L16 42 C15.5 45 17.5 47 20.5 47 L44.5 47 C47.5 47 49.5 45 50 42 L54 16"
                stroke="#1a3150"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path d="M54 16 L58 10" stroke="#1a3150" strokeWidth="5" strokeLinecap="round" />
              <path d="M22 22 L20.5 40 C20.3 41.5 21.5 42.5 23 42.5 L43 42.5 C44.5 42.5 45.7 41.5 45.5 40 L44 22 Z" fill="#e47937" />
              <path d="M29 22 C29 17 37 17 37 22" stroke="#e47937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <circle cx="23" cy="53" r="4" fill="#1a3150" />
              <circle cx="43" cy="53" r="4" fill="#1a3150" />
            </svg>
            <span className="text-xl font-black tracking-tight hidden sm:inline">
              <span className="text-[#1a3150]">Urban</span>
              <span className="text-[#e47937]">Cart</span>
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4.5 h-4.5" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 text-slate-800 placeholder-slate-400 rounded-full border border-transparent focus:outline-none focus:bg-white focus:border-[#e47937] focus:ring-2 focus:ring-orange-500/10 transition text-sm font-medium"
            />
          </div>

          {/* Right Icons: Cart & Profile Auth */}
          <div className="flex items-center gap-4">
            {/* Seller tools */}
            {isAuthenticated && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate('/my-products')}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer text-slate-700 transition flex items-center gap-1 px-3"
                  title="Sản phẩm đang bán của tôi"
                >
                  <Package className="w-4 h-4" />
                  <span className="text-xs font-bold hidden md:inline">Sản phẩm của tôi</span>
                </button>
                <button
                  onClick={() => navigate('/sell')}
                  className="p-2 bg-orange-50 hover:bg-orange-100 text-[#e47937] rounded-full cursor-pointer transition flex items-center gap-1 px-3"
                  title="Đăng bán sản phẩm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-xs font-bold hidden md:inline">Đăng bán</span>
                </button>
              </div>
            )}

            {/* Cart Icon with badge */}
            <div 
              onClick={() => navigate('/cart')} 
              className="relative p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer text-slate-700 transition"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#e47937] text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-sm">
                  {cartCount}
                </span>
              )}
            </div>

            {/* User Session Profile details */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800">{user?.name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Thành viên</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 bg-[#1a3150] hover:bg-[#152740] text-white font-bold rounded-full text-xs transition shadow-sm"
              >
                ĐĂNG NHẬP
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* 2. Banner Slider Area */}
        <div 
          className="relative w-full h-48 sm:h-80 md:h-[400px] rounded-3xl overflow-hidden shadow-lg select-none group bg-slate-200"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={() => setIsPaused(true)}
        >
          {/* Slides */}
          <div 
            className="w-full h-full flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {banners.map((banner) => (
              <div key={banner.id} className="w-full h-full flex-shrink-0 relative">
                <img 
                  src={banner.image} 
                  alt={banner.title} 
                  className="w-full h-full object-cover pointer-events-none"
                />
                {/* Visual Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-8 sm:px-16 text-white">
                  <h2 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tight mb-2 sm:mb-4 animate-fade-in">
                    {banner.title}
                  </h2>
                  <p className="text-xs sm:text-sm md:text-lg text-slate-200 font-medium max-w-md">
                    {banner.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows (Desktop hidden on mobile) */}
          <button
            onClick={handlePrevSlide}
            className="absolute top-1/2 left-4 -translate-y-1/2 p-2 bg-white/70 hover:bg-white text-slate-800 rounded-full shadow-md hover:scale-105 active:scale-95 transition opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextSlide}
            className="absolute top-1/2 right-4 -translate-y-1/2 p-2 bg-white/70 hover:bg-white text-slate-800 rounded-full shadow-md hover:scale-105 active:scale-95 transition opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Pagination Indicators (Dots) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === index ? 'w-6 bg-[#e47937]' : 'w-2.5 bg-white/50 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 3. Product Catalog Grid Area */}
        <div className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sản Phẩm Nổi Bật</h2>
              <p className="text-sm text-slate-400 mt-1">Khám phá các sản phẩm hot nhất đô thị</p>
            </div>
            
            {/* Quick category filter tags */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
              {[
                { key: 'Tất cả', label: 'Tất cả' },
                { key: 'Thời trang', label: 'Thời trang' },
                { key: 'Giày dép', label: 'Giày dép' },
                { key: 'Phụ kiện', label: 'Phụ kiện' }
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-full cursor-pointer border transition duration-200 select-none ${
                    activeCategory === cat.key
                      ? 'bg-[#e47937] text-white border-transparent shadow-sm shadow-[#e47937]/20 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-semibold text-center border border-red-100 my-6">
              {errorMsg}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm animate-pulse flex flex-col justify-between h-[340px]">
                  <div className="w-full h-44 bg-slate-100 rounded-2xl mb-3"></div>
                  <div>
                    <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2 mb-4"></div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="h-5 bg-slate-100 rounded w-1/3"></div>
                    <div className="h-8 bg-slate-100 rounded-full w-8"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-slate-400 text-sm font-medium">Không tìm thấy sản phẩm nào khớp với tìm kiếm của bạn.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {filteredProducts.map((product) => {
                    const priceFormatted = product.price.toLocaleString('vi-VN') + ' ₫';
                    
                    return (
                      <div
                        key={product._id}
                        onClick={() => navigate(`/product/${product._id}`)}
                        className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200/60 cursor-pointer transition-all duration-300 flex flex-col justify-between group relative h-[340px]"
                      >
                        {/* Favorite Badge (Aesthetic) */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Đã thích sản phẩm: ${product.name}`);
                          }}
                          className="absolute top-5 right-5 z-10 p-2 bg-white/80 backdrop-blur-xs text-slate-400 hover:text-red-500 rounded-full shadow-xs hover:scale-105 active:scale-95 transition"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>

                        <div>
                          {/* Image Box */}
                          <div className="w-full h-44 overflow-hidden rounded-2xl bg-slate-100 mb-3 border border-slate-100 relative">
                            <img
                              src={product.images && product.images[0] ? product.images[0] : 'https://placehold.co/300x300?text=No+Image'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500 pointer-events-none"
                            />
                            {/* Category badge */}
                            <span className="absolute bottom-2 left-2 bg-slate-900/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {product.category}
                            </span>
                          </div>

                          {/* Info Box */}
                          <div className="px-1">
                            {/* Category Text Label above Title */}
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#e47937] mb-1.5 block">
                              {product.category}
                            </span>
                            <h3 className="text-sm font-extrabold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#e47937] transition duration-200">
                              {product.name}
                            </h3>
                          </div>
                        </div>

                        {/* Price & Rating Box */}
                        <div className="px-1 mt-2">
                          {/* Rating */}
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 mb-1">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{product.rating ? product.rating.toFixed(1) : '0.0'}</span>
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm sm:text-base font-black text-[#e47937]">
                              {priceFormatted}
                            </span>
                            
                            {/* Mock Add-to-cart circle button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/product/${product._id}`);
                              }}
                              className="p-2 bg-[#1a3150] text-white rounded-full group-hover:bg-[#e47937] active:scale-95 transition duration-300"
                              title="Xem chi tiết"
                            >
                              <ChevronRight className="w-4 h-4" />
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
      </main>
    </div>
  );
};

export default Home;
