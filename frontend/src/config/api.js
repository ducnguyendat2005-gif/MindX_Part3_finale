// src/config/api.js
// File cấu hình tập trung: tất cả endpoint backend + helper gọi API có kèm token.
// Yêu cầu: trong frontend/.env phải có dòng:
//   VITE_API_URL=http://localhost:5000

const BASE_URL = import.meta.env.VITE_API_URL;

export const API = {
  // ── Public — không cần đăng nhập ──
  courses: `${BASE_URL}/courses`,
  courseById: (id) => `${BASE_URL}/courses/${id}`,
  topCourses: `${BASE_URL}/top-courses`,
  mainComment: `${BASE_URL}/mainComment`,
  register: `${BASE_URL}/register`,
  registerTeacher: `${BASE_URL}/register/teacher`,  
  login: `${BASE_URL}/login`,
  refreshToken: `${BASE_URL}/account/refresh-token`,
  topTeacher: `${BASE_URL}/top-teacher`,
  checkDuplicateEmail: `${BASE_URL}/account/check-duplicate`,

  // ── Protected — cần đăng nhập (gửi kèm AT) ──
  mycourses: `${BASE_URL}/account/mycourses`,
  teachingCourses: `${BASE_URL}/account/teaching-courses?status=published`,
  teachingDrafts: `${BASE_URL}/account/teaching-courses?status=draft`,
  teachingCourseById: (id) => `${BASE_URL}/account/teaching-courses/${id}`,
  createCourse: `${BASE_URL}/account/teaching-courses`,
  myprofile: `${BASE_URL}/account/myprofile`,
  myTeacherProfile: `${BASE_URL}/account/myprofile/teacher`, 
  updateAccount: `${BASE_URL}/account/update-account`,        
  updateInstructor: `${BASE_URL}/account/update-instructor`,
  changePassword: `${BASE_URL}/account/change-password`,
  checkout: `${BASE_URL}/account/checkout`,
  applyCoupon: `${BASE_URL}/account/apply-coupon`, 
  admin: `${BASE_URL}/admin`,
  postReview: (courseId) => `${BASE_URL}/courses/${courseId}/reviews`,
  myReviews: `${BASE_URL}/account/reviews`,
  updateReview: (reviewId) => `${BASE_URL}/account/review/${reviewId}`,
  deleteReview: (id) => `${BASE_URL}/account/review/${id}`,
  createMomoOrder: `${BASE_URL}/account/momo/create`,
  createVnpayOrder: `${BASE_URL}/account/vnpay/create`,
};

// Lưu / đọc / xóa token tập trung 1 chỗ, tránh rải localStorage.getItem khắp nơi
export const tokenStorage = {
  getAT: () => localStorage.getItem('ATtoken'),
  getRT: () => localStorage.getItem('RTtoken'),
  set: (ATtoken, RTtoken) => {
    localStorage.setItem('ATtoken', ATtoken);
    if (RTtoken) localStorage.setItem('RTtoken', RTtoken);
  },
  setAT: (ATtoken) => localStorage.setItem('ATtoken', ATtoken),
  // Only update the cached user while the originating session is still active.
  setUser: (user, expectedAT) => {
    const currentAT = localStorage.getItem('ATtoken');
    if (!currentAT || (expectedAT && currentAT !== expectedAT)) return false;

    localStorage.setItem('loggedInUser', JSON.stringify(user));
    window.dispatchEvent(new Event('userUpdated'));
    return true;
  },
  clear: () => {
    localStorage.removeItem('ATtoken');
    localStorage.removeItem('RTtoken');
    localStorage.removeItem('loggedInUser');
  },
};

/**
 * fetchWithAuth — gọi API có đính kèm Access Token.
 * Nếu AT hết hạn (code: TOKEN_EXPIRED), tự động gọi /account/refresh-token
 * bằng Refresh Token, lưu AT mới, rồi gọi lại request gốc đúng 1 lần.
 * Nếu RT cũng hết hạn/không hợp lệ → xóa hết token, chuyển về /signin.
 */
export const fetchWithAuth = async (url, options = {}) => {
  const doFetch = (accessToken) => {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    };

    // Let the browser add the multipart boundary for FormData.
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(url, { ...options, headers });
  };

  let res = await doFetch(tokenStorage.getAT());

  if (res.status === 401) {
    const body = await res.clone().json().catch(() => ({}));

    if (body.code === 'TOKEN_EXPIRED') {
      const RTtoken = tokenStorage.getRT();
      if (!RTtoken) {
        tokenStorage.clear();
        window.location.href = '/signin';
        return res;
      }

      const refreshRes = await fetch(API.refreshToken, {
        method: 'POST',
        headers: { Authorization: `Bearer ${RTtoken}` },
      });

      if (!refreshRes.ok) {
        // RT hết hạn hoặc không hợp lệ → bắt đăng nhập lại
        tokenStorage.clear();
        window.location.href = '/signin';
        return refreshRes;
      }

      const { newATtoken } = await refreshRes.json();
      tokenStorage.setAT(newATtoken);

      // Gọi lại đúng 1 lần với AT mới
      res = await doFetch(newATtoken);
    }
  }

  return res;
};
