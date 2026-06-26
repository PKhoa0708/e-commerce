import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home';
import SellProduct from '../pages/SellProduct';
import MyProducts from '../pages/MyProducts';
import ProductDetail from '../pages/ProductDetail';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import OrderSuccess from '../pages/OrderSuccess';
import Profile from '../pages/Profile';
import Orders from '../pages/Orders';
import SellerOrders from '../pages/SellerOrders';
import Wishlist from '../pages/Wishlist';
import Addresses from '../pages/Addresses';
import Chat from '../pages/Chat';
import VNPayReturn from '../pages/VNPayReturn';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/sell" element={<SellProduct />} />
      <Route path="/my-products" element={<MyProducts />} />
      <Route path="/seller/orders" element={<SellerOrders />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/addresses" element={<Addresses />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/checkout/vnpay-return" element={<VNPayReturn />} />
    </Routes>
  );
};


export default AppRoutes;




