
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
import { AuthProvider } from "./context/AuthContext.jsx";
import { Routes, Route } from "react-router-dom";


function App() {
    return (
    <>
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
      </Routes>
      <Footer></Footer>
      <AIWidget /> 
      </AuthProvider>
    </>
  );
}

export default App;