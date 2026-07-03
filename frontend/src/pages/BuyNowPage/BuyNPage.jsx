import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import './BuyNPage.scss';

export default function CheckoutPage() {
    const [paymentMethod, setPaymentMethod] = useState('card');
    const location = useLocation();
console.log(location.state); // xem có data không
const course = location.state?.course ?? [];
    const subtotal = course.reduce((acc, item) => acc + item.price, 0);
    const discount = 10.00;
    const tax = 20.00;
    const total = subtotal - discount + tax;

  
  return (
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
                <div className="form-group">
                  <label>Country</label>
                  <input type="text" placeholder="Enter Country" />
                </div>
                <div className="form-group">
                  <label>State/Union Territory</label>
                  <input type="text" placeholder="Enter State" />
                </div>
              </div>

              {/* Payment */}
              <div className="payment-section">
                <h2 className="payment-section__title">Payment Method</h2>

                {/* Card */}
                <div
                  className={`payment-option ${paymentMethod === 'card' ? 'payment-option--active' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="payment-option__header">
                    <div className="payment-option__left">
                      <div className={`radio ${paymentMethod === 'card' ? 'radio--active' : ''}`}>
                        {paymentMethod === 'card' && <div className="radio__dot" />}
                      </div>
                      <span className="payment-option__label">Credit/Debit Card</span>
                    </div>
                    <div className="payment-option__logos">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" referrerPolicy="no-referrer" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="Mastercard" referrerPolicy="no-referrer" />
                    </div>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="card-fields">
                      <div className="form-group">
                        <label>Name of Card</label>
                        <input type="text" placeholder="Name of card" />
                      </div>
                      <div className="form-group">
                        <label>Card Number</label>
                        <input type="text" placeholder="Card Number" />
                      </div>
                      <div className="card-fields__row">
                        <div className="form-group">
                          <label>Expiry Date</label>
                          <input type="text" placeholder="MM/YY" />
                        </div>
                        <div className="form-group">
                          <label>CVC/CVV</label>
                          <input type="text" placeholder="CVC" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PayPal */}
                <div
                  className={`payment-option ${paymentMethod === 'paypal' ? 'payment-option--active' : ''}`}
                  onClick={() => setPaymentMethod('paypal')}
                >
                  <div className="payment-option__header">
                    <div className="payment-option__left">
                      <div className={`radio ${paymentMethod === 'paypal' ? 'radio--active' : ''}`}>
                        {paymentMethod === 'paypal' && <div className="radio__dot" />}
                      </div>
                      <span className="payment-option__label">PayPal</span>
                    </div>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png" alt="PayPal" referrerPolicy="no-referrer" />
                  </div>

                  {paymentMethod === 'paypal' && (
                    <div className="paypal-redirect">
                      <p>
                        You are going to be redirected to{' '}
                        <a href="https://www.paypal.com" target="_blank" rel="noopener noreferrer">Paypal</a>{' '}
                        for checkout
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="checkout-summary">
            <div className="checkout-summary__box">
              <h2 className="checkout-summary__title">Order Details</h2>

              {course.map((data)=>(
              <div className="checkout-summary__course">
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
                <input type="text" placeholder="APPLY COUPON CODE" />
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

              <button className="checkout-summary__btn">
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}