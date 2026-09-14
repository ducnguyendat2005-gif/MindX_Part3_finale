import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tag } from 'lucide-react';
import { API, fetchWithAuth, tokenStorage } from '../../config/api.js';
import './Checkout.scss';
import { getCoursePricing, normalizeCartItem, TAX_PER_COURSE } from '../../utils/pricing.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [momoRequestType, setMomoRequestType] = useState('payWithATM');
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');

  // ─ Coupon state ─
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponToast, setCouponToast] = useState(null); // { type: 'error' | 'success', message: string }

  const cartPricing = cart.map(getCoursePricing);
  const subtotal = cartPricing.reduce((acc, item) => acc + item.originalPrice, 0);
  const saleDiscount = cartPricing.reduce((acc, item) => acc + item.discountAmount, 0);
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const discount = saleDiscount + couponDiscount;
  const tax = cart.length * TAX_PER_COURSE;
  const total = Math.max(subtotal - discount + tax, 0);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('insideCarts') || '[]');
      const normalized = Array.isArray(stored) ? stored.map(normalizeCartItem) : [];
      setCart(normalized);
      localStorage.setItem('insideCarts', JSON.stringify(normalized));
    } catch {
      setCart([]);
    }
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
        throw new Error(result.message || 'Invalid coupon code');
      }

      setAppliedCoupon({
        code,
        discountAmount: result.data.discountAmount,
        subtotal: result.data.subtotal,
        total: result.data.total,
      });
      setCouponToast({ type: 'success', message: t('checkout.couponApplied', { code }) });
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
    if (!country.trim() || !state.trim()) {
      setCheckoutError({ key: 'checkout.locationRequired' });
      return;
    }

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
        throw new Error(result.message || 'Failed to create payment');
      }

      // Lưu lại giỏ hàng hiện tại để sau khi thanh toán xong (redirect quay về) còn biết mà xóa/refresh
      localStorage.setItem('pendingOrderId', result.data.orderId);
      localStorage.setItem(
        'pendingOrderCourseIds',
        JSON.stringify(cart.map((item) => item._id || item.id).filter(Boolean)),
      );

      // Redirect sang trang thanh toán MoMo/VNPay
      window.location.href = result.data.payUrl;
    } catch (err) {
      setCheckoutError({ message: err.message });
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
          <Link to="/details">{t('cart.details')}</Link>
          <span>›</span>
          <Link to="/cart">{t('cart.shoppingCart')}</Link>
          <span>›</span>
          <span className="checkout-breadcrumb__current">{t('checkout.title')}</span>
        </div>

        <h1 className="checkout-title">{t('checkout.title')}</h1>

        <div className="checkout-layout">
          {/* Left: Form */}
          <div className="checkout-form-section">
            <div className="checkout-card">
              {/* Location */}
              <div className="checkout-location">
                <div className="checkout-form-group">
                  <label htmlFor="checkout-country">{t('checkout.country')}</label>
                  <input
                    id="checkout-country"
                    type="text"
                    value={country}
                    onChange={(event) => {
                      setCountry(event.target.value);
                      setCheckoutError(null);
                    }}
                    placeholder={t('checkout.countryPlaceholder')}
                    required
                  />
                </div>
                <div className="checkout-form-group">
                  <label htmlFor="checkout-state">{t('checkout.state')}</label>
                  <input
                    id="checkout-state"
                    type="text"
                    value={state}
                    onChange={(event) => {
                      setState(event.target.value);
                      setCheckoutError(null);
                    }}
                    placeholder={t('checkout.statePlaceholder')}
                    required
                  />
                </div>
              </div>

              {/* Payment */}
              {/* Payment */}
              <div className="payment-section">
                <h2 className="payment-section__title">{t('checkout.paymentMethod')}</h2>

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
                    <span className="payment-option__label">{t('checkout.momoWallet')}</span>
                  </div>
                </div>

                {paymentMethod === 'momo' && (
                  <div className="card-fields" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                      { value: 'payWithATM', label: t('checkout.domesticAtm') },
                      { value: 'payWithCC', label: t('checkout.internationalCard') },
                      { value: 'captureWallet', label: t('checkout.scanQr') },
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
                      <span className="payment-option__label">{t('checkout.vnpay')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="checkout-summary">
            <div className="checkout-summary__box">
              <h2 className="checkout-summary__title">{t('cart.orderDetails')}</h2>

              {cart.map((data) => {
                const { salePrice } = getCoursePricing(data);
                return (
                <div className="checkout-summary__course" key={data._id || data.id}>
                  <img
                    src={data.thumbnail}
                    alt={t('checkout.courseImageAlt')}
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="checkout-summary__tag">{data.category}</span>
                    <h3>{data.title}</h3>
                    <p>{data.lectures} {t('course.lectures')} . {data.hours} {t('course.totalHours')}</p>
                    <span className="checkout-summary__course-price">$ {salePrice}</span>
                  </div>
                </div>
                );
              })}
              <div className="checkout-summary__coupon">
                <Tag className="coupon-icon" />
                <input
                  type="text"
                  placeholder={t('checkout.applyCoupon')}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={!!appliedCoupon || applyingCoupon}
                />
                {appliedCoupon ? (
                  <button type="button" onClick={handleRemoveCoupon}>
                    {t('checkout.remove')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponCode.trim() || cart.length === 0}
                  >
                    {applyingCoupon ? t('checkout.applying') : t('checkout.apply')}
                  </button>
                )}
              </div>

              <div className="checkout-summary__rows">
                <div className="checkout-summary__row">
                  <span>{t('course.price')}</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="checkout-summary__row">
                  <span>{t('cart.discount')}</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
                <div className="checkout-summary__row">
                  <span>{t('cart.tax')}</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="checkout-summary__row checkout-summary__row--total">
                  <span>{t('cart.total')}</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {checkoutError && (
                <p className="checkout-summary__error">
                  {checkoutError.key ? t(checkoutError.key) : checkoutError.message}
                </p>
              )}

              <button
                onClick={() => handleCheckout()}
                className="checkout-summary__btn"
                disabled={submitting || cart.length === 0}
              >
                {submitting ? t('checkout.processing') : t('checkout.proceed')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
