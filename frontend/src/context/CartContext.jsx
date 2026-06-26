import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

const CART_KEY = 'urbancart_cart';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Khôi phục giỏ hàng từ localStorage khi load trang
  useEffect(() => {
    const stored = localStorage.getItem(CART_KEY);
    if (stored) {
      try {
        setCartItems(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to restore cart:', e);
        localStorage.removeItem(CART_KEY);
      }
    }
  }, []);

  // Helper: lưu state mới vào localStorage
  const persist = (items) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    return items;
  };

  // Thêm sản phẩm vào giỏ — gộp nếu cùng id + size + color
  const addToCart = (product, quantity = 1, { size = '', color = '' } = {}) => {
    setCartItems((prev) => {
      const idx = prev.findIndex(
        (item) =>
          item.product._id === product._id &&
          item.size === size &&
          item.color === color
      );

      let updated;
      if (idx >= 0) {
        // Gộp: cộng thêm số lượng, giới hạn bởi stockQuantity
        updated = prev.map((item, i) => {
          if (i !== idx) return item;
          const newQty = Math.min(
            item.quantity + quantity,
            product.stockQuantity ?? 9999
          );
          return { ...item, quantity: newQty };
        });
      } else {
        // Thêm mới
        updated = [...prev, { product, size, color, quantity }];
      }

      return persist(updated);
    });
  };

  // Cập nhật số lượng của một mục cụ thể
  const updateQuantity = (productId, size, color, newQty) => {
    setCartItems((prev) => {
      const updated = prev.map((item) => {
        if (
          item.product._id === productId &&
          item.size === size &&
          item.color === color
        ) {
          const safeQty = Math.max(1, Math.min(newQty, item.product.stockQuantity ?? 9999));
          return { ...item, quantity: safeQty };
        }
        return item;
      });
      return persist(updated);
    });
  };

  // Xóa một mục khỏi giỏ hàng (khớp id + size + color)
  const removeFromCart = (productId, size, color) => {
    setCartItems((prev) => {
      const updated = prev.filter(
        (item) =>
          !(item.product._id === productId &&
            item.size === size &&
            item.color === color)
      );
      return persist(updated);
    });
  };

  // Xóa toàn bộ giỏ hàng
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(CART_KEY);
  };

  // Tổng số lượng sản phẩm trong giỏ (dùng cho badge ở Header)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Tạm tính (subtotal) chưa có phí ship
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
