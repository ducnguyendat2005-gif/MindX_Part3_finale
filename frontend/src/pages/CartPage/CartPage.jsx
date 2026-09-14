import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import img from '../../assets/photo-1542744094-3a31f272c490.avif'
import './CartPage.scss';
import { getCoursePricing, normalizeCartItem, TAX_PER_COURSE } from '../../utils/pricing.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import {
  readUserCollection,
  writeUserCollection,
} from '../../utils/userStorage.js';


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

const readCart = () => {
  try {
    return readUserCollection('insideCarts').map(normalizeCartItem);
  } catch {
    return [];
  }
};

const readSavedItems = () => {
  try {
    return readUserCollection('savedForLaterItems').map(normalizeCartItem);
  } catch {
    return [];
  }
};

const getItemId = (item) => String(item?._id || item?.id);

export default function CartPage() {
  const { t } = useLanguage();
  const [cart, setCart] = useState(readCart);
  const [savedItems, setSavedItems] = useState(readSavedItems);

  const cartPricing = cart.map(getCoursePricing);
  const subtotal = cartPricing.reduce((acc, item) => acc + item.originalPrice, 0);
  const discount = cartPricing.reduce((acc, item) => acc + item.discountAmount, 0);
  const tax = cart.length * TAX_PER_COURSE;
  const total = Math.max(subtotal - discount + tax, 0);
  const navigate = useNavigate();

  useEffect(() => {
    const syncCart = () => {
      setCart(readCart());
      setSavedItems(readSavedItems());
    };
    window.addEventListener('cartUpdated', syncCart);
    window.addEventListener('userUpdated', syncCart);
    return () => {
      window.removeEventListener('cartUpdated', syncCart);
      window.removeEventListener('userUpdated', syncCart);
    };
  }, []);
  
  const handleRemove = (id) => {
    const updated = cart.filter(item => String(item._id || item.id) !== String(id));
    setCart(updated);
    writeUserCollection('insideCarts', updated);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleSaveForLater = (item) => {
    const itemId = getItemId(item);
    const updatedCart = cart.filter((cartItem) => getItemId(cartItem) !== itemId);
    const alreadySaved = savedItems.some((savedItem) => getItemId(savedItem) === itemId);
    const updatedSavedItems = alreadySaved
      ? savedItems
      : [...savedItems, normalizeCartItem(item)];

    setCart(updatedCart);
    setSavedItems(updatedSavedItems);
    writeUserCollection('insideCarts', updatedCart);
    writeUserCollection('savedForLaterItems', updatedSavedItems);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleMoveToCart = (item) => {
    const itemId = getItemId(item);
    const alreadyInCart = cart.some((cartItem) => getItemId(cartItem) === itemId);
    const updatedCart = alreadyInCart ? cart : [...cart, normalizeCartItem(item)];
    const updatedSavedItems = savedItems.filter((savedItem) => getItemId(savedItem) !== itemId);

    setCart(updatedCart);
    setSavedItems(updatedSavedItems);
    writeUserCollection('insideCarts', updatedCart);
    writeUserCollection('savedForLaterItems', updatedSavedItems);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleRemoveSavedItem = (id) => {
    const updatedSavedItems = savedItems.filter((item) => getItemId(item) !== String(id));
    setSavedItems(updatedSavedItems);
    writeUserCollection('savedForLaterItems', updatedSavedItems);
  };

  const savedForLaterSection = savedItems.length > 0 && (
    <section className="saved-for-later">
      <div className="saved-for-later__header">
        <h2>{t('cart.savedForLater')}</h2>
        <span>{savedItems.length}</span>
      </div>
      <div className="saved-for-later__list">
        {savedItems.map((item) => {
          const { salePrice, originalPrice } = getCoursePricing(item);
          const itemId = getItemId(item);

          return (
            <div className="saved-for-later__item" key={itemId}>
              <img src={item.thumbnail} alt={item.title} />
              <div className="saved-for-later__info">
                <h3>{item.title}</h3>
                <p>{t('course.by')} {item.instructor || item.instructorId?.name || item.author || '—'}</p>
                <strong>
                  ${salePrice.toFixed(2)}
                  {salePrice < originalPrice && <del>${originalPrice.toFixed(2)}</del>}
                </strong>
              </div>
              <div className="saved-for-later__actions">
                <button type="button" onClick={() => handleMoveToCart(item)}>
                  {t('cart.moveToCart')}
                </button>
                <button type="button" onClick={() => handleRemoveSavedItem(itemId)}>
                  {t('cart.remove')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
  
    return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-breadcrumb">
          <Link to="/categories">{t('header.categories')}</Link>
          <span>›</span>
          <Link to="/details">{t('cart.details')}</Link>
          <span>›</span>
          <span className="cart-breadcrumb__current">{t('cart.shoppingCart')}</span>
        </div>

        <h1 className="cart-title">{t('cart.shoppingCart')}</h1>

        {cart.length === 0 && savedItems.length === 0 ? (
          <div className="cart-empty">
            <p className="cart-empty__text">{t('cart.empty')}</p>
            <button
              className="cart-empty__btn"
              onClick={() => navigate('/course-page')}
            >
              {t('cart.browse')}
            </button>
          </div>
        ) : (
          <>
            {cart.length > 0 && <>
              <p className="cart-subtitle">{cart.length} {cart.length !== 1 ? t('cart.coursesInCart') : t('cart.courseInCart')}</p>

              <div className="cart-layout">
              {/* Items */}
              <div className="cart-items">
                {cart.map((item) => {
                  const { originalPrice, salePrice } = getCoursePricing(item);
                  const itemId = item._id || item.id;

                  return (
                  <div key={itemId} className="cart-item">
                    <div className="cart-item__image">
                      <img src={item.thumbnail} alt={item.title} referrerPolicy="no-referrer" />
                    </div>
                    <div className="cart-item__info">
                      <div className="cart-item__top">
                        <h3 className="cart-item__title">{item.title}</h3>
                        <span className="cart-item__price">
                          {salePrice < originalPrice && (
                            <del style={{ marginRight: '8px', color: '#94a3b8' }}>${originalPrice.toFixed(2)}</del>
                          )}
                          ${salePrice.toFixed(2)}
                        </span>
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
                        <button
                          type="button"
                          onClick={() => handleSaveForLater(item)}
                          className="cart-item__action cart-item__action--save"
                        >
                          {t('cart.save')}
                        </button>
                        <button onClick={() => handleRemove(itemId)} className="cart-item__action cart-item__action--remove">{t('cart.remove')}</button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="cart-summary">
                <div className="cart-summary__box">
                  <h2 className="cart-summary__title">{t('cart.orderDetails')}</h2>
                  <div className="cart-summary__rows">
                    <div className="cart-summary__row">
                      <span>Price</span>
                      <span className="cart-summary__value">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="cart-summary__row">
                      <span>{t('cart.discount')}</span>
                      <span className="cart-summary__value">-${discount.toFixed(2)}</span>
                    </div>
                    <div className="cart-summary__row">
                      <span>{t('cart.tax')}</span>
                      <span className="cart-summary__value">${tax.toFixed(2)}</span>
                    </div>
                    <div className="cart-summary__row cart-summary__row--total">
                      <span>{t('cart.total')}</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={() => navigate('/home/cartpage/checkout')} className="cart-summary__btn">
                    {t('cart.checkout')}
                  </button>
                </div>
              </div>
              </div>
            </>}
            {savedForLaterSection}
          </>
        )}
      </div>
    </div>
  );
}
