import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { userAPI, orderAPI, wishlistAPI } from '../services/api';
import {
  User, Mail, Phone, Lock, Eye, EyeOff,
  Save, ArrowLeft, ShieldCheck, Package, Star, Settings, Camera
} from 'lucide-react';

/* ── Avatar initial generator & custom image display ── */
const Avatar = ({ name, size = 'lg', src }) => {
  const initials = name
    ? name.trim().split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
    : '?';
  const colors = [
    'from-orange-400 to-rose-500',
    'from-violet-500 to-purple-600',
    'from-cyan-400 to-blue-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
  ];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const sz = size === 'lg' ? 'w-24 h-24 text-3xl' : 'w-10 h-10 text-base';
  
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sz} rounded-full object-cover shadow-lg border-2 border-white/80 flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}
      />
    );
  }
  
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-black text-white shadow-lg flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}>
      {initials}
    </div>
  );
};

/* ── Input component ── */
const FormInput = ({ label, icon: Icon, error, rightElement, className = '', ...props }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
      {Icon && <Icon className="w-4 h-4 text-slate-400" />} {label}
    </label>
    <div className="relative">
      <input
        {...props}
        className={`w-full border ${error ? 'border-red-400 bg-red-50/50' : 'border-slate-200/60 bg-white/70'}
          rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800
          placeholder:text-slate-300 focus:outline-none focus:border-[#e47937]
          focus:ring-4 focus:ring-orange-500/5 focus:bg-white transition pr-${rightElement ? '12' : '4'} ${className}`}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">{rightElement}</div>
      )}
    </div>
    {error && <p className="text-xs text-red-500 font-semibold mt-1">{error}</p>}
  </div>
);

// Async helper to process avatar image files for supreme sharpness
const processAvatarFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      
      // Resizing to maximum 400px width/height for optimized avatar storage, using quality 0.98 for supreme sharpness
      const img = new window.Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400;
        
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
        
        resolve(canvas.toDataURL(file.type || 'image/jpeg', 0.98));
      };
      img.onerror = () => {
        resolve(dataUrl);
      };
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

