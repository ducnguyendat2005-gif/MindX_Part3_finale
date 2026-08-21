import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tag } from 'lucide-react';
import { API, fetchWithAuth, tokenStorage } from '../../config/api.js';
import './Checkout.scss';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [momoRequestType, setMomoRequestType] = useState('payWithATM');
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  // ─ Coupon state ─
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponToast, setCouponToast] = useState(null); // { type: 'error' | 'success', message: string }

  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const tax = 20.00;
  const total = subtotal - discount + tax;

  useEffect(() => {
    const stored = localStorage.getItem('insideCarts');
    setCart(stored ? JSON.parse(stored) : []);
  }, []);

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem('loggedInUser');
      setUser(stored ? JSON.parse(stored) : null);
    };

    loadUser();
    window.addEventListener('userUpdated', loadUser);
    return () => window.removeEventListener('userUpdated', loadUser);
  }, []);

  useEffect(() => {
    if (appliedCoupon) {
      setAppliedCoupon(null);
      setCouponToast(null);
    }
  }, [cart.length]);
  
  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;

    const sessionAT = tokenStorage.getAT();
    if (!user || !sessionAT) return navigate('/signin');

    setApplyingCoupon(true);
    setCouponToast(null);

    try {
      const courseIds = cart.map(item => item._id || item.id);

      const res = await fetchWithAuth(API.applyCoupon, {
        method: 'POST',
        body: JSON.stringify({ code, courseIds }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Mã giảm giá không hợp lệ');
      }

      setAppliedCoupon({
        code,
        discountAmount: result.data.discountAmount,
        subtotal: result.data.subtotal,
        total: result.data.total,
      });
      setCouponToast({ type: 'success', message: `Đã áp mã "${code}"` });
    } catch (err) {
      setAppliedCoupon(null);
      setCouponToast({ type: 'error', message: err.message });
    } finally {
      setApplyingCoupon(false);
      setTimeout(() => setCouponToast(null), 3000);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponToast(null);
  };


  const handleCheckout = async () => {
    const sessionAT = tokenStorage.getAT();
    if (!user || !sessionAT) return navigate('/signin');

    setSubmitting(true);
    setCheckoutError(null);

    try {
      const endpoint = paymentMethod === 'momo' ? API.createMomoOrder : API.createVnpayOrder;

      const res = await fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          courseIds: cart.map(item => item._id || item.id),
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          ...(paymentMethod === 'momo' && { requestType: momoRequestType }),
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Tạo giao dịch thất bại');
      }

      // Lưu lại giỏ hàng hiện tại để sau khi thanh toán xong (redirect quay về) còn biết mà xóa/refresh
      localStorage.setItem('pendingOrderId', result.data.orderId);

      // Redirect sang trang thanh toán MoMo/VNPay
      window.location.href = result.data.payUrl;
    } catch (err) {
      setCheckoutError(err.message);
      setSubmitting(false);
    }
  };


  return (
    <>
    {couponToast && (
      <div style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 9999,
        backgroundColor: '#1e293b',
        color: '#fff',
        padding: '14px 20px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="10" fill={couponToast.type === 'success' ? '#16a34a' : '#f59e0b'} />
          {couponToast.type === 'success' ? (
            <path d="M6 10l2.5 2.5L14 7" stroke="#fff" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M10 6v4M10 13h.01" stroke="#fff" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
        <span>{couponToast.message}</span>
      </div>
    )}
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-breadcrumb">
          <Link to="/details">Details</Link>
          <span>›</span>
          <Link to="/cart">Shopping Cart</Link>
          <span>›</span>
          <span className="checkout-breadcrumb__current">Checkout</span>
        </div>

        <h1 className="checkout-title">Checkout Page</h1>

        <div className="checkout-layout">
          {/* Left: Form */}
          <div className="checkout-form-section">
            <div className="checkout-card">
              {/* Location */}
              <div className="checkout-location">
                <div className="checkout-form-group">
                  <label>Country</label>
                  <input type="text" placeholder="Enter Country" />
                </div>
                <div className="checkout-form-group">
                  <label>State/Union Territory</label>
                  <input type="text" placeholder="Enter State" />
                </div>
              </div>

              {/* Payment */}
              {/* Payment */}
              <div className="payment-section">
                <h2 className="payment-section__title">Payment Method</h2>

                {/* MoMo */}
                {/* MoMo */}
              <div
                className={`payment-option ${paymentMethod === 'momo' ? 'payment-option--active' : ''}`}
                onClick={() => setPaymentMethod('momo')}
              >
                <div className="payment-option__header">
                  <div className="payment-option__left">
                    <div className={`radio ${paymentMethod === 'momo' ? 'radio--active' : ''}`}>
                      {paymentMethod === 'momo' && <div className="radio__dot" />}
                    </div>
                    <span className="payment-option__label">Ví MoMo</span>
                  </div>
                </div>

                {paymentMethod === 'momo' && (
                  <div className="card-fields" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                      { value: 'payWithATM', label: 'Thẻ ATM nội địa' },
                      { value: 'payWithCC', label: 'Thẻ quốc tế (Visa/Mastercard)' },
                      { value: 'captureWallet', label: 'Quét QR bằng ví MoMo' },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                          border: momoRequestType === opt.value ? '1.5px solid #a50064' : '1px solid #444',
                        }}
                        onClick={(e) => e.stopPropagation()} // tránh trigger lại onClick của div cha
                      >
                        <input
                          type="radio"
                          name="momoRequestType"
                          checked={momoRequestType === opt.value}
                          onChange={() => setMomoRequestType(opt.value)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>

                {/* VNPay */}
                <div
                  className={`payment-option ${paymentMethod === 'vnpay' ? 'payment-option--active' : ''}`}
                  onClick={() => setPaymentMethod('vnpay')}
                >
                  <div className="payment-option__header">
                    <div className="payment-option__left">
                      <div className={`radio ${paymentMethod === 'vnpay' ? 'radio--active' : ''}`}>
                        {paymentMethod === 'vnpay' && <div className="radio__dot" />}
                      </div>
                      <span className="payment-option__label">VNPay</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="checkout-summary">
            <div className="checkout-summary__box">
              <h2 className="checkout-summary__title">Order Details</h2>

              {cart.map((data) => (
                <div className="checkout-summary__course" key={data._id || data.id}>
                  <img
                    src="https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&q=80&w=400"
                    alt="Course"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="checkout-summary__tag">{data.category}</span>
                    <h3>{data.title}</h3>
                    <p>{data.lectures} Lectures . {data.hours} Total Hours</p>
                    <span className="checkout-summary__course-price">$ {data.price}</span>
                  </div>
                </div>
              ))}
              <div className="checkout-summary__coupon">
                <Tag className="coupon-icon" />
                <input
                  type="text"
                  placeholder="APPLY COUPON CODE"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={!!appliedCoupon || applyingCoupon}
                />
                {appliedCoupon ? (
                  <button type="button" onClick={handleRemoveCoupon}>
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim() || cart.length === 0}
                  >
                    {applyingCoupon ? 'Applying...' : 'Apply'}
                  </button>
                )}
              </div>

              <div className="checkout-summary__rows">
                <div className="checkout-summary__row">
                  <span>Price</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="checkout-summary__row">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
                <div className="checkout-summary__row">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="checkout-summary__row checkout-summary__row--total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {checkoutError && (
                <p style={{ color: 'red', fontSize: '14px' }}>{checkoutError}</p>
              )}

              <button
                onClick={() => handleCheckout()}
                className="checkout-summary__btn"
                disabled={submitting || cart.length === 0}
              >
                {submitting ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
