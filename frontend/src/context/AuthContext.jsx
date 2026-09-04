// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { API, tokenStorage, fetchWithAuth } from '../config/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // isLoading = đang trong quá trình verify/refresh AT lúc khởi động app
  // isAuthenticated = results sau khi verify xong (chỉ đáng tin khi isLoading === false)
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifySession = async () => {
      const AT = tokenStorage.getAT();
      if (!AT) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // fetchWithAuth tự động thử refresh bằng RT nếu AT hết hạn (code TOKEN_EXPIRED)
        const res = await fetchWithAuth(API.myprofile);
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          tokenStorage.clear();
          setIsAuthenticated(false);
        }
      } catch (err) {
        // Lỗi mạng: không chắc token hỏng hay không, không clear vội
        console.error('Verify session failed:', err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();

    // Cho phép các nơi khác (vd sau khi logout) báo lại trạng thái auth
    const handleUserUpdated = () => {
      setIsAuthenticated(!!tokenStorage.getAT());
    };
    window.addEventListener('userUpdated', handleUserUpdated);
    return () => window.removeEventListener('userUpdated', handleUserUpdated);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  return ctx;
}