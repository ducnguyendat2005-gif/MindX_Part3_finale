import React, { useEffect, useRef, useState } from 'react';
import {
  GripVertical,
  Trash2,
  X,
  Plus,
  UploadCloud,
  Video,
} from 'lucide-react';
import { API, fetchWithAuth } from '../../../config/api.js';
import './CreateCourseTab.scss';

let uid = 0;
const nextId = () => `id-${Date.now()}-${uid++}`;

const makeLesson = (title = '', duration = '') => ({
  id: nextId(),
  title,
  duration,
  videoFile: null,
});

const makeQuestion = () => ({
  id: nextId(),
  _id: null,
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  explanation: '',
});

const makeSection = (title = '') => ({
  id: nextId(),
  title,
  lessons: [makeLesson()],
  hasQuiz: false,          // toggle hiện/ẩn form quiz cho section này
  quizTitle: 'Kiểm tra nhanh',
  passingScore: 70,
  questions: [],
});

export default function CreateCourseTab({ onCancel, onCreated }) {
  const [courseId, setCourseId] = useState(null);
  // ----- Basic information -----
  const [title, setTitle] = useState('');
  const [overview, setOverview] = useState('');
  const [objectives, setObjectives] = useState('');

  // ----- Curriculum -----
  const [sections, setSections] = useState([makeSection('Introduction')]);

  // ----- Media -----
  const thumbInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const lessonInputRef = useRef(null);
  const lessonTargetRef = useRef(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [existingPromoVideo, setExistingPromoVideo] = useState('');

  // ----- Settings -----
  const [category, setCategory] = useState('Design');
  const [level, setLevel] = useState('Beginner');
  const [price, setPrice] = useState('');
  const [promotionalPrice, setPromotionalPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [certification, setCertification] = useState('');
  const [languages, setLanguages] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const loadLatestDraft = async () => {
      try {
        const res = await fetchWithAuth(API.teachingDrafts);
        if (!res.ok) return;
        const body = await res.json();
        const draft = (body.data || [])
          .filter((course) => course.status === 'draft')
          .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))[0];
        if (!draft) return;

        setCourseId(draft._id);
        setTitle(draft.title || '');
        setOverview(draft.overview || draft.shortDescription || draft.courseDescription || '');
        setObjectives((draft.objectives || []).join('\n'));
        setCategory(draft.category || 'Design');
        setLevel(draft.level || 'Beginner');
        setPrice(String(draft.price ?? ''));
        setPromotionalPrice(String(draft.promotionalPrice ?? ''));
        setDiscount(draft.discount || '');
        setCertification(draft.certification || '');
        setLanguages((draft.languages || []).join(', '));
        setThumbPreview(draft.thumbnail || null);
        setExistingPromoVideo(draft.promotionalVideo || '');
        setSections((draft.syllabus || []).map((section) => ({
          id: nextId(),
          _id: section._id || null,   // ← cần để updateCourse tìm existingSection.quiz
          title: section.title || '',
          lessons: (section.lessonDetails?.length
            ? section.lessonDetails
            : (section.items || []).map((lessonTitle) => ({ title: lessonTitle, duration: section.duration })))
            .map((lesson) => ({
              id: nextId(),
              _id: lesson._id || null,
              title: lesson.title || '',
              duration: lesson.duration || '',
              videoFile: null,
              videoUrl: lesson.videoUrl || '',
            })),
          hasQuiz: !!section.quiz,
          quizTitle: section.quiz?.title || 'Kiểm tra nhanh',
          passingScore: section.quiz?.passingScore ?? 70,
          questions: (section.quiz?.questions || []).map((q) => ({
            id: nextId(),
            _id: q._id || null,
            question: q.question || '',
            options: q.options?.length === 4 ? [...q.options] : ['', '', '', ''],
            correctIndex: q.correctIndex ?? 0,
            explanation: q.explanation || '',
          })),
        })));
      } catch {
        // A missing draft should leave the blank create form usable.
      }
    };

    loadLatestDraft();
  }, []);

  // ----- Curriculum handlers -----
  const handleAddSection = () => {
    setSections((prev) => [...prev, makeSection('')]);
  };

  const handleRemoveSection = (sectionId) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const handleSectionTitleChange = (sectionId, value) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title: value } : s))
    );
  };

  const handleAddLesson = (sectionId) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, lessons: [...s.lessons, makeLesson()] } : s
      )
    );
  };

  const handleRemoveLesson = (sectionId, lessonId) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) }
          : s
      )
    );
  };
    // ----- Quiz handlers -----
  const handleToggleQuiz = (sectionId) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              hasQuiz: !s.hasQuiz,
              questions: !s.hasQuiz && !s.questions.length ? [makeQuestion()] : s.questions,
            }
          : s
      )
    );
  };

  const handleQuizFieldChange = (sectionId, field, value) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, [field]: value } : s))
    );
  };

  const handleAddQuestion = (sectionId) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, questions: [...s.questions, makeQuestion()] } : s
      )
    );
  };

  const handleRemoveQuestion = (sectionId, questionId) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
          : s
      )
    );
  };

  const handleQuestionFieldChange = (sectionId, questionId, field, value) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === questionId ? { ...q, [field]: value } : q
              ),
            }
          : s
      )
    );
  };

  const handleOptionChange = (sectionId, questionId, optionIndex, value) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === questionId
                  ? {
                      ...q,
                      options: q.options.map((opt, i) => (i === optionIndex ? value : opt)),
                    }
                  : q
              ),
            }
          : s
      )
    );
  };

  const handleLessonFieldChange = (sectionId, lessonId, field, value) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lessonId ? { ...l, [field]: value } : l
              ),
            }
          : s
      )
    );
  };

  // ----- Media handlers -----
  const onPickThumbnail = () => thumbInputRef.current?.click();
  const onPickVideo = () => videoInputRef.current?.click();

  const onThumbnailSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
      setError('Thumbnail phải là file PNG, JPG hoặc GIF.');
      return;
    }
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const onVideoSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      setError('Lesson video phải là file MP4 hoặc WebM.');
      return;
    }
    setVideoFile(file);
  };

  const onPickLessonVideo = (sectionId, lessonId) => {
    lessonTargetRef.current = { sectionId, lessonId };
    lessonInputRef.current?.click();
  };

  const onLessonVideoSelected = async (e) => {
    const file = e.target.files?.[0];
    const target = lessonTargetRef.current;
    if (!file || !target) return;
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      setError('Lesson video phải là file MP4 hoặc WebM.');
      return;
    }
    handleLessonFieldChange(target.sectionId, target.lessonId, 'videoFile', file);
    e.target.value = '';

    try {
      const seconds = await getVideoDurationSeconds(file);
      const minutes = Math.max(1, Math.round(seconds / 60));
      handleLessonFieldChange(target.sectionId, target.lessonId, 'duration', String(minutes));
    } catch {
      // Không đọc được duration thì để giáo viên tự nhập, không chặn luồng upload.
    }
  };

  const onThumbnailDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
      setError('Thumbnail phải là file PNG, JPG hoặc GIF.');
      return;
    }
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const validate = (status) => {
    if (!title.trim()) return 'Vui lòng nhập tên khóa học.';
    if (Number(price) < 0) return 'Giá khóa học không được âm.';
    if (status === 'published') {
      if (!overview.trim()) return 'Vui lòng nhập phần giới thiệu khóa học.';
      if (!sections.length) return 'Khóa học phải có ít nhất một phần.';
      if (sections.some((section) => !section.title.trim() || !section.lessons.length)) {
        return 'Mỗi phần phải có tên và ít nhất một bài học.';
      }
      if (sections.some((section) => section.lessons.some((lesson) => !lesson.title.trim()))) {
        return 'Vui lòng nhập tên cho tất cả bài học.';
      }
    
      const invalidQuizSection = sections.find((s) => s.hasQuiz && s.questions.some((q) => (
        !q.question.trim() ||
        q.options.some((opt) => !opt.trim()) ||
        q.correctIndex === null || q.correctIndex === undefined
      )));
      if (invalidQuizSection) {
        return `Section "${invalidQuizSection.title || '(chưa đặt tên)'}" có câu hỏi quiz chưa đầy đủ.`;
      }
    }
    return null;
  };

  // ----- Submit -----
  const buildPayload = () => ({
    title,
    overview,
    objectives: objectives
      .split('\n')
      .map((line) => line.replace(/^-+\s*/, '').trim())
      .filter(Boolean),
      curriculum: sections.map((s) => ({
        _id: s._id || undefined,   // ← cần để backend tìm existingSection.quiz
        title: s.title,
        lessons: s.lessons.map((l) => ({
          _id: l._id || undefined,
          title: l.title,
          duration: l.duration,
          videoUrl: l.videoUrl || '',
        })),
        quiz: s.hasQuiz && s.questions.length
          ? {
              title: s.quizTitle,
              passingScore: Number(s.passingScore) || 70,
              questions: s.questions.map((q) => ({
                _id: q._id || undefined,
                question: q.question,
                options: q.options,
                correctIndex: Number(q.correctIndex),
                explanation: q.explanation,
              })),
            }
          : null,
      })),
    category,
    level,
    price: Number(price) || 0,
    promotionalPrice: promotionalPrice ? Number(promotionalPrice) : undefined,
    discount,
    certification,
    languages: languages
      .split(',')
      .map((lang) => lang.trim())
      .filter(Boolean),
    thumbnailUrl: thumbPreview && !thumbPreview.startsWith('blob:') ? thumbPreview : '',
    promotionalVideoUrl: existingPromoVideo,
  });

  const handleSave = async (status) => {
    setError(null);
    setSuccessMessage(null);
    const validationError = validate(status);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!title.trim()) {
      setError('Vui lòng nhập tên khóa học.');
      return;
    }

    try {
      setSaving(true);

      const payload = buildPayload();
      const formData = new FormData();
      formData.append('data', JSON.stringify({ ...payload, status }));
      if (thumbFile) formData.append('thumbnail', thumbFile);
      if (videoFile) formData.append('promoVideo', videoFile);

      const lessonVideoIndexes = [];
      sections.forEach((section, sectionIndex) => {
        section.lessons.forEach((lesson, lessonIndex) => {
          if (lesson.videoFile) {
            formData.append('lessonVideos', lesson.videoFile);
            lessonVideoIndexes.push({ sectionIndex, lessonIndex });
          }
        });
      });
      formData.append('lessonVideoIndexes', JSON.stringify(lessonVideoIndexes));

      const res = await fetchWithAuth(
        courseId ? API.teachingCourseById(courseId) : API.createCourse,
        {
        method: courseId ? 'PUT' : 'POST',
        body: formData,
        }
      );
      const contentType = res.headers.get('content-type') || '';
      const body = contentType.includes('application/json')
        ? await res.json()
        : { message: `Backend không trả về JSON (HTTP ${res.status}). Hãy kiểm tra backend đang chạy ở http://localhost:3001.` };

      if (!res.ok) throw new Error(body.message || 'Tạo khóa học thất bại');

      setCourseId(body.data?._id || courseId);
      if (status === 'draft') {
        setSuccessMessage('Draft đã được lưu. Bạn có thể rời trang và tiếp tục chỉnh sửa sau.');
        return;
      }
      onCreated?.(body.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  const getVideoDurationSeconds = (file) =>
  new Promise((resolve, reject) => {
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.onloadedmetadata = () => {
      URL.revokeObjectURL(videoEl.src);
      resolve(videoEl.duration);
    };
    videoEl.onerror = () => {
      URL.revokeObjectURL(videoEl.src);
      reject(new Error('Không đọc được thời lượng video'));
    };
    videoEl.src = URL.createObjectURL(file);
  });

  return (
    <div className="cc">
      {/* Header */}
      <div className="cc__header">
        <h1 className="cc__heading">Create New Course</h1>
        <div className="cc__header-actions">
          <button
            type="button"
            className="cc-btn cc-btn--outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cc-btn cc-btn--outline"
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            Save Draft
          </button>
          <button
            type="button"
            className="cc-btn cc-btn--primary"
            onClick={() => handleSave('published')}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Publish Course'}
          </button>
        </div>
      </div>

      {error && <p className="cc__error">{error}</p>}
      {successMessage && <p className="cc__success">{successMessage}</p>}

      <div className="cc__grid">
        {/* ---------- Left column ---------- */}
        <div className="cc__main">
          {/* Basic Information */}
          <section className="cc-card">
            <h2 className="cc-card__title">Basic Information</h2>

            <div className="cc-form-group">
              <label className="cc-form-label">Course Title</label>
              <input
                type="text"
                className="cc-form-control"
                placeholder="e.g. Introduction to User Experience Design"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="cc-form-group">
              <label className="cc-form-label">Course Overview</label>
              <textarea
                className="cc-form-control"
                rows={4}
                placeholder="Briefly describe what this course is about..."
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
              />
            </div>

            <div className="cc-form-group">
              <label className="cc-form-label">
                Key Learning Objectives (One per line)
              </label>
              <textarea
                className="cc-form-control"
                rows={4}
                placeholder="What will students learn?"
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
              />
            </div>
          </section>

          {/* Curriculum Builder */}
          <section className="cc-card">
            <h2 className="cc-card__title">Curriculum Builder</h2>

            <div className="cc-curriculum">
              <input
                ref={lessonInputRef}
                type="file"
                accept="video/mp4, video/webm"
                hidden
                onChange={onLessonVideoSelected}
              />
              {sections.map((section) => (
                <div className="cc-section" key={section.id}>
                  <div className="cc-section__header">
                    <GripVertical className="cc-drag-icon" size={20} />
                    <input
                      type="text"
                      className="cc-form-control"
                      style={{ flex: 1 }}
                      placeholder="Section title"
                      value={section.title}
                      onChange={(e) =>
                        handleSectionTitleChange(section.id, e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="cc-remove-btn"
                      onClick={() => handleRemoveSection(section.id)}
                      aria-label="Remove section"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="cc-lesson-list">
                    {section.lessons.map((lesson) => (
                      <div className="cc-lesson-item" key={lesson.id}>
                        <GripVertical className="cc-drag-icon" size={16} />
                        <input
                          type="text"
                          className="cc-form-control"
                          style={{ flex: 2 }}
                          placeholder="Lesson title"
                          value={lesson.title}
                          onChange={(e) =>
                            handleLessonFieldChange(
                              section.id,
                              lesson.id,
                              'title',
                              e.target.value
                            )
                          }
                        />
                        <input
                          type="text"
                          className="cc-form-control"
                          style={{ flex: 1, maxWidth: 80 }}
                          placeholder="0min"
                          value={lesson.duration}
                          onChange={(e) =>
                            handleLessonFieldChange(
                              section.id,
                              lesson.id,
                              'duration',
                              e.target.value
                            )
                          }
                        />
                        <button
                          type="button"
                          className="cc-btn cc-btn--outline cc-btn--icon"
                          onClick={() => onPickLessonVideo(section.id, lesson.id)}
                        >
                          {lesson.videoFile ? lesson.videoFile.name : lesson.videoUrl ? 'Current video saved' : 'Upload Video'}
                        </button>
                        <button
                          type="button"
                          className="cc-remove-btn"
                          onClick={() =>
                            handleRemoveLesson(section.id, lesson.id)
                          }
                          aria-label="Remove lesson"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="cc-btn-add"
                      onClick={() => handleAddLesson(section.id)}
                    >
                      <Plus size={16} />
                      Add Lesson
                    </button>
                  </div>
                  <div className="cc-quiz-block">
                    <label className="cc-quiz-toggle">
                      <input
                        type="checkbox"
                        checked={section.hasQuiz}
                        onChange={() => handleToggleQuiz(section.id)}
                      />
                      Thêm quiz cho phần này
                    </label>

                    {section.hasQuiz && (
                      <div className="cc-quiz-body">
                        <div className="cc-form-group">
                          <label className="cc-form-label">Tên bài kiểm tra</label>
                          <input
                            type="text"
                            className="cc-form-control"
                            value={section.quizTitle}
                            onChange={(e) => handleQuizFieldChange(section.id, 'quizTitle', e.target.value)}
                          />
                        </div>
                        <div className="cc-form-group">
                          <label className="cc-form-label">Điểm đạt (%)</label>
                          <input
                            type="number"
                            className="cc-form-control cc-form-control--sm"
                            min="0"
                            max="100"
                            value={section.passingScore}
                            onChange={(e) => handleQuizFieldChange(section.id, 'passingScore', e.target.value)}
                          />
                        </div>

                        {section.questions.map((q, qIndex) => (
                          <div key={q.id} className="cc-quiz-question">
                            <div className="cc-quiz-question__head">
                              <input
                                type="text"
                                className="cc-form-control"
                                placeholder={`Câu hỏi ${qIndex + 1}`}
                                value={q.question}
                                onChange={(e) => handleQuestionFieldChange(section.id, q.id, 'question', e.target.value)}
                              />
                              <button
                                type="button"
                                className="cc-remove-btn"
                                onClick={() => handleRemoveQuestion(section.id, q.id)}
                                aria-label="Remove question"
                              >
                                <X size={16} />
                              </button>
                            </div>

                            {q.options.map((opt, optIndex) => (
                              <div key={optIndex} className="cc-quiz-option">
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={q.correctIndex === optIndex}
                                  onChange={() => handleQuestionFieldChange(section.id, q.id, 'correctIndex', optIndex)}
                                />
                                <input
                                  type="text"
                                  className="cc-form-control"
                                  placeholder={`Lựa chọn ${optIndex + 1}`}
                                  value={opt}
                                  onChange={(e) => handleOptionChange(section.id, q.id, optIndex, e.target.value)}
                                />
                              </div>
                            ))}

                            <input
                              type="text"
                              className="cc-form-control cc-quiz-question__explanation"
                              placeholder="Giải thích đáp án (hiện sau khi học viên nộp bài)"
                              value={q.explanation}
                              onChange={(e) => handleQuestionFieldChange(section.id, q.id, 'explanation', e.target.value)}
                            />
                          </div>
                        ))}

                        <button
                          type="button"
                          className="cc-btn-add cc-quiz-add-question"
                          onClick={() => handleAddQuestion(section.id)}
                        >
                          <Plus size={16} />
                          Thêm câu hỏi
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="cc-btn-add cc-btn-add--lg"
              onClick={handleAddSection}
            >
              <Plus size={20} />
              Add New Section
            </button>
          </section>
        </div>

        {/* ---------- Right column ---------- */}
        <aside className="cc__aside">
          <section className="cc-card">
            <h2 className="cc-card__title">Course Media</h2>

            <div className="cc-form-group">
              <label className="cc-form-label">Course Thumbnail</label>
              <div
                className="cc-upload-area"
                onClick={onPickThumbnail}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onThumbnailDrop}
              >
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/gif"
                  hidden
                  onChange={onThumbnailSelected}
                />
                {thumbPreview ? (
                  <img
                    src={thumbPreview}
                    alt="Thumbnail preview"
                    className="cc-upload-area__preview"
                  />
                ) : (
                  <>
                    <UploadCloud className="cc-upload-icon" />
                    <p className="cc-upload-text">
                      <span>Click to upload</span> or drag and drop
                    </p>
                    <p className="cc-upload-text cc-upload-text--sm">
                      PNG, JPG or GIF (max. 800x400px)
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="cc-form-group">
              <label className="cc-form-label">Promotional Video</label>
              <div className="cc-upload-area" onClick={onPickVideo}>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4, video/webm"
                  hidden
                  onChange={onVideoSelected}
                />
                <Video className="cc-upload-icon" />
                <p className="cc-upload-text">
                  <span>{videoFile ? videoFile.name : existingPromoVideo ? 'Current video saved' : 'Upload Video'}</span>
                  {!videoFile && !existingPromoVideo && ' (MP4, WebM)'}
                </p>
              </div>
            </div>
          </section>

          <section className="cc-card">
            <h2 className="cc-card__title">Settings</h2>

            <div className="cc-form-group">
              <label className="cc-form-label">Category</label>
              <select
                className="cc-form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>Design</option>
                <option>Development</option>
                <option>Marketing</option>
                <option>Business</option>
              </select>
            </div>

            <div className="cc-form-group">
              <label className="cc-form-label">Level</label>
              <select
                className="cc-form-control"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            <div className="cc-form-group">
              <label className="cc-form-label">Price (USD)</label>
              <input
                type="number"
                className="cc-form-control"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="cc-form-group">
              <label className="cc-form-label">Promotional Price (USD)</label>
              <input
                type="number"
                className="cc-form-control"
                placeholder="Để trống nếu không giảm giá"
                min="0"
                step="0.01"
                value={promotionalPrice}
                onChange={(e) => setPromotionalPrice(e.target.value)}
              />
            </div>

            <div className="cc-form-group">
              <label className="cc-form-label">Discount</label>
              <input
                type="text"
                className="cc-form-control"
                placeholder="e.g. 20%"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            <div className="cc-form-group">
              <label className="cc-form-label">Certification</label>
              <input
                type="text"
                className="cc-form-control"
                placeholder="e.g. Certificate of Completion"
                value={certification}
                onChange={(e) => setCertification(e.target.value)}
              />
            </div>

            <div className="cc-form-group">
              <label className="cc-form-label">Languages (phân cách bởi dấu phẩy)</label>
              <input
                type="text"
                className="cc-form-control"
                placeholder="e.g. English, Vietnamese"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
