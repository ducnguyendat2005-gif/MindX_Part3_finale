import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API, fetchWithAuth } from '../../config/api.js';
import { readUserCollection, removeUserCollection, writeUserCollection } from '../../utils/userStorage.js';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();

  // VNPay trả về ?status=success|failed|invalid|notfound (do backend tự redirect kèm status)
  // MoMo trả về thẳng query gốc của nó: resultCode, orderId, message... (không đi qua backend redirect)
  // Nên phải hỗ trợ cả 2 kiểu tham số.
  const vnpayStatus = searchParams.get('status');
  const momoResultCode = searchParams.get('resultCode');

  let status = vnpayStatus;
  if (!status && momoResultCode !== null) {
    status = momoResultCode === '0' ? 'success' : 'failed';
  }

  const [refreshed, setRefreshed] = useState(false);

  const removePurchasedCoursesFromWishlist = () => {
    try {
      const pendingCourseIds = JSON.parse(localStorage.getItem('pendingOrderCourseIds') || '[]');
      const cart = readUserCollection('insideCarts');
      const fallbackCourseIds = Array.isArray(cart)
        ? cart.map((course) => course?._id || course?.id).filter(Boolean)
        : [];
      const purchasedIds = (Array.isArray(pendingCourseIds) && pendingCourseIds.length > 0
        ? pendingCourseIds
        : fallbackCourseIds
      ).map(String);

      if (purchasedIds.length === 0) return;

      const wishlist = readUserCollection('wishlistedCourses');

      const updatedWishlist = wishlist.filter(
        (course) => !purchasedIds.includes(String(course?._id || course?.id)),
      );

      if (updatedWishlist.length !== wishlist.length) {
        writeUserCollection('wishlistedCourses', updatedWishlist);
        window.dispatchEvent(new Event('wishlistUpdated'));
      }
    } catch (error) {
      console.error('Could not update wishlist after payment:', error);
    } finally {
      localStorage.removeItem('pendingOrderCourseIds');
    }
  };

  useEffect(() => {
    if (status !== 'success') {
      if (status) {
        localStorage.removeItem('pendingOrderCourseIds');
        localStorage.removeItem('pendingOrderId');
      }
      return;
    }

    const refreshProfile = async () => {
      try {
        const res = await fetchWithAuth(API.myprofile);
        const result = await res.json();
        const mergedUser = {
          ...result.user,
          myCourses: result.courses.map(e => e.courseId),
        };
        localStorage.setItem('loggedInUser', JSON.stringify(mergedUser));
        window.dispatchEvent(new Event('userUpdated'));
      } catch (err) {
        console.error('Refresh profile failed:', err);
      } finally {
        removePurchasedCoursesFromWishlist();
        removeUserCollection('insideCarts');
        localStorage.removeItem('pendingOrderId');
        setRefreshed(true);
      }
    };

    refreshProfile();
  }, [status]);

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: 24 }}>
      {status === 'success' && (
        <>
          <h1 style={{ color: '#16a34a' }}>Payment successful!</h1>
          <p>Course đã được thêm vào tài khoản của bạn.</p>
        </>
      )}
      {status === 'failed' && (
        <>
          <h1 style={{ color: '#dc2626' }}>Payment failed</h1>
          <p>Giao dịch không thành công, vui lòng thử lại.</p>
        </>
      )}
      {(status === 'invalid' || status === 'notfound') && (
        <>
          <h1 style={{ color: '#dc2626' }}>Có lỗi xảy ra</h1>
          <p>Không thể xác thực giao dịch, vui lòng liên hệ hỗ trợ.</p>
        </>
      )}
      {!status && <h1>Đang xử lý...</h1>}

      <div style={{ marginTop: 24 }}>
        <Link to="/profile" state={{ tab: 'courses' }}>Xem khóa học của tôi</Link>
        {' · '}
        <Link to="/">Back to home</Link>
      </div>
    </div>
  );
}
