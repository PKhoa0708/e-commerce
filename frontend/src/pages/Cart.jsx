import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowLeft,
  Package, Truck, ShieldCheck, Tag
} from 'lucide-react';

const SHIPPING_THRESHOLD = 500000; // Miễn phí ship nếu >= 500.000₫
const SHIPPING_FEE = 30000;        // Phí ship mặc định 30.000₫

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, clearCart, subtotal } = useContext(CartContext);

  const shippingFee = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  const fmt = (n) => n.toLocaleString('vi-VN') + ' ₫';

  /* ============ EMPTY STATE ============ */
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-sm w-full text-center bg-white rounded-3xl border border-slate-100 shadow-xl p-10">
          <div className="inline-flex p-5 bg-orange-50 text-[#e47937] rounded-full mb-5">
            <ShoppingCart className="w-12 h-12" />
          </div>
          <h1 className="text-xl font-black text-slate-800 mb-2">Giỏ hàng của bạn đang trống</h1>
          <p className="text-slate-400 text-sm mb-8 font-medium">
            Hãy khám phá hàng ngàn sản phẩm thời trang đô thị chờ bạn!
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-[#1a3150] hover:bg-[#152740] text-white font-extrabold rounded-full text-sm transition shadow-sm cursor-pointer select-none"
          >
            Quay lại mua sắm
          </button>
        </div>
      </div>
    );
  }

  /* ============ CART WITH ITEMS ============ */
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* ── Header nav ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-[#e47937] transition font-bold text-sm cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" /> Tiếp tục mua sắm
        </button>
        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            Giỏ Hàng
            <span className="ml-3 text-base font-bold text-slate-400">
              ({cartItems.length} sản phẩm)
            </span>
          </h1>
          <button
            onClick={clearCart}
            className="text-xs text-red-400 hover:text-red-600 font-bold transition cursor-pointer select-none flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── LEFT: Product list ── */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item, idx) => {
            const { product, size, color, quantity } = item;
            const lineTotal = product.price * quantity;
            const key = `${product._id}-${size}-${color}`;

            return (
              <div
                key={key}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-5 flex gap-4 hover:shadow-md transition duration-200"
              >
                {/* Thumbnail */}
                <div
                  className="h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-100 cursor-pointer border border-slate-100"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  <img
                    src={product.images?.[0] || 'https://placehold.co/200x200?text=No+Image'}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    {/* Category */}
                    <span className="text-[10px] font-black text-[#e47937] uppercase tracking-wider">
                      {product.category}
                    </span>
                    {/* Name */}
                    <h3
                      className="text-sm font-extrabold text-slate-800 line-clamp-2 mt-0.5 leading-tight cursor-pointer hover:text-[#e47937] transition"
                      onClick={() => navigate(`/product/${product._id}`)}
                    >
                      {product.name}
                    </h3>
                    {/* Variants badges */}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {size && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          <Tag className="w-3 h-3" /> {size}
                        </span>
                      )}
                      {color && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                          {color}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom row: price + qty + delete */}
                  <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                    {/* Unit price */}
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">Đơn giá</span>
                      <span className="text-sm font-black text-[#e47937]">{fmt(product.price)}</span>
                    </div>

                    {/* Qty counter */}
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                      <button
                        onClick={() => updateQuantity(product._id, size, color, quantity - 1)}
                        disabled={quantity <= 1}
                        className="px-3 py-2 text-slate-500 hover:text-slate-800 disabled:text-slate-300 transition cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-sm font-black text-slate-800 select-none min-w-[28px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product._id, size, color, quantity + 1)}
                        disabled={quantity >= (product.stockQuantity ?? 9999)}
                        className="px-3 py-2 text-slate-500 hover:text-slate-800 disabled:text-slate-300 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line total */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block">Thành tiền</span>
                      <span className="text-sm font-black text-slate-800">{fmt(lineTotal)}</span>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeFromCart(product._id, size, color)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition cursor-pointer"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── RIGHT: Order summary ── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sticky top-6 space-y-5">
            <h2 className="text-base font-black text-slate-800 tracking-tight border-b border-slate-100 pb-3">
              Tóm Tắt Đơn Hàng
            </h2>

            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>Tạm tính ({cartItems.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span>
              <span className="font-extrabold text-slate-800">{fmt(subtotal)}</span>
            </div>

            {/* Shipping */}
            <div className="flex items-center justify-between text-sm font-semibold">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Truck className="w-4 h-4" />
                Phí vận chuyển
              </div>
              {shippingFee === 0 ? (
                <span className="font-extrabold text-green-600">Miễn phí</span>
              ) : (
                <span className="font-extrabold text-slate-800">{fmt(shippingFee)}</span>
              )}
            </div>

            {/* Free shipping hint */}
            {shippingFee > 0 && (
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-xs text-[#e47937] font-bold text-center">
                Mua thêm{' '}
                <span className="font-black">{fmt(SHIPPING_THRESHOLD - subtotal)}</span>{' '}
                để được miễn phí vận chuyển!
              </div>
            )}

            <div className="border-t border-slate-100 pt-4">
              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-slate-800">Tổng cộng</span>
                <span className="text-xl font-black text-[#e47937]">{fmt(total)}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">(Đã bao gồm VAT)</p>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 bg-[#e47937] hover:bg-[#c96222] text-white font-extrabold rounded-full text-sm shadow-lg shadow-orange-500/20 transition cursor-pointer select-none active:scale-98"
            >
              Tiến Hành Thanh Toán →
            </button>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                Thanh toán an toàn
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                <Package className="w-4 h-4 text-[#e47937] flex-shrink-0" />
                Đổi trả trong 7 ngày
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;
