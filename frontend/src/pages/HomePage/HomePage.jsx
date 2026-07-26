import React from 'react'
import styles from './HomePage.module.scss'
import { API } from '../../config/api.js'
import Header from '../../components/Header/Header.jsx'
import Footer from '../../components/Footer/Footer.jsx'
import frame1 from '../../assets/Frame 427318990 (1).png'
import frame2 from '../../assets/Frame 427318991 (1).png'
import frame3 from '../../assets/Group (1).png'
import { useState, useEffect, useRef } from "react";

import {
  Code2,
  Server,
  Layers,
  Palette,
  Container,
  Cloud,
  BarChart3,
  BookOpen, // icon fallback mặc định
} from 'lucide-react'

import bgFrontend from '../../assets/frontend.jpg'
import bgBackend from '../../assets/backend.webp'
import bgFullstack from '../../assets/fullstack.jpg'
import bgUiux from '../../assets/UXUI.jpg'
import bgDevops from '../../assets/devops.jpg'
import bgCloud from '../../assets/cloudcom.jpg'
import bgDataScience from '../../assets/datasci.jpg'

import CourseCard from '../../components/CourseCard/CourseCard.jsx'
import star from '../../assets/icon-1star.png'
import CommentIcon from '../../assets/Ellipse 61.png'
import quoteImg from '../../assets/Vector.png'
import bkImg1 from '../../assets/image.png'
import bkImg2 from '../../assets/image (1).png'
import defaultAvatar from '../../assets/Screenshot 2026-03-30 212131.png'

const CircularProgress = ({ value = 80, label = "Completion rate of our courses", size = 180, color = "#4A90E2" }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const animRef = useRef(null);
 
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeWidth = size * 0.075;
  const r = size / 2 - strokeWidth;
  const cx = size / 2;
  const cy = size / 2;
 
  const trackPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
 
  const filledDeg = (animatedValue / 100) * 180;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const tipAngleDeg = 180 - filledDeg;
  const tipX = cx + r * Math.cos(toRad(tipAngleDeg));
  const tipY = cy - r * Math.sin(toRad(tipAngleDeg));
  const largeArc = filledDeg > 180 ? 1 : 0;
  const fillPath = filledDeg > 0
    ? `M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${tipX} ${tipY}`
    : "";
 
  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    let start = null;
    const duration = 1200;
    const to = clampedValue;
 
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(to * eased);
      if (progress < 1) animRef.current = requestAnimationFrame(step);
    };
 
    setAnimatedValue(0);
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [clampedValue]);
 
  return (
    <div className={styles.cardCircularProgress}>
      <div
        className={styles.svgWrapperCircularProgress}
        style={{ width: size, height: size / 2 + strokeWidth }}
      >
        <svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0 }}>
          {/* Track */}
          <path
            d={trackPath}
            fill="none"
            stroke="#E8EEF7"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Fill */}
          {fillPath && (
            <path
              d={fillPath}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}
          {/* Dot at tip */}
          {filledDeg > 1 && (
            <circle cx={tipX} cy={tipY} r={strokeWidth * 0.4} fill={color} />
          )}
          {/* Center dot */}
          <circle cx={cx} cy={cy} r={strokeWidth * 0.25} fill={color} />
        </svg>
      </div>
 
      <div className={styles.valueTextCircularProgress}>{animatedValue.toFixed(1)}%</div>
      <div className={styles.labelCircularProgress}>{label}</div>
    </div>
  );
};

const TopInstructor = ({ name, title, rating, totalStudents, thumbnail }) => {
  return (
    <div className={styles.TopInsCard}>
      <img src={thumbnail || defaultAvatar} alt="instructor" />
      <p>{name}</p>
      <p>{title}</p>
      <div className={styles.sepLineIns} />
      <div className={styles.strNNum}>
        <img src={star} alt="star" />
        <p>{rating}</p>
      </div>
      <p>{totalStudents} students</p>
    </div>
  )
}

const TopCourses = (data) =>{
  let x = data.sort((a,b) => b.rating - a.rating)
  return x.slice(0,4)
}
const TopCat = (data) => {
  const categoryMap = {};
  data.forEach(course => {
    if (!categoryMap[course.category]) {
      categoryMap[course.category] = 0;
    }
    const reviewCount = course.reviewCount ?? course.reviews?.length ?? 0;
    categoryMap[course.category] += reviewCount;
  });

  return Object.entries(categoryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([category, totalReviews]) => ({ category, totalReviews }));
};

const categoryIconMap = {
  'frontend development': Code2,
  'backend development': Server,
  'full-stack development': Layers,
  'ui/ux design': Palette,
  devops: Container,
  'cloud computing': Cloud,
  'data science': BarChart3,
}

const getCategoryIcon = (category) => {
  const key = category?.toLowerCase().trim()
  return categoryIconMap[key] || BookOpen
}


const categoryBgMap = {
  'frontend development': bgFrontend,
  'backend development': bgBackend,
  'full-stack development': bgFullstack,
  'ui/ux design': bgUiux,
  devops: bgDevops,
  'cloud computing': bgCloud,
  'data science': bgDataScience,
}

const getCategoryBg = (category) => {
  const key = category?.toLowerCase().trim()
  return categoryBgMap[key] || null
}


