import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { productAPI } from '../services/api';
import { ArrowLeft, Tag, DollarSign, Image, Layers, Package, Clipboard, AlertCircle, Upload, Trash } from 'lucide-react';

// Async helper to process image files for maximum sharpness
const processFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      
      // If file is smaller than 1.5MB, keep original raw data URL to preserve 100% sharpness
      if (file.size < 1.5 * 1024 * 1024) {
        resolve(dataUrl);
        return;
      }
      
      // If file is large, scale to max 1920px with 98% quality canvas compression
      const img = new window.Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1920;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export high-quality data
        resolve(canvas.toDataURL(file.type || 'image/jpeg', 0.98));
      };
      img.onerror = () => {
        // Fallback to original if canvas loading fails
        resolve(dataUrl);
      };
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

const SellProduct = () => {
  const { token, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // State form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Thời trang'); // Default category
  const [stockQuantity, setStockQuantity] = useState('10'); // Default stock
  const [images, setImages] = useState([]); // Base64 images array
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

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const readPromises = files.map(file => processFile(file));
      const results = await Promise.all(readPromises);
      setImages(prev => [...prev, ...results]);
    } catch (err) {
      console.error('Error reading files:', err);
      setErrorMsg('Không thể đọc hoặc xử lý một số tệp hình ảnh. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    const imgFiles = files.filter(f => f.type.startsWith('image/'));
    if (imgFiles.length === 0) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const readPromises = imgFiles.map(file => processFile(file));
      const results = await Promise.all(readPromises);
      setImages(prev => [...prev, ...results]);
    } catch (err) {
      console.error('Error reading files:', err);
      setErrorMsg('Không thể xử lý một số tệp hình ảnh kéo thả.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSetCover = (index) => {
    setImages(prev => {
      const copy = [...prev];
      const target = copy[index];
      copy.splice(index, 1);
      return [target, ...copy]; // Move to index 0 (will be prioritized as avatar/cover)
    });
  };

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

    // Default image array fallback if empty
    const imagesArray = images.length > 0
      ? images
      : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60'];

    // Handle variants (sizes, colors)
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
      const data = await productAPI.create(token, productData);
      setSuccessMsg('Đăng bán sản phẩm thành công! Đang chuyển hướng...');
      setName('');
      setDescription('');
      setPrice('');
      setImages([]);
      setSizes('');
      setColors('');
      setStockQuantity('10');
      setTimeout(() => navigate('/my-products'), 1500);
    } catch (err) {
      console.error('Error creating product:', err);
      setErrorMsg(err.message || 'Có lỗi xảy ra khi tạo sản phẩm.');
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
            </div>

            {/* Product Image Upload Section */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Hình ảnh sản phẩm</label>
              
              {/* Dropzone container */}
              <div 
                onClick={() => document.getElementById('file-upload-input').click()}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-200 hover:border-[#e47937] hover:bg-orange-50/10 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 select-none group flex flex-col items-center justify-center min-h-[140px]"
              >
                <input
                  type="file"
                  id="file-upload-input"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-[#e47937] group-hover:bg-orange-50 transition-all duration-200 mb-2.5 shadow-sm border border-slate-100">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-600 group-hover:text-slate-800">
                  Kéo thả ảnh vào đây hoặc <span className="text-[#e47937] underline">Chọn từ thiết bị</span>
                </p>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Hỗ trợ JPG, PNG, WEBP... Chọn nhiều ảnh cùng lúc.</p>
              </div>

              {/* Thumbnails grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  {images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className={`group/thumb relative aspect-square rounded-2xl overflow-hidden border bg-slate-50 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] ${idx === 0 ? 'border-orange-500 ring-2 ring-orange-500/10' : 'border-slate-200'}`}
                    >
                      <img
                        src={img}
                        alt={`Product preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Cover image badge */}
                      {idx === 0 ? (
                        <span className="absolute top-2 left-2 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm border border-orange-400/30 z-10">
                          Ảnh đại diện
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleSetCover(idx); }}
                          className="absolute top-2 left-2 opacity-0 group-hover/thumb:opacity-100 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-orange-500 hover:bg-white font-extrabold text-[9px] px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all shadow-sm cursor-pointer z-10"
                        >
                          Đặt làm ảnh đại diện
                        </button>
                      )}

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition shadow-md cursor-pointer active:scale-90 z-10"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <span className="text-[10px] text-slate-400 font-semibold block mt-1">Để trống để hệ thống tự động tạo ảnh demo. Ảnh đầu tiên sẽ là ảnh đại diện hiển thị trong danh sách.</span>
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
