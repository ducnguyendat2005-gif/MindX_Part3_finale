import { useState, useEffect } from "react";

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
import ProfilePage from './pages/Profilepage/Profilepage.jsx';
import MyProfilePage from './pages/MyProfilePage/MyProfilePage.jsx'
import MyReviewsPage from './pages/Myreviewspage/Myreviewspage.jsx'
import TeachersPage from './pages/Teacherspage/Teacherspage.jsx'
import MessagePage from './pages/Messagepage/Mesagepage.jsx'
import AdminPage from './pages/Admin/Admin.jsx'
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { Routes, Route } from "react-router-dom";
import { API, tokenStorage, fetchWithAuth } from "./config/api.js";

function App() {
  // Verify session 1 lần khi app khởi động (F5, mở lại tab...)
  useEffect(() => {
    const verifySession = async () => {
      const AT = tokenStorage.getAT();
      if (!AT) return; // chưa từng đăng nhập thì thôi, khỏi gọi API

      try {
        const res = await fetchWithAuth(API.myprofile);
        if (!res.ok) {
          tokenStorage.clear();
          window.dispatchEvent(new Event('userUpdated'));
        }
      } catch (err) {
        // lỗi mạng, không chắc token hỏng hay không -> không clear vội
        console.error('Verify session failed:', err);
      }
    };
    verifySession();
  }, []);

  return (
    <>
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

        <Route
          path="/mycoursespage/:id"
          element={<ProtectedRoute><CourseLearning /></ProtectedRoute>}
        />
        <Route
          path='/profile'
          element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}
        />
        <Route
          path='/myprofile'
          element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>}
        />
        <Route
          path='/myreviews'
          element={<ProtectedRoute><MyReviewsPage /></ProtectedRoute>}
        />
        <Route
          path='/teachers'
          element={<ProtectedRoute><TeachersPage /></ProtectedRoute>}
        />
        <Route
          path='/message'
          element={<ProtectedRoute><MessagePage /></ProtectedRoute>}
        />
        <Route
          path='/admin'
          element={<ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>}
        />
      </Routes>
      <Footer></Footer>
      <AIWidget /> 
    </>
  );
}

export default App;