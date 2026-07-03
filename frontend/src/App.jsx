import { useState } from "react";

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
import MyCoursesPage from "./pages/MyCoursePage/MycoursePage.jsx";
import AIWidget from './components/AIWidget/AIWidget';
import MyProfilePage from './pages/MyProfilePage/MyProfilePage.jsx'
import AdminPage from './pages/Admin/Admin.jsx'
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { Routes, Route } from "react-router-dom";

function App() {
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
          path='/mycoursespage'
          element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>}
        />
        <Route
          path="/mycoursespage/:id"
          element={<ProtectedRoute><CourseLearning /></ProtectedRoute>}
        />
        <Route
          path='/myprofile'
          element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>}
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
