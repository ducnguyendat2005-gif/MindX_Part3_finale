
import "./App.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import HomePage from "./pages/HomePage/HomePage.jsx";
import SignIn from "./pages/Sign-in/SignIn.jsx";
import SignUp from "./pages/Sign-up/SignUp.jsx";
import CoursePage from "./pages/CoursePage/CoursePage.jsx";
import CourseDetail from './pages/CourseDetail/CourseDetail.jsx'
import CourseLearning from './pages/CourseLearning/CourseLearning.jsx'
import CartPage from './pages/CartPage/CartPage.jsx'
import Checkout from './pages/CheckoutPage/Checkout.jsx'
import BuyNPage from './pages/BuyNowPage/BuyNPage.jsx'
import AIWidget from './components/AIWidget/AIWidget';
import Wishlist from './pages/Wishlist/Wishlist.jsx';
import ProfilePage from './pages/Profilepage/Profilepage.jsx';
import AdminPage from './pages/Admin/Admin.jsx'
import PaymentResult from './pages/PaymentResult/PaymentResult.jsx';
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import EventsList from './pages/Events/EventList.jsx';
import EventPlay from './pages/EventPlay/EventPlay.jsx';
import AdminEvents from './pages/Admin/AdminEvent.jsx';
import { AuthProvider } from "./context/AuthContext.jsx";
import { Routes, Route } from "react-router-dom";
import { useIsMobile } from './hooks/use-mobile.jsx';


function App() {
    const isMobile = useIsMobile(768);

    return (
    <div className={`app-shell${isMobile ? ' app-shell--mobile' : ''}`} data-mobile={isMobile}>
    <AuthProvider>
      <Header></Header>
      <Routes>
        <Route path="/" element={<HomePage />} /> 
        <Route path="/home/cartpage" element={<CartPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/course-page" element={<CoursePage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path='/home/course-page/:id' element={<CourseDetail />}/> 
        <Route path="/home/cartpage/checkout" element={<Checkout/>}/>
        <Route path='/home/course-page/:id/buynow' element={<BuyNPage/>}></Route>
        <Route path="/payment-result" element={<PaymentResult />} />

        <Route
          path="/mycoursespage/:id"
          element={<ProtectedRoute><CourseLearning /></ProtectedRoute>}
        />
        <Route
          path='/profile'
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />
        <Route
          path='/wishlist'
          element={<ProtectedRoute><Wishlist /></ProtectedRoute>}
        />
        <Route
          path='/admin'
          element={<ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>}
        />
        <Route
          path='/events'
          element={<ProtectedRoute><EventsList /></ProtectedRoute>}
        />
        <Route
          path='/events/:id'
          element={<ProtectedRoute><EventPlay /></ProtectedRoute>}
        />
        <Route
          path='/admin/events'
          element={<ProtectedRoute requiredRole="admin"><AdminEvents /></ProtectedRoute>}
        />
      </Routes>
      <Footer></Footer>
      <AIWidget /> 
      </AuthProvider>
    </div>
  );
}

export default App;
