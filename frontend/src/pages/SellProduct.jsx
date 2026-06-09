import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Tag, DollarSign, Image, Layers, Package, Clipboard, AlertCircle } from 'lucide-react';

const SellProduct = () => {
  const { token, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // State form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Thời trang'); // Default category
  const [stockQuantity, setStockQuantity] = useState('10'); // Default stock
  const [imageUrl, setImageUrl] = useState('');
  const [sizes, setSizes] = useState('');
  const [colors, setColors] = useState('');

  // Status state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim() || !description.trim() || !price || !category || !stockQuantity) {
      setErrorMsg('Vui lòng điền đầy đủ các trường thông tin bắt buộc.');
      return;
    }

    if (Number(price) <= 0) {
      setErrorMsg('Giá bán phải lớn hơn 0.');
      return;
    }

    if (Number(stockQuantity) < 0) {
      setErrorMsg('Số lượng tồn kho không được âm.');
      return;
    }

    setLoading(true);

    // Xử lý ảnh (mảng chuỗi)
    const imagesArray = imageUrl.trim() 
      ? imageUrl.split(',').map(url => url.trim()).filter(url => url.length > 0)
      : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60']; // Ảnh mặc định nếu bỏ trống

    // Xử lý variants (sizes, colors)
    const sizesArray = sizes.trim()
      ? sizes.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];
    const colorsArray = colors.trim()
      ? colors.split(',').map(c => c.trim()).filter(c => c.length > 0)
      : [];

    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      images: imagesArray,
      variants: {
        sizes: sizesArray,
        colors: colorsArray
      },
      stockQuantity: Number(stockQuantity)
    };

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('Đăng bán sản phẩm thành công! Đang chuyển hướng...');
        // Reset form
        setName('');
        setDescription('');
        setPrice('');
        setImageUrl('');
        setSizes('');
        setColors('');
        setStockQuantity('10');
        
        setTimeout(() => {
          navigate('/my-products');
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Có lỗi xảy ra khi tạo sản phẩm.');
      }
    } catch (err) {
      console.error('Error creating product:', err);
      setErrorMsg('Không thể kết nối với máy chủ Backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Back navigation */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-[#e47937] transition font-semibold text-sm mb-6 cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Trang chủ
        </button>

        {/* Form Container Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          {/* Header section with brand colors */}
          <div className="bg-[#1a3150] px-8 py-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <span className="text-xs uppercase tracking-wider text-orange-400 font-extrabold">Kênh người bán</span>
              <h1 className="text-2xl sm:text-3xl font-black mt-1">Đăng Bán Sản Phẩm Mới</h1>
              <p className="text-slate-300 text-sm mt-2 font-medium">Cung cấp đầy đủ thông tin chi tiết để thu hút khách hàng tốt nhất.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Display status messages */}
            {errorMsg && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-semibold flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-green-50 text-green-600 rounded-2xl text-sm font-semibold text-center border border-green-100 animate-pulse">
                {successMsg}
              </div>
            )}

            {/* General Info Section */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-[#1a3150] border-b border-slate-100 pb-2">1. Thông tin chung</h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Tên sản phẩm *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Tag className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Áo khoác Bomber Urban Streetwear"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] focus:ring-4 focus:ring-orange-500/5 text-sm font-medium transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Mô tả sản phẩm *</label>
                <div className="relative">
                  <div className="absolute top-3 left-3.5 text-slate-400 pointer-events-none">
                    <Clipboard className="w-4.5 h-4.5" />
                  </div>
                  <textarea
                    required
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả chi tiết chất liệu, phom dáng, hướng dẫn chọn size..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] focus:ring-4 focus:ring-orange-500/5 text-sm font-medium transition"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Price & Category Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Danh mục *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Layers className="w-4.5 h-4.5" />
                  </div>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] focus:ring-4 focus:ring-orange-500/5 text-sm font-bold text-slate-700 cursor-pointer transition"
                  >
                    <option value="Thời trang">Thời trang</option>
                    <option value="Giày dép">Giày dép</option>
                    <option value="Phụ kiện">Phụ kiện</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Giá bán (₫) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <span className="font-extrabold text-sm text-slate-500">₫</span>
                  </div>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ví dụ: 250000"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] focus:ring-4 focus:ring-orange-500/5 text-sm font-medium transition"
                  />
                </div>
              </div>
            </div>

            {/* Inventory & Image Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Số lượng trong kho *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Package className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="Ví dụ: 10"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] focus:ring-4 focus:ring-orange-500/5 text-sm font-medium transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Link hình ảnh sản phẩm</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Image className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Nhiều link phân cách bằng dấu phẩy (,)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] focus:ring-4 focus:ring-orange-500/5 text-sm font-medium transition"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">Để trống để hệ thống tự động tạo ảnh demo.</span>
              </div>
            </div>

            {/* Variants Section */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-[#1a3150] border-b border-slate-100 pb-2">2. Phân loại sản phẩm (Tùy chọn)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Kích thước (Sizes)</label>
                  <input
                    type="text"
                    value={sizes}
                    onChange={(e) => setSizes(e.target.value)}
                    placeholder="Ví dụ: S, M, L, XL"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] focus:ring-4 focus:ring-orange-500/5 text-sm font-medium transition"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">Các kích thước ngăn cách bằng dấu phẩy.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Màu sắc (Colors)</label>
                  <input
                    type="text"
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                    placeholder="Ví dụ: Đen, Trắng, Kem"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] focus:ring-4 focus:ring-orange-500/5 text-sm font-medium transition"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">Các màu sắc ngăn cách bằng dấu phẩy.</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-full text-sm transition cursor-pointer select-none"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-[#e47937] hover:bg-[#c96222] disabled:bg-orange-300 text-white font-extrabold rounded-full text-sm shadow-md hover:scale-102 active:scale-98 transition duration-200 cursor-pointer select-none"
              >
                {loading ? 'Đang đăng sản phẩm...' : 'Đăng bán sản phẩm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellProduct;
