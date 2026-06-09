import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home';
import SellProduct from '../pages/SellProduct';
import MyProducts from '../pages/MyProducts';
import ProductDetail from '../pages/ProductDetail';

// Placeholders for routes without UI/functional logic built yet
const CartSkeleton = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white font-sans">
    <h1 className="text-4xl font-bold tracking-tight mb-2">Giỏ Hàng (Skeleton)</h1>
    <p className="text-slate-400">Trang Giỏ Hàng sẽ được xây dựng tại đây.</p>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/cart" element={<CartSkeleton />} />
      <Route path="/sell" element={<SellProduct />} />
      <Route path="/my-products" element={<MyProducts />} />
      <Route path="/product/:id" element={<ProductDetail />} />
    </Routes>
  );
};

export default AppRoutes;


