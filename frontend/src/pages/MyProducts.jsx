import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { productAPI } from '../services/api';
import { ArrowLeft, Plus, Package, Eye, Star, Info, Inbox, Edit, Trash2, X, AlertTriangle, ClipboardList, Upload } from 'lucide-react';

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

const MyProducts = () => {
  const { token, isAuthenticated } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext) || {};
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals visibility state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit fields state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('Thời trang');
  const [editStockQuantity, setEditStockQuantity] = useState('');
  const [editImages, setEditImages] = useState([]); // Base64 images array
  const [editSizes, setEditSizes] = useState('');
  const [editColors, setEditColors] = useState('');

  // Modal actions state
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

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
        const data = await productAPI.getMine(token);
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching my products:', err);
        setErrorMsg(err.message || 'Không thể kết nối với máy chủ Backend.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyProducts();
  }, [token]);

  // Open edit modal & populate values
  const handleOpenEditModal = (product) => {
    setSelectedProduct(product);
    setEditName(product.name);
    setEditDescription(product.description);
    setEditPrice(product.price);
    setEditCategory(product.category);
    setEditStockQuantity(product.stockQuantity);
    setEditImages(product.images || []);
    setEditSizes(product.variants?.sizes ? product.variants.sizes.join(', ') : '');
    setEditColors(product.variants?.colors ? product.variants.colors.join(', ') : '');
    setModalError('');
    setShowEditModal(true);
  };

  const handleEditFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setModalLoading(true);
    setModalError('');
    try {
      const readPromises = files.map(file => processFile(file));
      const results = await Promise.all(readPromises);
      setEditImages(prev => [...prev, ...results]);
    } catch (err) {
      console.error('Error reading files:', err);
      setModalError('Không thể đọc hoặc xử lý một số tệp hình ảnh.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    const imgFiles = files.filter(f => f.type.startsWith('image/'));
    if (imgFiles.length === 0) return;

    setModalLoading(true);
    setModalError('');
    try {
      const readPromises = imgFiles.map(file => processFile(file));
      const results = await Promise.all(readPromises);
      setEditImages(prev => [...prev, ...results]);
    } catch (err) {
      console.error('Error reading files:', err);
      setModalError('Không thể xử lý một số tệp hình ảnh kéo thả.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEditRemoveImage = (index) => {
    setEditImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleEditSetCover = (index) => {
    setEditImages(prev => {
      const copy = [...prev];
      const target = copy[index];
      copy.splice(index, 1);
      return [target, ...copy]; // Move to top (cover avatar)
    });
  };

  // Open delete confirmation modal
  const handleOpenDeleteConfirm = (product) => {
    setSelectedProduct(product);
    setShowDeleteConfirm(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editDescription.trim() || !editPrice || !editCategory || editStockQuantity === undefined) {
      setModalError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    if (Number(editPrice) <= 0) {
      setModalError('Giá bán phải lớn hơn 0.');
      return;
    }
    if (Number(editStockQuantity) < 0) {
      setModalError('Số lượng tồn kho không được âm.');
      return;
    }

    setModalLoading(true);
    setModalError('');

    const imagesArray = editImages.length > 0
      ? editImages
      : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60'];

    const sizesArray = editSizes.trim()
      ? editSizes.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];
    const colorsArray = editColors.trim()
      ? editColors.split(',').map(c => c.trim()).filter(c => c.length > 0)
      : [];

    const updatedData = {
      name: editName.trim(),
      description: editDescription.trim(),
      price: Number(editPrice),
      category: editCategory,
      images: imagesArray,
      variants: {
        sizes: sizesArray,
        colors: colorsArray
      },
      stockQuantity: Number(editStockQuantity)
    };

    try {
      await productAPI.update(token, selectedProduct._id, updatedData);
      addToast?.({ message: 'Cập nhật sản phẩm thành công!', type: 'success' });
      setShowEditModal(false);
      
      // Refresh product list
      const data = await productAPI.getMine(token);
      setProducts(data.products || []);
    } catch (err) {
      console.error('Error updating product:', err);
      setModalError(err.message || 'Không thể cập nhật sản phẩm.');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    setModalLoading(true);
    try {
      await productAPI.delete(token, selectedProduct._id);
      addToast?.({ message: 'Xóa sản phẩm thành công!', type: 'success' });
      setShowDeleteConfirm(false);
      
      // Refresh product list
      const data = await productAPI.getMine(token);
      setProducts(data.products || []);
    } catch (err) {
      console.error('Error deleting product:', err);
      addToast?.({ message: err.message || 'Không thể xóa sản phẩm.', type: 'error' });
    } finally {
      setModalLoading(false);
    }
  };

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

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/seller/orders')}
              className="flex items-center justify-center gap-2 px-5 py-3 border border-[#1a3150] text-[#1a3150] hover:bg-slate-50 font-extrabold rounded-full text-xs transition duration-200 cursor-pointer select-none"
            >
              <ClipboardList className="w-4.5 h-4.5" /> Quản lý đơn hàng bán
            </button>
            <button
              onClick={() => navigate('/sell')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#e47937] hover:bg-[#c96222] text-white font-extrabold rounded-full text-sm shadow-md hover:scale-102 active:scale-98 transition duration-200 cursor-pointer select-none"
            >
              <Plus className="w-5 h-5" /> Đăng bán sản phẩm mới
            </button>
          </div>
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

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/product/${product._id}`)}
                              className="p-2 bg-slate-100 text-slate-700 rounded-full hover:bg-[#1a3150] hover:text-white transition duration-200 cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(product)}
                              className="p-2 bg-orange-50 text-[#e47937] rounded-full hover:bg-[#e47937] hover:text-white transition duration-200 cursor-pointer"
                              title="Sửa"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteConfirm(product)}
                              className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition duration-200 cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Modal Sửa Sản phẩm */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
            {/* Modal Header */}
            <div className="bg-[#1a3150] px-6 py-5 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl"></div>
              <div className="relative z-10">
                <span className="text-[10px] uppercase tracking-wider text-orange-400 font-extrabold">Kênh người bán</span>
                <h2 className="text-xl font-black mt-0.5">Chỉnh Sửa Sản Phẩm</h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-300 hover:text-white transition p-1 bg-white/10 hover:bg-white/20 rounded-full z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              {modalError && (
                <div className="p-3.5 bg-red-50 text-red-600 rounded-2xl text-xs font-semibold flex items-center gap-2 border border-red-100">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] focus:ring-4 focus:ring-orange-500/5 text-sm font-medium transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">Mô tả sản phẩm *</label>
                  <textarea
                    required
                    rows="3"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] focus:ring-4 focus:ring-orange-500/5 text-sm font-medium transition"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">Danh mục *</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] text-sm font-bold text-slate-700 cursor-pointer transition"
                    >
                      <option value="Thời trang">Thời trang</option>
                      <option value="Giày dép">Giày dép</option>
                      <option value="Phụ kiện">Phụ kiện</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">Giá bán (₫) *</label>
                    <input
                      type="number"
                      required
                      min="1000"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] focus:ring-4 focus:ring-orange-500/5 text-sm font-medium transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">Số lượng tồn kho *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editStockQuantity}
                      onChange={(e) => setEditStockQuantity(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] focus:ring-4 focus:ring-orange-500/5 text-sm font-medium transition"
                    />
                  </div>
                </div>

                {/* Edit Product Images Upload Section */}
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">Hình ảnh sản phẩm</label>
                  
                  {/* Dropzone container */}
                  <div 
                    onClick={() => document.getElementById('edit-file-upload-input').click()}
                    onDragOver={(e) => { e.preventDefault(); }}
                    onDrop={handleEditDrop}
                    className="border-2 border-dashed border-slate-200 hover:border-[#e47937] hover:bg-orange-50/10 rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 select-none group flex flex-col items-center justify-center min-h-[120px]"
                  >
                    <input
                      type="file"
                      id="edit-file-upload-input"
                      multiple
                      accept="image/*"
                      onChange={handleEditFileChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-[#e47937] group-hover:bg-orange-50 transition-all duration-200 mb-2 shadow-sm border border-slate-100">
                      <Upload className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-xs font-bold text-slate-600 group-hover:text-slate-800">
                      Kéo thả hoặc <span className="text-[#e47937] underline">Chọn từ thiết bị</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold">Nhận mọi định dạng ảnh. Cho phép chọn nhiều ảnh.</p>
                  </div>

                  {/* Thumbnails grid */}
                  {editImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      {editImages.map((img, idx) => (
                        <div 
                          key={idx} 
                          className={`group/thumb relative aspect-square rounded-xl overflow-hidden border bg-slate-50 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] ${idx === 0 ? 'border-orange-500 ring-2 ring-orange-500/10' : 'border-slate-200'}`}
                        >
                          <img
                            src={img}
                            alt={`Edit preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Cover image badge */}
                          {idx === 0 ? (
                            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[8px] uppercase tracking-wider rounded shadow-sm border border-orange-400/30 z-10">
                              Ảnh đại diện
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleEditSetCover(idx); }}
                              className="absolute top-1.5 left-1.5 opacity-0 group-hover/thumb:opacity-100 bg-white/90 backdrop-blur-sm text-slate-700 hover:text-orange-500 hover:bg-white font-extrabold text-[8px] px-1.5 py-0.5 rounded border border-slate-200 transition-all shadow-sm cursor-pointer z-10"
                            >
                              Đặt làm ảnh đại diện
                            </button>
                          )}

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleEditRemoveImage(idx); }}
                            className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full transition shadow z-10 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 font-semibold block">Ảnh đầu tiên sẽ là ảnh đại diện hiển thị trong danh sách.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">Kích thước (Sizes)</label>
                    <input
                      type="text"
                      value={editSizes}
                      onChange={(e) => setEditSizes(e.target.value)}
                      placeholder="Ví dụ: S, M, L"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] text-sm font-medium transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">Màu sắc (Colors)</label>
                    <input
                      type="text"
                      value={editColors}
                      onChange={(e) => setEditColors(e.target.value)}
                      placeholder="Ví dụ: Đen, Trắng"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#e47937] text-sm font-medium transition"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-full text-xs transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2.5 bg-[#e47937] hover:bg-[#c96222] disabled:bg-orange-300 text-white font-extrabold rounded-full text-xs shadow-md transition cursor-pointer"
                >
                  {modalLoading ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-sm animate-bounce">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Xóa sản phẩm này?</h3>
            <p className="text-slate-400 text-xs mt-2 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa sản phẩm <strong className="text-slate-700">"{selectedProduct?.name}"</strong>? Hành động này sẽ gỡ bỏ sản phẩm khỏi cửa hàng vĩnh viễn và không thể hoàn tác.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-full text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={modalLoading}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold rounded-full text-xs shadow-md transition cursor-pointer"
              >
                {modalLoading ? 'Đang xóa...' : 'Đúng, xóa sản phẩm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProducts;
