import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import img from '../../assets/photo-1542744094-3a31f272c490.avif'
import './CartPage.scss';


const MOCK_CART_ITEMS = [
  {
    id: '1',
    title: 'Introduction to User Experience Design',
    instructor: 'John Doe',
    rating: 4.6,
    reviewsCount: 250,
    duration: '22 Total Hours',
    lecturesCount: 155,
    level: 'All levels',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '2',
    title: 'Introduction to User Experience Design',
    instructor: 'John Doe',
    rating: 4.6,
    reviewsCount: 250,
    duration: '22 Total Hours',
    lecturesCount: 155,
    level: 'All levels',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '3',
    title: 'Introduction to User Experience Design',
    instructor: 'John Doe',
    rating: 4.6,
    reviewsCount: 250,
    duration: '22 Total Hours',
    lecturesCount: 155,
    level: 'All levels',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&q=80&w=400',
  }
];

export default function CartPage() {
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem('insideCarts') || '[]')
  );

  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const discount = 10.00;
  const tax = 20.00;
  const total = subtotal - discount + tax;
  const navigate = useNavigate();
  
  const handleRemove = (id) => {
    const updated = cart.filter(item => item.id !== id);
    setCart(updated);
    localStorage.setItem('insideCarts', JSON.stringify(updated));
    window.dispatchEvent(new Event('cartUpdated'));
  };
  
  console.log(cart)
  
  
  

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-breadcrumb">
          <Link to="/categories">Categories</Link>
          <span>›</span>
          <Link to="/details">Details</Link>
          <span>›</span>
          <span className="cart-breadcrumb__current">Shopping Cart</span>
        </div>

        <h1 className="cart-title">Shopping Cart</h1>
        <p className="cart-subtitle">{cart.length} Course{cart.length !== 1 ? 's' : ''} in cart</p>

        <div className="cart-layout">
          {/* Items */}
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item__image">
                  <img src={img} alt={item.title} referrerPolicy="no-referrer" />
                </div>
                <div className="cart-item__info">
                  <div className="cart-item__top">
                    <h3 className="cart-item__title">{item.title}</h3>
                    <span className="cart-item__price">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="cart-item__instructor">By {item.instructor}</p>

                  <div className="cart-item__rating">
                    <span className="cart-item__rating-score">{item.rating}</span>
                    <div className="cart-item__stars">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`star-icon ${i < 4 ? 'star-icon--filled' : 'star-icon--empty'}`} />
                      ))}
                    </div>
                    <span className="cart-item__reviews">
                      ({Array.isArray(item.reviews) ? item.reviews.length : item.reviewsCount} rating)
                    </span>
                  </div>

                  <div className="cart-item__meta">
                    <span>{item.duration}</span>
                    <span>•</span>
                    <span>{item.lecturesCount} Lectures</span>
                    <span>•</span>
                    <span>{item.level}</span>
                  </div>
                  <div className="cart-item__actions">
                    <button className="cart-item__action cart-item__action--save">Save for later</button>
                    <button onClick={() => handleRemove(item.id)} className="cart-item__action cart-item__action--remove">Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="cart-summary">
            <div className="cart-summary__box">
              <h2 className="cart-summary__title">Order Details</h2>
              <div className="cart-summary__rows">
                <div className="cart-summary__row">
                  <span>Price</span>
                  <span className="cart-summary__value">${subtotal.toFixed(2)}</span>
                </div>
                <div className="cart-summary__row">
                  <span>Discount</span>
                  <span className="cart-summary__value">-${discount.toFixed(2)}</span>
                </div>
                <div className="cart-summary__row">
                  <span>Tax</span>
                  <span className="cart-summary__value">${tax.toFixed(2)}</span>
                </div>
                <div className="cart-summary__row cart-summary__row--total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <button onClick={() => navigate('/home/cartpage/checkout')} to="/checkout" className="cart-summary__btn">
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}