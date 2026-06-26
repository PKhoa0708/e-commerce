/**
 * api.js — Tập trung toàn bộ API calls của UrbanCart
 * Mọi component chỉ cần import từ file này, không dùng fetch() trực tiếp.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ─────────────────────────────────────────────────────────────
   Hàm helper nội bộ — xử lý request chung
   ───────────────────────────────────────────────────────────── */
async function request(path, { method = 'GET', token = null, body = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, config);
  const data = await res.json();

  if (!res.ok) {
    // Ném lỗi với message từ server hoặc message mặc định
    throw new Error(data.message || `Lỗi ${res.status}`);
  }

  return data;
}

/* ─────────────────────────────────────────────────────────────
   AUTH
   ───────────────────────────────────────────────────────────── */
export const authAPI = {
  /** Đăng nhập — truyền emailOrPhone và password, trả về { token, user } */
  login: (emailOrPhone, password) =>
    request('/auth/login', { method: 'POST', body: { emailOrPhone, password } }),

  /** Đăng ký — trả về { token, user } */
  register: (name, emailOrPhone, password) =>
    request('/auth/register', { method: 'POST', body: { name, emailOrPhone, password } }),

  /** Đăng nhập bằng Google */
  loginWithGoogle: (token) =>
    request('/auth/google', { method: 'POST', body: { token } }),
};

/* ─────────────────────────────────────────────────────────────
   PRODUCTS
   ───────────────────────────────────────────────────────────── */
export const productAPI = {
  /** Lấy danh sách sản phẩm (có thể lọc và phân trang) */
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },

  /** Lấy chi tiết một sản phẩm theo ID */
  getById: (id) => request(`/products/${id}`),

  /** Lấy sản phẩm của chính user đang đăng nhập */
  getMine: (token) => request('/products/my', { token }),

  /** Đăng bán sản phẩm mới */
  create: (token, productData) =>
    request('/products', { method: 'POST', token, body: productData }),

  /** Cập nhật sản phẩm */
  update: (token, id, productData) =>
    request(`/products/${id}`, { method: 'PUT', token, body: productData }),

  /** Xóa sản phẩm */
  delete: (token, id) =>
    request(`/products/${id}`, { method: 'DELETE', token }),

  /** Lấy danh sách đánh giá sản phẩm */
  getReviews: (id) =>
    request(`/products/${id}/reviews`),

  /** Thêm đánh giá sản phẩm */
  addReview: (token, id, reviewData) =>
    request(`/products/${id}/reviews`, { method: 'POST', token, body: reviewData }),
};

/* ─────────────────────────────────────────────────────────────
   USER / PROFILE
   ───────────────────────────────────────────────────────────── */
export const userAPI = {
  /** Lấy hồ sơ cá nhân */
  getProfile: (token) => request('/users/profile', { token }),

  /** Cập nhật tên, email, số điện thoại và ảnh đại diện */
  updateProfile: (token, { name, email, phone, avatar }) =>
    request('/users/profile', { method: 'PUT', token, body: { name, email, phone, avatar } }),

  /** Đổi mật khẩu */
  changePassword: (token, { currentPassword, newPassword }) =>
    request('/users/change-password', {
      method: 'PUT',
      token,
      body: { currentPassword, newPassword },
    }),
};

/* ─────────────────────────────────────────────────────────────
   ORDERS
   ───────────────────────────────────────────────────────────── */
export const orderAPI = {
  /** Tạo đơn hàng mới */
  create: (token, { items, shippingInfo, paymentMethod }) =>
    request('/orders', {
      method: 'POST',
      token,
      body: { items, shippingInfo, paymentMethod },
    }),

  /** Lấy danh sách đơn hàng của user (mới nhất lên đầu) */
  getMine: (token) => request('/orders/my', { token }),

  /** Lấy chi tiết một đơn hàng */
  getById: (token, id) => request(`/orders/${id}`, { token }),

  /** Lấy danh sách đơn hàng được mua từ các sản phẩm của người bán */
  getSellerOrders: (token) => request('/orders/seller', { token }),

  /** Cập nhật trạng thái đơn hàng (dành cho người bán) */
  updateStatus: (token, id, status) =>
    request(`/orders/${id}/status`, {
      method: 'PUT',
      token,
      body: { status },
    }),
};

/* ─────────────────────────────────────────────────────────────
   WISHLIST
   ───────────────────────────────────────────────────────────── */
export const wishlistAPI = {
  /** Lấy danh sách yêu thích */
  getAll: (token) => request('/wishlist', { token }),

  /** Thêm sản phẩm vào yêu thích */
  add: (token, productId) =>
    request('/wishlist', { method: 'POST', token, body: { productId } }),

  /** Xóa sản phẩm khỏi yêu thích */
  remove: (token, productId) =>
    request(`/wishlist/${productId}`, { method: 'DELETE', token }),

  /** Kiểm tra hàng loạt productIds */
  check: (token, productIds) =>
    request('/wishlist/check', { method: 'POST', token, body: { productIds } }),
};

/* ─────────────────────────────────────────────────────────────
   ADDRESSES
   ───────────────────────────────────────────────────────────── */
export const addressAPI = {
  /** Lấy tất cả địa chỉ */
  getAll: (token) => request('/users/addresses', { token }),

  /** Thêm địa chỉ mới */
  add: (token, data) =>
    request('/users/addresses', { method: 'POST', token, body: data }),

  /** Cập nhật địa chỉ */
  update: (token, id, data) =>
    request(`/users/addresses/${id}`, { method: 'PUT', token, body: data }),

  /** Xóa địa chỉ */
  delete: (token, id) =>
    request(`/users/addresses/${id}`, { method: 'DELETE', token }),
};

/* ─────────────────────────────────────────────────────────────
   CHAT
   ───────────────────────────────────────────────────────────── */
export const chatAPI = {
  /** Lấy danh sách hội thoại */
  getConversations: (token) =>
    request('/chat/conversations', { token }),

  /** Lấy tin nhắn trong hội thoại */
  getMessages: (token, conversationId) =>
    request(`/chat/conversations/${conversationId}/messages`, { token }),

  /** Gửi tin nhắn mới */
  sendMessage: (token, { conversationId, receiverId, content, productId }) =>
    request('/chat/messages', {
      method: 'POST',
      token,
      body: { conversationId, receiverId, content, productId }
    }),

  /** Đánh dấu đã đọc tất cả tin nhắn trong hội thoại */
  markAsRead: (token, conversationId) =>
    request(`/chat/conversations/${conversationId}/read`, { method: 'PUT', token }),
};

/* ─────────────────────────────────────────────────────────────
   PAYMENT
   ───────────────────────────────────────────────────────────── */
export const paymentAPI = {
  /** Xác thực giao dịch thanh toán VNPay */
  verifyVNPay: (token, queryParams) => {
    const qs = new URLSearchParams(queryParams).toString();
    return request(`/payment/vnpay-verify${qs ? `?${qs}` : ''}`, { token });
  },
};


