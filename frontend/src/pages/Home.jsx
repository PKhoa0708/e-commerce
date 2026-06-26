import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { productAPI, wishlistAPI, chatAPI } from '../services/api';
import { Search, ShoppingCart, LogOut, ChevronLeft, ChevronRight, Star, Heart, Package, Plus, SlidersHorizontal, X, MessageSquare } from 'lucide-react';

const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', '29', '30', '31', '32', '39', '40', '41', '42'];
const AVAILABLE_COLORS = ['Đen', 'Trắng', 'Đỏ', 'Rêu', 'Xám', 'Xanh', 'Cam', 'Kaki'];
const COLOR_HEX_MAP = {
  'Đen': '#000000',
  'Trắng': '#FFFFFF',
  'Đỏ': '#EF4444',
  'Rêu': '#556B2F',
  'Xám': '#9CA3AF',
  'Xanh': '#3B82F6',
  'Cam': '#F97316',
  'Kaki': '#F0E68C'
};

const Home = () => {
  const { user, token, logout, isAuthenticated } = useContext(AuthContext);
  const { totalItems } = useContext(CartContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [wishedIds, setWishedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  
  // Sort and Price filter states
  const [sortBy, setSortBy] = useState('newest');
  const [pricePreset, setPricePreset] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // New multi-dimensional filter states
  const [selectedSizes, setSelectedSizes] = useState(new Set());
  const [selectedColors, setSelectedColors] = useState(new Set());
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all' | '5star' | '4starPlus' | '3starPlus'
  const [onlyInStock, setOnlyInStock] = useState(false);

  const handleToggleSize = (size) => {
    setSelectedSizes((prev) => {
      const next = new Set(prev);
      if (next.has(size)) next.delete(size);
      else next.add(size);
      return next;
    });
  };

  const handleToggleColor = (color) => {
    setSelectedColors((prev) => {
      const next = new Set(prev);
      if (next.has(color)) next.delete(color);
      else next.add(color);
      return next;
    });
  };
  
  // Custom Slider Banner state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const dragStartX = useRef(0);
  const isDragging = useRef(false);


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
        const params = {};
        const sellerId = user?.id || user?._id;
        if (sellerId) params.excludeSeller = sellerId;
        const data = await productAPI.getAll(params);
        const loadedProducts = data.products || [];
        setProducts(loadedProducts);

        // Check wishlist status for loaded products
        if (token && loadedProducts.length > 0) {
          try {
            const ids = loadedProducts.map(p => p._id);
            const res = await wishlistAPI.check(token, ids);
            setWishedIds(new Set(res.wishedIds || []));
          } catch { /* silently ignore */ }
        }

        // Check chat unread messages
        if (token) {
          try {
            const chatData = await chatAPI.getConversations(token);
            const totalUnread = (chatData.conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
            setUnreadChatCount(totalUnread);
          } catch { /* silently ignore */ }
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setErrorMsg(err.message || 'Không thể kết nối với máy chủ Backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [user, token]);

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

  // Use totalItems from CartContext (pre-computed)
  const cartCount = totalItems;

  // Filter products by category, search query, price, rating, stock, sizes, and colors
  const filteredProducts = products.filter((product) => {
    // 1. Category Filter
    let matchesCategory = true;
    if (activeCategory !== 'Tất cả') {
      if (activeCategory === 'Thời trang') {
        matchesCategory = product.category.includes('Thời trang');
      } else {
        matchesCategory = product.category === activeCategory;
      }
    }

    // 2. Search Query Filter
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    // 3. Price Filter
    let matchesPrice = true;
    if (pricePreset === 'under200') {
      matchesPrice = product.price < 200000;
    } else if (pricePreset === '200to500') {
      matchesPrice = product.price >= 200000 && product.price <= 500000;
    } else if (pricePreset === 'over500') {
      matchesPrice = product.price > 500000;
    } else if (pricePreset === 'custom') {
      const min = minPrice !== '' ? Number(minPrice) : 0;
      const max = maxPrice !== '' ? Number(maxPrice) : Infinity;
      matchesPrice = product.price >= min && product.price <= max;
    }

    // 4. Rating Filter
    let matchesRating = true;
    if (ratingFilter === '5star') {
      matchesRating = (product.rating || 0) === 5;
    } else if (ratingFilter === '4starPlus') {
      matchesRating = (product.rating || 0) >= 4;
    } else if (ratingFilter === '3starPlus') {
      matchesRating = (product.rating || 0) >= 3;
    }

    // 5. Stock Filter
    let matchesStock = true;
    if (onlyInStock) {
      matchesStock = (product.stockQuantity || 0) > 0;
    }

    // 6. Sizes Filter (multi-select)
    let matchesSizes = true;
    if (selectedSizes.size > 0) {
      matchesSizes = product.variants?.sizes?.some(s => selectedSizes.has(s));
    }

    // 7. Colors Filter (multi-select)
    let matchesColors = true;
    if (selectedColors.size > 0) {
      matchesColors = product.variants?.colors?.some(c => selectedColors.has(c));
    }

    return matchesCategory && matchesSearch && matchesPrice && matchesRating && matchesStock && matchesSizes && matchesColors;
  });

  // Sort products
  const sortedAndFilteredProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'priceAsc') {
      return a.price - b.price;
    }
    if (sortBy === 'priceDesc') {
      return b.price - a.price;
    }
    if (sortBy === 'ratingDesc') {
      return (b.rating || 0) - (a.rating || 0);
    }
    // Default or 'newest'
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const hasActiveFilters = 
    activeCategory !== 'Tất cả' ||
    sortBy !== 'newest' ||
    pricePreset !== 'all' ||
    searchQuery !== '' ||
    ratingFilter !== 'all' ||
    onlyInStock ||
    selectedSizes.size > 0 ||
    selectedColors.size > 0;

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

            {/* Chat Icon with badge */}
            {isAuthenticated && (
              <div 
                onClick={() => navigate('/chat')} 
                className="relative p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer text-slate-700 transition"
                title="Hòm thư Chat"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadChatCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {unreadChatCount}
                  </span>
                )}
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
                {/* Clickable avatar → profile */}
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer select-none"
                  title="Hồ sơ cá nhân"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover shadow-sm border border-slate-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center font-black text-white text-xs shadow-sm flex-shrink-0">
                      {user?.name?.trim().split(' ').slice(-1)[0]?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-800">{user?.name}</span>
                    <span className="text-[10px] text-[#e47937] font-semibold">Xem hồ sơ</span>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition cursor-pointer"
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
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sản Phẩm Nổi Bật</h2>
              <p className="text-sm text-slate-400 mt-1 font-medium">Khám phá các sản phẩm hot nhất đô thị</p>
            </div>
            
            {/* Filter Toggle Button (Mobile/Tablet only) */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setShowFiltersPanel(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-slate-700 font-extrabold rounded-full border border-slate-200 transition duration-200 select-none shadow-sm text-xs cursor-pointer active:scale-95"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#e47937]" />
                Bộ lọc & Sắp xếp
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e47937] inline-block animate-pulse"></span>
                )}
              </button>
            </div>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            
            {/* ── COLUMN 1: Left Filter Sidebar / Mobile Drawer ── */}
            <aside className={`fixed inset-0 z-[9999] flex justify-start bg-black/50 backdrop-blur-xs lg:static lg:bg-transparent lg:z-0 lg:flex-none transition-opacity duration-300
              ${showFiltersPanel ? 'opacity-100' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'}`}>
              
              <div className={`w-80 max-w-[85vw] lg:w-full bg-white lg:bg-transparent h-full lg:h-auto p-6 lg:p-0 flex flex-col justify-between lg:block shadow-2xl lg:shadow-none transition-transform duration-300 ease-out
                ${showFiltersPanel ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                
                {/* Mobile Drawer Header */}
                <div className="flex items-center justify-between lg:hidden pb-4 border-b border-slate-100 mb-6">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4.5 h-4.5 text-[#e47937]" />
                    <span className="font-black text-slate-800 text-sm uppercase tracking-wide">Bộ lọc & Sắp xếp</span>
                  </div>
                  <button onClick={() => setShowFiltersPanel(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition cursor-pointer">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Filter Options (Scrollable area inside card) */}
                <div className="flex-1 overflow-y-auto lg:overflow-visible pr-2 space-y-6 lg:bg-white lg:rounded-3xl lg:border lg:border-slate-100 lg:p-6 lg:shadow-xs">
                  
                  {/* Category Filter */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Danh mục sản phẩm</h4>
                    <div className="flex flex-col gap-1">
                      {[
                        { key: 'Tất cả', label: 'Tất cả' },
                        { key: 'Thời trang', label: 'Thời trang' },
                        { key: 'Giày dép', label: 'Giày dép' },
                        { key: 'Phụ kiện', label: 'Phụ kiện' }
                      ].map((cat) => {
                        const isSelected = activeCategory === cat.key;
                        return (
                          <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition select-none flex items-center justify-between cursor-pointer
                              ${isSelected
                                ? 'bg-orange-50 text-[#e47937] font-black'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                          >
                            <span>{cat.label}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#e47937]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div className="space-y-3 pt-5 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Sắp xếp theo</h4>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: 'newest', label: 'Mới nhất' },
                        { id: 'priceAsc', label: 'Giá tăng dần' },
                        { id: 'priceDesc', label: 'Giá giảm dần' },
                        { id: 'ratingDesc', label: 'Đánh giá cao nhất' }
                      ].map((opt) => {
                        const isSelected = sortBy === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => setSortBy(opt.id)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition select-none flex items-center justify-between cursor-pointer
                              ${isSelected
                                ? 'bg-orange-50 text-[#e47937] font-black'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#e47937]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price Filter Preset & Custom Range */}
                  <div className="space-y-3 pt-5 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Mức giá sản phẩm</h4>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'all', label: 'Tất cả' },
                        { id: 'under200', label: '< 200k ₫' },
                        { id: '200to500', label: '200k - 500k' },
                        { id: 'over500', label: '> 500k ₫' }
                      ].map((preset) => {
                        const isSelected = pricePreset === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => {
                              setPricePreset(preset.id);
                              setMinPrice('');
                              setMaxPrice('');
                              setTempMinPrice('');
                              setTempMaxPrice('');
                            }}
                            className={`py-2 text-center rounded-xl text-xs font-bold border transition select-none cursor-pointer
                              ${isSelected
                                ? 'border-[#e47937] text-[#e47937] bg-orange-50/50'
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Custom range inputs */}
                    <div className="space-y-2 pt-1">
                      <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Khoảng giá tự chọn (₫)</span>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setMinPrice(tempMinPrice);
                          setMaxPrice(tempMaxPrice);
                          setPricePreset('custom');
                        }}
                        className="flex items-center gap-1.5"
                      >
                        <input
                          type="number"
                          placeholder="Min"
                          min="0"
                          value={tempMinPrice}
                          onChange={(e) => setTempMinPrice(e.target.value)}
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] text-xs font-bold text-slate-700"
                        />
                        <span className="text-slate-300">-</span>
                        <input
                          type="number"
                          placeholder="Max"
                          min="0"
                          value={tempMaxPrice}
                          onChange={(e) => setTempMaxPrice(e.target.value)}
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] text-xs font-bold text-slate-700"
                        />
                        <button
                          type="submit"
                          className="px-3 py-2 bg-[#1a3150] hover:bg-[#152740] text-white text-xs font-extrabold rounded-xl transition cursor-pointer"
                        >
                          Lọc
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Rating filter */}
                  <div className="space-y-3 pt-5 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Đánh giá sản phẩm</h4>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: 'all', label: 'Tất cả sao' },
                        { id: '5star', label: '5 sao tuyệt đối', ratingVal: 5 },
                        { id: '4starPlus', label: '4 sao trở lên', ratingVal: 4 },
                        { id: '3starPlus', label: '3 sao trở lên', ratingVal: 3 }
                      ].map((rate) => {
                        const isSelected = ratingFilter === rate.id;
                        return (
                          <button
                            key={rate.id}
                            onClick={() => setRatingFilter(rate.id)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition select-none flex items-center justify-between cursor-pointer
                              ${isSelected ? 'bg-orange-50 text-[#e47937] font-black' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            <span className="flex items-center gap-1">
                              {rate.ratingVal && (
                                <span className="flex items-center text-amber-500 mr-1.5 flex-shrink-0">
                                  {[...Array(rate.ratingVal)].map((_, idx) => (
                                    <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                                  ))}
                                  {rate.ratingVal < 5 && <span className="text-slate-400 ml-0.5 font-bold">+</span>}
                                </span>
                              )}
                              {rate.label}
                            </span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#e47937]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sizes Filter (Multi-select) */}
                  <div className="space-y-3 pt-5 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kích cỡ (Sizes)</h4>
                    <div className="grid grid-cols-4 gap-1.5">
                      {AVAILABLE_SIZES.map((size) => {
                        const isSelected = selectedSizes.has(size);
                        return (
                          <button
                            key={size}
                            onClick={() => handleToggleSize(size)}
                            className={`py-2 text-center text-xs font-bold rounded-xl border transition select-none cursor-pointer
                              ${isSelected
                                ? 'border-[#e47937] bg-orange-50/50 text-[#e47937] ring-2 ring-orange-500/10'
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Colors Filter (Multi-select) */}
                  <div className="space-y-3 pt-5 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Màu sắc</h4>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_COLORS.map((color) => {
                        const isSelected = selectedColors.has(color);
                        const hex = COLOR_HEX_MAP[color] || '#CCCCCC';
                        const isWhite = color === 'Trắng';
                        return (
                          <button
                            key={color}
                            onClick={() => handleToggleColor(color)}
                            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-full border transition select-none cursor-pointer
                              ${isSelected
                                ? 'border-[#e47937] bg-orange-50/50 text-[#e47937]'
                                : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}
                          >
                            <span 
                              className={`w-3.5 h-3.5 rounded-full flex-shrink-0 border ${isWhite ? 'border-slate-300' : 'border-transparent'}`}
                              style={{ backgroundColor: hex }}
                            />
                            <span>{color}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stock Availability */}
                  <div className="space-y-3 pt-5 border-t border-slate-100 pb-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Trạng thái kho</h4>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-bold text-slate-600">
                      <input
                        type="checkbox"
                        checked={onlyInStock}
                        onChange={(e) => setOnlyInStock(e.target.checked)}
                        className="w-4 h-4 rounded text-[#e47937] border-slate-300 focus:ring-[#e47937]/30 cursor-pointer"
                      />
                      <span>Chỉ hiển thị sản phẩm còn hàng</span>
                    </label>
                  </div>
                </div>

                {/* Mobile Apply Button in drawer footer */}
                <div className="lg:hidden pt-4 border-t border-slate-100 mt-6">
                  <button 
                    onClick={() => setShowFiltersPanel(false)}
                    className="w-full py-3 bg-[#e47937] hover:bg-[#c96222] text-white font-extrabold rounded-full text-xs shadow-md transition cursor-pointer"
                  >
                    Áp dụng bộ lọc
                  </button>
                </div>
              </div>
            </aside>

            {/* ── COLUMN 2: Right Product Grid Area ── */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Active Filter Badges */}
              {hasActiveFilters && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Bộ lọc đang áp dụng</span>
                    <button
                      onClick={() => {
                        setActiveCategory('Tất cả');
                        setSortBy('newest');
                        setPricePreset('all');
                        setMinPrice('');
                        setMaxPrice('');
                        setTempMinPrice('');
                        setTempMaxPrice('');
                        setSearchQuery('');
                        setRatingFilter('all');
                        setOnlyInStock(false);
                        setSelectedSizes(new Set());
                        setSelectedColors(new Set());
                      }}
                      className="text-xs text-[#e47937] hover:text-[#c96222] font-black flex items-center gap-1 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 stroke-[3]" /> Xóa tất cả
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    {activeCategory !== 'Tất cả' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        Danh mục: {activeCategory}
                        <X className="w-3.5 h-3.5 hover:text-red-500 cursor-pointer" onClick={() => setActiveCategory('Tất cả')} />
                      </span>
                    )}
                    {searchQuery !== '' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        Từ khóa: "{searchQuery}"
                        <X className="w-3.5 h-3.5 hover:text-red-500 cursor-pointer" onClick={() => setSearchQuery('')} />
                      </span>
                    )}
                    {pricePreset !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        Giá: {pricePreset === 'under200' ? '< 200k ₫' : pricePreset === '200to500' ? '200k - 500k' : pricePreset === 'over500' ? '> 500k ₫' : `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} ₫`}
                        <X 
                          className="w-3.5 h-3.5 hover:text-red-500 cursor-pointer" 
                          onClick={() => {
                            setPricePreset('all');
                            setMinPrice('');
                            setMaxPrice('');
                          }} 
                        />
                      </span>
                    )}
                    {ratingFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        Đánh giá: {ratingFilter === '5star' ? '5★' : ratingFilter === '4starPlus' ? '4★+' : '3★+'}
                        <X className="w-3.5 h-3.5 hover:text-red-500 cursor-pointer" onClick={() => setRatingFilter('all')} />
                      </span>
                    )}
                    {onlyInStock && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        Trạng thái: Còn hàng
                        <X className="w-3.5 h-3.5 hover:text-red-500 cursor-pointer" onClick={() => setOnlyInStock(false)} />
                      </span>
                    )}
                    {[...selectedSizes].map((size) => (
                      <span key={size} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        Size: {size}
                        <X className="w-3.5 h-3.5 hover:text-red-500 cursor-pointer" onClick={() => handleToggleSize(size)} />
                      </span>
                    ))}
                    {[...selectedColors].map((color) => (
                      <span key={color} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 border border-slate-100 text-slate-600 rounded-full text-xs font-bold">
                        Màu: {color}
                        <X className="w-3.5 h-3.5 hover:text-red-500 cursor-pointer" onClick={() => handleToggleColor(color)} />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-semibold text-center border border-red-100">
                  {errorMsg}
                </div>
              )}

              {/* Loading Skeleton */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl p-3 border border-slate-100 shadow-xs animate-pulse flex flex-col justify-between h-[340px]">
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
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                    <span>Tìm thấy <strong>{sortedAndFilteredProducts.length}</strong> sản phẩm phù hợp.</span>
                  </div>

                  {sortedAndFilteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                      <p className="text-slate-400 text-sm font-medium">Không tìm thấy sản phẩm nào khớp với bộ lọc của bạn.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      {sortedAndFilteredProducts.map((product) => {
                        const priceFormatted = product.price.toLocaleString('vi-VN') + ' ₫';
                        
                        return (
                          <div
                            key={product._id}
                            onClick={() => navigate(`/product/${product._id}`)}
                            className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200/60 cursor-pointer transition-all duration-300 flex flex-col justify-between group relative h-[340px]"
                          >
                            {/* Favorite Badge */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isAuthenticated) { navigate('/login'); return; }
                                const isWished = wishedIds.has(product._id);
                                // Optimistic UI update
                                setWishedIds(prev => {
                                  const next = new Set(prev);
                                  isWished ? next.delete(product._id) : next.add(product._id);
                                  return next;
                                });
                                // Fire API call
                                if (isWished) {
                                  wishlistAPI.remove(token, product._id).catch(() => {
                                    setWishedIds(prev => { const next = new Set(prev); next.add(product._id); return next; });
                                  });
                                } else {
                                  wishlistAPI.add(token, product._id).catch(() => {
                                    setWishedIds(prev => { const next = new Set(prev); next.delete(product._id); return next; });
                                  });
                                }
                              }}
                              className={`absolute top-5 right-5 z-10 p-2 backdrop-blur-xs rounded-full shadow-xs hover:scale-105 active:scale-95 transition ${
                                wishedIds.has(product._id)
                                  ? 'bg-red-50 text-red-500'
                                  : 'bg-white/80 text-slate-400 hover:text-red-500'
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${wishedIds.has(product._id) ? 'fill-current' : ''}`} />
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

          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
