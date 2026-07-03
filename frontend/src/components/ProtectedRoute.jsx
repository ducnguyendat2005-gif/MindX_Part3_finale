// src/components/ProtectedRoute/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { tokenStorage } from '../config/api.js';

export default function ProtectedRoute({ children, requiredRole }) {
  const location = useLocation();
  const ATtoken = tokenStorage.getAT();

  // 1. Không có token
  if (!ATtoken) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  let decoded;
  try {
    decoded = jwtDecode(ATtoken);
  } catch (err) {
    tokenStorage.clear();
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // 2. Token hết hạn
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    tokenStorage.clear();
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // 3. Sai role yêu cầu
  if (requiredRole && decoded.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}