import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./CoursePage.module.scss";
import CourseCard from "../../components/CourseCard/CourseCard.jsx";
import { API } from '../../config/api.js'
import star from '../../assets/icon-1star.png'
import defaultAvatar from '../../assets/Screenshot 2026-03-30 212131.png'
import { useLanguage } from '../../context/LanguageContext.jsx';

const TopCourses = (data) =>{
  let x = [...data].sort((a,b) => b.rating - a.rating)
  return x.slice(0,4)
}
const TopInstructor = ({name,role,rating,students,thumbnail}) => {
  const { t } = useLanguage();
  return(
      <div className={styles.TopInsCard}>
        <img src={thumbnail} alt="instructor" />
        <p>{name}</p>
        <p>{role}</p>
        <div className={styles.sepLineIns} />
        <div className={styles.strNNum}>
          <img src={star} alt="star" />
          <p>{rating}</p>
        </div>
        <p>{students} {t('admin.studentsLabel')}</p>
      </div>
    
  )
}
const ITEMS_PER_PAGE = 9;

const CHAPTER_RANGES = {
  "1-10": [1, 10],
  "10-15": [10, 15],
  "15-20": [15, 20],
  "20-25": [20, 25],
};

const PRICE_RANGES = {
  "0-50": [0, 50],
  "50-150": [50, 150],
  "150-300": [150, 300],
};

function StarRating({ rating }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? styles.stars : styles.starEmpty}>
          ★
        </span>
      ))}
    </span>
  );
}

function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={styles.filterSection}>
      <div
        className={`${styles.filterHeader} ${!open ? styles.collapsed : ""}`}
        onClick={() => setOpen(!open)}
      >
        <h3>{title}</h3>
        <span className={styles.arrow}>▼</span>
      </div>
      <div className={`${styles.filterContent} ${!open ? styles.hidden : ""}`}>
        {children}
      </div>
    </div>
  );
}

