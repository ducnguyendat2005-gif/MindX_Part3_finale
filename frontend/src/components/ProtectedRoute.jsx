// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { tokenStorage } from '../config/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, requiredRole }) {
  const location = useLocation();
  const { isLoading, isAuthenticated } = useAuth();

  // Đang trong lúc AuthContext verify/refresh session lúc app khởi động
  // -> chưa vội kết luận gì, tránh redirect nhầm trong lúc RT còn đang được dùng để refresh AT
  if (isLoading) {
    return <div className="protected-route-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Lúc này AT chắc chắn hợp lệ (đã được verify/refresh xong ở AuthContext) -> chỉ decode để lấy role
  const ATtoken = tokenStorage.getAT();
  let decoded;
  try {
    decoded = jwtDecode(ATtoken);
  } catch (err) {
    tokenStorage.clear();
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (requiredRole && decoded.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}