const HomePage = () => {

const [products, setProducts] = useState([]);
const [Mainreviews, setReviews] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [instructors, setInstructors] = useState([]);
const [topCourses, setTopCourses] = useState([]);

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, reviewsRes, teachersRes, topCoursesRes] = await Promise.all([
        fetch(API.courses),
        fetch(API.mainComment),
        fetch(API.topTeacher),
        fetch(API.topCourses),
      ]);

      if (!coursesRes.ok) throw new Error(`Lỗi courses: ${coursesRes.status}`);
      if (!reviewsRes.ok) throw new Error(`Lỗi reviews: ${reviewsRes.status}`);
      if (!teachersRes.ok) throw new Error(`Lỗi teachers: ${teachersRes.status}`);
      if (!topCoursesRes.ok) throw new Error(`Lỗi top courses: ${topCoursesRes.status}`);

      const [courses, reviewsData, teachersData, topCoursesData] = await Promise.all([
        coursesRes.json(),
        reviewsRes.json(),
        teachersRes.json(),
        topCoursesRes.json(),
      ]);

      setProducts(courses.data);
      setReviews(reviewsData.data);
      setInstructors(teachersData.data);
      setTopCourses(topCoursesData.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Lỗi: {error}</p>;
  
  
  return (
    
    <>
    {/* <Header></Header> */}
    <section className={styles.mainPage}>
      <div className={styles.homePageBanner}>
        <div className={styles.leftInfo}>
          <p>Unlock Your Potential with Byway</p>
          <p>
            Welcome to Byway, where learning knows no bounds. We believe that
            education is the key to personal and professional growth, and we're
            here to guide you on your journey to success. Whether you're a
            student, professional, or lifelong learner, our cutting-edge
            Learning Management System is designed to elevate your learning
            experience.
          </p>
          <button>Start your instructor journey</button>
        </div>
        <div className={styles.decoRight}>
          <img src={frame1} alt="deco1" />
          <img src={frame2} alt="deco2" />
          <img src={frame3} alt="deco3" />
          <CircularProgress></CircularProgress>
        </div>
      </div>
 
      <div className={styles.massCounter}>
        <div className={styles.insideText}>
          <div className={styles.first}>
            <p>250+</p>
            <p>Courses by our best mentors</p>
          </div>
          <span className={styles.sepLine1} />
          <div className={styles.second}>
            <p>1000+</p>
            <p>Courses by our best mentors</p>
          </div>
          <span className={styles.sepLine2} />
          <div className={styles.third}>
            <p>15+</p>
            <p>Courses by our best mentors</p>
          </div>
          <span className={styles.sepLine3} />
          <div className={styles.fourth}>
            <p>2400+</p>
            <p>Courses by our best mentors</p>
          </div>
        </div>
      </div>
 
      <div className={styles.topField}>
      <div className={styles.topCat}>
        <p>Top Catergories</p>
        <div className={styles.cardCover}>
          {TopCat(products).map((cat) => {
            const Icon = getCategoryIcon(cat.category)
            const bgImage = getCategoryBg(cat.category) // 👈 thiếu dòng này
            return (
              <div
                className={styles.ast}
                key={cat.category}
                style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}
              >
                <div className={styles.imgBino}>
                  <Icon size={28} color="#4A90E2" />
                </div>
                <p style={{ color: 'white', fontWeight:"700" }}>{cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}</p>
                <p style={{ color: 'white', fontWeight:"300" }}>{cat.totalReviews} Courses</p>
              </div>
          )
        })}
      </div>
</div>
 
        <div className={styles.topCour}>
          <p>Top Courses</p>
          <div className={styles.topCourCard}>
            {topCourses.map((course) => (
              <CourseCard
                key={course.id ?? course._id}
                id={course.id ?? course._id}
                title={course.title}
                instructor={course.instructorId?.name}
                rating={course.rating}
                ratingCount={course.reviews?.length ?? 0}
                duration={`${course.hours} Total Hours. ${course.lectures} Lectures. ${course.level}`}
                category={course.category}
                promotionalPrice={course.promotionalPrice}
                originalPrice={course.price}
              />
            ))}
          </div>
        </div>
 
        <div className={styles.topIns}>
          <p>Top #5 Instructor</p>
          <div className={styles.topInsCardParent}>
            {instructors.map((t) => (
              <TopInstructor
                key={t._id}
                name={t.name}
                role={t.title}
                rating={t.rating}
                totalStudents={t.totalStudents}
                title={t.title}
                thumbnail={t.thumbnail ?? defaultAvatar}
              />
            ))}
          </div>
          {/* {name,role,rating,students} */}
        </div>
      </div>
 
      <div className={styles.cusRev}>
        <p>What customer say about us</p>
        <div className={styles.lowerRev}>
          {Mainreviews.map((data) => 
            <div className={styles.cusBox}>
              <img src={quoteImg} alt="quote icon" />
              <p>
                {data.content}
              </p>
              <div className={styles.iconDiv}>
                <img src={CommentIcon} alt="reviewer avatar" />
                <p>{data.name}</p>
                <p>{data.role}</p>
              </div>
            </div>
            )}
        </div>
      </div>
 
      <div className={styles.cntPage}>
        <div className={styles.ci}>
          <img src={bkImg1} alt="become instructor" />
          <div className={styles.ciDes}>
            <p>Become an Instructor</p>
            <p>
              Instructors from around the world teach millions of students on
              Byway. We provide the tools and skills to teach what you love.
            </p>
            <button>Start Your Instructor Journey</button>
          </div>
        </div>
        <div className={styles.cc}>
          <div className={styles.ccDes}>
            <p>Transform your life through education</p>
            <p>
              Learners around the world are launching new careers, advancing in
              their fields, and enriching their lives.
            </p>
            <button>Checkout Courses</button>
          </div>
          <img src={bkImg2} alt="checkout courses" />
        </div>
      </div>
    </section>
    
    </>
  );
}

export default HomePage