function FilterOption({ id, label, checked, onChange }) {
  return (
    <div className={styles.filterOption}>
      <input type="checkbox" id={id} checked={checked} onChange={onChange} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

function PageBtn({ label, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${styles.pageBtn} ${active ? styles.active : ""}`}
    >
      {label}
    </button>
  );
}

function InstructorCard({ instructor }) {
  return (
    <div className={styles.insCard}>
      <div
        className={styles.insAvatar}
        style={{ background: "linear-gradient(135deg,#667eea,#764ba2)" }}
      />
      <p className={styles.insName}>{instructor.name}</p>
      <p className={styles.insRole}>{instructor.role}</p>
      <div className={styles.insSepLine} />
      <div className={styles.insRating}>
        <span style={{ color: "#f4c150" }}>★</span>
        <p>{instructor.rating}</p>
      </div>
      <p className={styles.insStudents}>
        {instructor.students.toLocaleString()} students
      </p>
    </div>
  );
}

export default function CoursesPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const [coursesData, setCoursesData] = useState([]);
  const [topInstructors, setTopInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [ratings, setRatings] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [prices, setPrices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Gọi song song 2 API: danh sách khóa học + top giảng viên
        const [coursesRes, teacherRes] = await Promise.all([
          fetch(API.courses),
          fetch(API.topTeacher),
        ]);

        if (!coursesRes.ok) throw new Error(`Lỗi tải khóa học: ${coursesRes.status}`);
        if (!teacherRes.ok) throw new Error(`Lỗi tải giảng viên: ${teacherRes.status}`);

        const coursesJson = await coursesRes.json();
        const teacherJson = await teacherRes.json();

        // Tùy backend trả { data: [...] } hay trả thẳng mảng, xử lý cả 2 trường hợp
        const nextCourses = coursesJson.data ?? coursesJson;
        const nextInstructors = teacherJson.data ?? teacherJson;
        setCoursesData(Array.isArray(nextCourses) ? nextCourses : []);
        setTopInstructors(Array.isArray(nextInstructors) ? nextInstructors : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  const categoryList = useMemo(
    () => [...new Set(coursesData.map((c) => c.category).filter(Boolean))],
    [coursesData]
  );

  useEffect(() => {
    if (!categoryFromUrl || !categoryList.length) return;

    const selectedCategory = categoryList.find(
      (category) =>
        category?.trim().toLowerCase() === categoryFromUrl.trim().toLowerCase()
    );

    setCategories(selectedCategory ? [selectedCategory] : []);
    setCurrentPage(1);
  }, [categoryFromUrl, categoryList]);

  const toggleItem = (list, setList, value) => {
    setList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    let result = [...coursesData];

    if (ratings.length)
      result = result.filter((c) =>
        ratings.map(Number).includes(Math.round(c.rating))
      );

    // Backend không có field "chapters" riêng, dùng "lectures" thay thế
    if (chapters.length)
      result = result.filter((c) =>
        c.lectures != null
          ? chapters.some(
              (r) =>
                c.lectures >= CHAPTER_RANGES[r][0] &&
                c.lectures <= CHAPTER_RANGES[r][1]
            )
          : true
      );

    if (prices.length)
      result = result.filter((c) =>
        prices.some(
          (r) =>
            c.price >= PRICE_RANGES[r][0] && c.price <= PRICE_RANGES[r][1]
        )
      );

    if (categories.length)
      result = result.filter((c) => categories.includes(c.category));

    if (sortBy === "rating") result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "price-low") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-high") result.sort((a, b) => b.price - a.price);
    else if (sortBy === "newest")
      // id giờ là ObjectId (hex string), không dùng Number() được nữa
      // nên sort theo createdAt do MongoDB tự sinh
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return result;
  }, [coursesData, ratings, chapters, prices, categories, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );


  if (loading) return <p>{t('home.loading')}</p>;
  if (error) return <p>Lỗi: {error}</p>;

  return (
    <section className={styles.mainPage}>
      <div className={styles.container}>
        <h1>{categories.length === 1 ? `${categories[0]} ${t('course.courses')}` : t('course.courses')}</h1>
        <p className={styles.subtitle}>{t('course.courses')}</p>

        <div className={styles.controls}>
          <button
            className={styles.filterBtn}
            type="button"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((visible) => !visible)}
          >
            <span>☰</span>
            <span>{t('course.filter')}</span>
          </button>
          <div className={styles.sortControl}>
            <label>{t('course.sortBy')}</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="relevance">{t('course.relevance')}</option>
              <option value="rating">{t('course.highestRated')}</option>
              <option value="price-low">{t('course.priceLow')}</option>
              <option value="price-high">{t('course.priceHigh')}</option>
              <option value="newest">{t('course.newest')}</option>
            </select>
          </div>
        </div>

        <div className={styles.mainContent}>
          <aside className={`${styles.sidebar} ${!showFilters ? styles.sidebarHidden : ""}`}>
            <FilterSection title={t('course.rating')}>
              {[5, 4, 3, 2, 1].map((r) => (
                <FilterOption
                  key={r}
                  id={`rating-${r}`}
                  checked={ratings.includes(String(r))}
                  onChange={() => toggleItem(ratings, setRatings, String(r))}
                  label={<StarRating rating={r} />}
                />
              ))}
            </FilterSection>

            <FilterSection title={t('course.chapters')}>
              {Object.keys(CHAPTER_RANGES).map((range) => (
                <FilterOption
                  key={range}
                  id={`ch-${range}`}
                  checked={chapters.includes(range)}
                  onChange={() => toggleItem(chapters, setChapters, range)}
                  label={range}
                />
              ))}
            </FilterSection>

            <FilterSection title={t('course.price')}>
              {[
                { value: "0-50", label: t('course.under50') },
                { value: "50-150", label: "$50 – $150" },
                { value: "150-300", label: "$150 – $300" },
              ].map((p) => (
                <FilterOption
                  key={p.value}
                  id={`price-${p.value}`}
                  checked={prices.includes(p.value)}
                  onChange={() => toggleItem(prices, setPrices, p.value)}
                  label={p.label}
                />
              ))}
            </FilterSection>

            <FilterSection title={t('course.category')}>
              {categoryList.map((cat) => (
                <FilterOption
                  key={cat}
                  id={`cat-${cat}`}
                  checked={categories.includes(cat)}
                  onChange={() => toggleItem(categories, setCategories, cat)}
                  label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                />
              ))}
            </FilterSection>
          </aside>

          {/* Courses Grid — dùng CourseCard gốc */}
          <div className={styles.coursesGrid}>
            {paginated.length === 0 ? (
              <div className={styles.emptyState}>
                {t('course.noMatch')}
              </div>
            ) : (
              <div className={styles.grid}>
                {paginated.map((course) => (
                  <CourseCard
                    key={course.id ?? course._id}
                    id={course.id ?? course._id}
                    title={course.title}
                    instructor={course.instructorId?.name}
                    rating={course.rating}
                    ratingCount={course.reviews?.length ?? 0}
                    duration={`${course.hours} ${t('course.totalHours')}. ${course.lectures} ${t('course.lectures')}. ${course.level}`}
                    category={course.category}
                    promotionalPrice={course.promotionalPrice}
                    originalPrice={course.price}
                  thumbnail={course.thumbnail}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <PageBtn
                  label="←"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                />
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pg) => (
                    <PageBtn
                      key={pg}
                      label={pg}
                      active={pg === currentPage}
                      onClick={() => setCurrentPage(pg)}
                    />
                  )
                )}
                <PageBtn
                  label="→"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Top Instructors ── */}
      <div className={styles.topIns}>
          <p>{t('course.topInstructor')}</p>
          <div className={styles.topInsCardParent}>
            {topInstructors.map((t) => (
              <TopInstructor
                key={t._id}
                name={t.name}
                role={t.title}
                rating={t.rating}
                students={t.totalStudents}
                title={t.title}
                thumbnail={t.thumbnail ?? defaultAvatar}
              />
            ))}
          </div>
      </div>

      {/* ── Top Courses — dùng CourseCard gốc ── */}
      <div className={styles.topCour}>
        <p>{t('home.topCourses')}</p>
        <div className={styles.topCourList}>
          {TopCourses(coursesData).map((course) => (
              <CourseCard
                key={course.id ?? course._id}
                id={course.id ?? course._id}
                title={course.title}
                instructor={course.instructorId?.name}
                rating={course.rating}
                ratingCount={course.reviews?.length ?? 0}
                duration={`${course.hours} ${t('course.totalHours')}. ${course.lectures} ${t('course.lectures')}. ${course.level}`}
                category={course.category}
                promotionalPrice={course.promotionalPrice}
                originalPrice={course.price}
              thumbnail={course.thumbnail}
              />
            ))}
        </div>
      </div>
    </section>
  );
}
