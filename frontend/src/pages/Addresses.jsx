import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { addressAPI } from '../services/api';
import {
  ArrowLeft, MapPin, Plus, Pencil, Trash2, Star, X,
  User, Phone, Home as HomeIcon
} from 'lucide-react';

const Addresses = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext) || {};

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    receiverName: '',
    receiverPhone: '',
    detailAddress: '',
    isDefault: false
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchAddresses();
  }, [isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      const data = await addressAPI.getAll(token);
      setAddresses(data);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ receiverName: '', receiverPhone: '', detailAddress: '', isDefault: false });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (addr) => {
    setEditingId(addr._id);
    setForm({
      receiverName: addr.receiverName,
      receiverPhone: addr.receiverPhone,
      detailAddress: addr.detailAddress,
      isDefault: addr.isDefault
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.receiverName.trim()) errors.receiverName = 'Vui lòng nhập tên người nhận.';
    if (!form.receiverPhone.trim()) {
      errors.receiverPhone = 'Vui lòng nhập số điện thoại.';
    } else if (!/^\d{10}$/.test(form.receiverPhone.trim()) || form.receiverPhone.trim()[0] !== '0') {
      errors.receiverPhone = 'Số điện thoại không hợp lệ.';
    }
    if (!form.detailAddress.trim()) errors.detailAddress = 'Vui lòng nhập địa chỉ chi tiết.';
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    setSaving(true);
    try {
      let data;
      if (editingId) {
        data = await addressAPI.update(token, editingId, form);
      } else {
        data = await addressAPI.add(token, form);
      }
      setAddresses(data.addresses);
      setShowModal(false);
      addToast?.({ message: editingId ? '✅ Cập nhật địa chỉ thành công!' : '✅ Thêm địa chỉ thành công!', type: 'success' });
    } catch (err) {
      addToast?.({ message: err.message || 'Lỗi lưu địa chỉ.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const data = await addressAPI.delete(token, id);
      setAddresses(data.addresses);
      addToast?.({ message: '🗑️ Đã xóa địa chỉ.', type: 'success' });
    } catch (err) {
      addToast?.({ message: err.message || 'Lỗi xóa địa chỉ.', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (addr) => {
    try {
      const data = await addressAPI.update(token, addr._id, { ...addr, isDefault: true });
      setAddresses(data.addresses);
      addToast?.({ message: '⭐ Đã đặt làm địa chỉ mặc định.', type: 'success' });
    } catch (err) {
      addToast?.({ message: err.message || 'Lỗi cập nhật.', type: 'error' });
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#e47937] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">Đang tải địa chỉ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* ── Top navigation ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 mb-6">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-slate-500 hover:text-[#e47937] transition font-bold text-sm cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" /> Về hồ sơ
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 rounded-2xl">
              <MapPin className="w-6 h-6 text-[#e47937]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800">Địa chỉ giao hàng</h1>
              <p className="text-xs text-slate-400 font-semibold">{addresses.length} địa chỉ đã lưu</p>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#e47937] text-white text-sm font-bold rounded-full hover:bg-[#c96222] transition cursor-pointer shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" /> Thêm mới
          </button>
        </div>

        {/* ── Empty state ── */}
        {addresses.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
            <div className="mx-auto w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-10 h-10 text-orange-300" />
            </div>
            <h2 className="text-lg font-bold text-slate-700 mb-2">Chưa có địa chỉ nào</h2>
            <p className="text-sm text-slate-400 mb-6">Thêm địa chỉ giao hàng để đặt hàng nhanh hơn!</p>
            <button
              onClick={openAddModal}
              className="px-6 py-3 bg-[#e47937] text-white font-bold rounded-full text-sm hover:bg-[#c96222] transition cursor-pointer"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Thêm địa chỉ đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div
                key={addr._id}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition ${
                  addr.isDefault ? 'border-[#e47937]/40 ring-2 ring-orange-100' : 'border-slate-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-bold text-slate-800">{addr.receiverName}</h3>
                      <span className="text-slate-300">|</span>
                      <span className="text-sm text-slate-500 font-medium">{addr.receiverPhone}</span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 bg-[#e47937]/10 text-[#e47937] text-[10px] font-black rounded-full uppercase tracking-wide">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{addr.detailAddress}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!addr.isDefault && (
                      <button
                        onClick={() => handleSetDefault(addr)}
                        className="p-2 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                        title="Đặt làm mặc định"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(addr)}
                      className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                      title="Sửa"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(addr._id)}
                      disabled={deletingId === addr._id}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                      title="Xóa"
                    >
                      {deletingId === addr._id ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════ Modal: Add / Edit Address ═══════ */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 mx-4 max-w-md w-full" style={{ animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-800">
                {editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Receiver name */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <User className="w-3.5 h-3.5" /> Tên người nhận
                </label>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={form.receiverName}
                  onChange={e => setForm(p => ({ ...p, receiverName: e.target.value }))}
                  className={`w-full border ${formErrors.receiverName ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}
                    rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300
                    focus:outline-none focus:border-[#e47937] focus:ring-2 focus:ring-orange-100 transition`}
                />
                {formErrors.receiverName && <p className="text-xs text-red-500 font-semibold mt-1">{formErrors.receiverName}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <Phone className="w-3.5 h-3.5" /> Số điện thoại
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="0912345678"
                  maxLength={10}
                  value={form.receiverPhone}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setForm(p => ({ ...p, receiverPhone: digits }));
                  }}
                  className={`w-full border ${formErrors.receiverPhone ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}
                    rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300
                    focus:outline-none focus:border-[#e47937] focus:ring-2 focus:ring-orange-100 transition`}
                />
                {formErrors.receiverPhone && <p className="text-xs text-red-500 font-semibold mt-1">{formErrors.receiverPhone}</p>}
              </div>

              {/* Detail address */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  <HomeIcon className="w-3.5 h-3.5" /> Địa chỉ chi tiết
                </label>
                <textarea
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  rows={3}
                  value={form.detailAddress}
                  onChange={e => setForm(p => ({ ...p, detailAddress: e.target.value }))}
                  className={`w-full border ${formErrors.detailAddress ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}
                    rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300
                    focus:outline-none focus:border-[#e47937] focus:ring-2 focus:ring-orange-100 transition resize-none`}
                />
                {formErrors.detailAddress && <p className="text-xs text-red-500 font-semibold mt-1">{formErrors.detailAddress}</p>}
              </div>

              {/* Default toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))}
                  className="w-5 h-5 rounded-md border-slate-300 text-[#e47937] focus:ring-[#e47937] cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-600">Đặt làm địa chỉ mặc định</span>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-full text-sm hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-[#e47937] text-white font-bold rounded-full text-sm hover:bg-[#c96222] transition cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20"
              >
                {saving ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Thêm địa chỉ')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline keyframe animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.85) } to { opacity: 1; transform: scale(1) } }
      `}</style>
    </div>
  );
};

export default Addresses;