const Profile = () => {
  const navigate = useNavigate();
  const { user: authUser, token, logout, updateUser } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext) || {};

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'security'
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Real data stats
  const [orderCount, setOrderCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Info form
  const [infoForm, setInfoForm] = useState({ name: '', email: '', phone: '' });
  const [infoErrors, setInfoErrors] = useState({});
  const [savingInfo, setSavingInfo] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  /* ── Fetch profile and stats ── */
  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [profileData, ordersData, wishlistData] = await Promise.all([
          userAPI.getProfile(token),
          orderAPI.getMine(token).catch(() => []),
          wishlistAPI.getAll(token).catch(() => [])
        ]);
        
        setProfile(profileData);
        setInfoForm({
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || ''
        });
        setOrderCount(ordersData.length || 0);
        setWishlistCount(wishlistData.length || 0);
      } catch (err) {
        console.error('Error loading profile data:', err);
        addToast?.({ message: 'Không thể tải thông tin hồ sơ và thống kê.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [token]);

  /* ── Update info ── */
  const handleSaveInfo = async () => {
    const errors = {};
    if (!infoForm.name.trim()) errors.name = 'Vui lòng nhập họ tên.';
    
    // Email validation
    if (!infoForm.email.trim()) {
      errors.email = 'Vui lòng nhập email.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(infoForm.email.trim())) {
        errors.email = 'Email không hợp lệ (VD: example@gmail.com).';
      }
    }

    if (infoForm.phone && !/^(0[3-9]\d{8})$/.test(infoForm.phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ (VD: 0912345678).';
    }
    if (Object.keys(errors).length) { setInfoErrors(errors); return; }
    setInfoErrors({});
    setSavingInfo(true);
    try {
      const data = await userAPI.updateProfile(token, {
        name: infoForm.name.trim(),
        email: infoForm.email.trim(),
        phone: infoForm.phone.trim(),
        avatar: profile?.avatar
      });
      setProfile(data.user);
      updateUser(data.user); // Sync Context and LocalStorage
      addToast?.({ message: '✅ Cập nhật thông tin thành công!', type: 'success' });
    } catch (e) {
      addToast?.({ message: e.message || 'Lỗi cập nhật.', type: 'error' });
    } finally {
      setSavingInfo(false);
    }
  };

  /* ── Handle Avatar Upload from Device ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const base64Image = await processAvatarFile(file);
      
      // Update on Backend
      const data = await userAPI.updateProfile(token, {
        name: infoForm.name || profile?.name,
        email: infoForm.email || profile?.email,
        phone: infoForm.phone || profile?.phone,
        avatar: base64Image
      });
      
      // Update Context and State
      setProfile(data.user);
      updateUser(data.user);
      addToast?.({ message: '📸 Đã cập nhật ảnh đại diện mới thành công!', type: 'success' });
    } catch (err) {
      console.error('Error updating avatar:', err);
      addToast?.({ message: 'Không thể đọc hoặc cập nhật ảnh đại diện.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Change password ── */
  const handleChangePassword = async () => {
    const errors = {};
    if (!pwForm.currentPassword) errors.currentPassword = 'Nhập mật khẩu hiện tại.';
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) errors.newPassword = 'Mật khẩu mới tối thiểu 6 ký tự.';
    if (pwForm.newPassword !== pwForm.confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    if (Object.keys(errors).length) { setPwErrors(errors); return; }
    setPwErrors({});
    setSavingPw(true);
    try {
      await userAPI.changePassword(token, { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      addToast?.({ message: '🔐 Đổi mật khẩu thành công!', type: 'success' });
    } catch (e) {
      addToast?.({ message: e.message || 'Lỗi đổi mật khẩu.', type: 'error' });
    } finally {
      setSavingPw(false);
    }
  };

  const toggleShow = (field) => setShowPw(prev => ({ ...prev, [field]: !prev[field] }));

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/30 to-purple-200/20 blur-3xl -z-10" />
        <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-gradient-to-bl from-orange-100/40 to-amber-200/20 blur-3xl -z-10" />
        
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-100/80 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-[#e47937] border-r-amber-500 rounded-full animate-spin" />
          </div>
          <p className="text-slate-500 font-bold text-sm tracking-wide animate-pulse">Đang tải hồ sơ cá nhân...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Package, label: 'Đơn hàng', value: orderCount.toString(), color: 'text-blue-600', bg: 'bg-blue-50/70', to: '/orders' },
    { icon: Star, label: 'Yêu thích', value: wishlistCount.toString(), color: 'text-amber-500', bg: 'bg-amber-50/70', to: '/wishlist' },
    { icon: ShieldCheck, label: 'Bảo mật', value: 'Tốt', color: 'text-green-600', bg: 'bg-green-50/70', to: null },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans pb-20 relative overflow-hidden">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/30 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-gradient-to-bl from-orange-100/50 to-amber-200/30 blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-blue-100/30 to-teal-100/20 blur-3xl -z-10 pointer-events-none" />

      {/* ── Top navigation ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 mb-6 relative z-10">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-slate-500 hover:text-[#e47937] transition-all font-bold text-sm cursor-pointer select-none active:scale-95 duration-200"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" /> Về trang chủ
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 relative z-10">

        {/* ── Profile hero card ── */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden transition-all duration-300 hover:shadow-lg">
          {/* Cover Banner Image */}
          <div className="h-32 relative overflow-hidden bg-slate-100">
            <img 
              src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80" 
              alt="Profile Cover Banner" 
              className="w-full h-full object-cover select-none pointer-events-none"
            />
            {/* Light ambient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-black/10"></div>
          </div>
          
          {/* Avatar + info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 mb-6 relative z-10">
              
              {/* Avatar Uploader container */}
              <div 
                className="relative group cursor-pointer border-4 border-white rounded-full shadow-2xl overflow-hidden flex-shrink-0 bg-slate-100 -mt-16 z-20"
                onClick={() => document.getElementById('avatar-upload-input').click()}
              >
                <input
                  type="file"
                  id="avatar-upload-input"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                
                {/* Visual Avatar */}
                <Avatar name={profile?.name} size="lg" src={profile?.avatar} />
                
                {/* Hover Camera icon overlay */}
                <div className="absolute inset-0 bg-black/45 backdrop-blur-xs flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Camera className="w-5 h-5 mb-1 text-slate-100 animate-bounce" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-100">Thay đổi</span>
                </div>
              </div>

              <div className="mb-2 text-center sm:text-left">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">{profile?.name}</h1>
                <p className="text-slate-400 text-sm font-semibold">{profile?.email}</p>
                {/* User Role Badge */}
                <span className="inline-block px-2.5 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[9px] uppercase tracking-wider rounded-lg shadow-sm border border-orange-400/30 mt-1">
                  {profile?.role === 'seller' ? 'Người bán' : profile?.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}
                </span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  onClick={() => s.to && navigate(s.to)}
                  className={`bg-white/80 border border-slate-100/60 rounded-2xl p-3.5 text-center shadow-xs transition-all duration-200 ${s.to ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-95 hover:border-slate-200/50' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2 border border-slate-200/20 shadow-inner`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <p className={`text-xl font-black text-slate-800 tracking-tight`}>{s.value}</p>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2.5 bg-white/70 backdrop-blur-md rounded-2xl border border-slate-100/80 shadow-sm p-1.5 select-none">
          {[
            { id: 'info', icon: User, label: 'Thông tin cá nhân' },
            { id: 'security', icon: Lock, label: 'Bảo mật & Mật khẩu' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition cursor-pointer select-none active:scale-[0.98] duration-150
                ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#1a3150] to-[#2b4c78] text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Thông tin cá nhân ── */}
        {activeTab === 'info' && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-100/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-orange-50 rounded-lg"><Settings className="w-4 h-4 text-[#e47937]" /></div>
              <h2 className="text-base font-black text-slate-800">Chỉnh sửa thông tin</h2>
            </div>

            <FormInput
              label="Họ và tên"
              icon={User}
              type="text"
              placeholder="Nguyễn Văn A"
              value={infoForm.name}
              onChange={(e) => setInfoForm(p => ({ ...p, name: e.target.value }))}
              error={infoErrors.name}
            />
            <FormInput
              label="Email"
              icon={Mail}
              type="email"
              placeholder="nguyenvana@gmail.com"
              value={infoForm.email}
              onChange={profile?.authProvider === 'google' ? undefined : (e) => {
                setInfoForm(p => ({ ...p, email: e.target.value }));
                if (infoErrors.email) setInfoErrors(prev => ({ ...prev, email: '' }));
              }}
              readOnly={profile?.authProvider === 'google'}
              onClick={profile?.authProvider === 'google' ? () => setInfoErrors(prev => ({ ...prev, email: 'Email không thể thay đổi.' })) : undefined}
              className={profile?.authProvider === 'google' ? "cursor-not-allowed opacity-75 bg-slate-50/50" : ""}
              error={infoErrors.email}
            />
            <FormInput
              label="Số điện thoại"
              icon={Phone}
              type="tel"
              placeholder="0912345678"
              value={infoForm.phone}
              onChange={(e) => setInfoForm(p => ({ ...p, phone: e.target.value }))}
              error={infoErrors.phone}
            />

            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              * Tài khoản liên kết Google không hỗ trợ thay đổi email trực tiếp.
            </p>

            <button
              onClick={handleSaveInfo}
              disabled={savingInfo}
              className="flex items-center justify-center gap-2 w-full py-3.5
                bg-gradient-to-r from-[#e47937] to-[#f49357] hover:shadow-orange-500/15 disabled:bg-slate-350 disabled:cursor-not-allowed
                text-white font-extrabold rounded-full text-sm shadow-md hover:shadow-lg
                transition cursor-pointer select-none active:scale-[0.98] duration-200"
            >
              {savingInfo ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
              ) : (
                <><Save className="w-4 h-4" /> Lưu thay đổi</>
              )}
            </button>
          </div>
        )}

        {/* ── Tab: Bảo mật ── */}
        {activeTab === 'security' && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-100/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-50 rounded-lg"><Lock className="w-4 h-4 text-blue-500" /></div>
              <h2 className="text-base font-black text-slate-800">Đổi mật khẩu</h2>
            </div>

            {/* Tip */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-xs text-blue-600 font-semibold">
              💡 Dùng mật khẩu mạnh gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
            </div>

            {/* Current password */}
            <FormInput
              label="Mật khẩu hiện tại"
              icon={Lock}
              type={showPw.current ? 'text' : 'password'}
              placeholder="••••••••"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
              error={pwErrors.currentPassword}
              rightElement={
                <button onClick={() => toggleShow('current')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  {showPw.current ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              }
            />

            {/* New password */}
            <FormInput
              label="Mật khẩu mới (tối thiểu 6 ký tự)"
              icon={Lock}
              type={showPw.new ? 'text' : 'password'}
              placeholder="••••••••"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
              error={pwErrors.newPassword}
              rightElement={
                <button onClick={() => toggleShow('new')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  {showPw.new ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              }
            />

            {/* Confirm password */}
            <FormInput
              label="Xác nhận mật khẩu mới"
              icon={Lock}
              type={showPw.confirm ? 'text' : 'password'}
              placeholder="••••••••"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
              error={pwErrors.confirmPassword}
              rightElement={
                <button onClick={() => toggleShow('confirm')} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  {showPw.confirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              }
            />

            <button
              onClick={handleChangePassword}
              disabled={savingPw}
              className="flex items-center justify-center gap-2 w-full py-3.5
                bg-gradient-to-r from-[#1a3150] to-[#2b4c78] hover:shadow-[#1a3150]/15 disabled:bg-slate-355 disabled:cursor-not-allowed
                text-white font-extrabold rounded-full text-sm shadow-md
                transition cursor-pointer select-none active:scale-[0.98] duration-200"
            >
              {savingPw ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang xử lý...</>
              ) : (
                <><ShieldCheck className="w-4 h-4" /> Đổi mật khẩu</>
              )}
            </button>

            {/* Danger zone */}
            <div className="border-t border-slate-100 pt-5 mt-2">
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="w-full py-3.5 border border-red-200 text-red-500 hover:bg-red-50/50 hover:border-red-300
                  font-extrabold rounded-full text-sm transition cursor-pointer select-none active:scale-[0.98] duration-150"
              >
                Đăng xuất khỏi tài khoản
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
