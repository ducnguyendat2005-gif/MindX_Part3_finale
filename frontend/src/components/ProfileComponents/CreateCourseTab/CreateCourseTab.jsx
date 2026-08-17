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

const makeSection = (title = '') => ({
  id: nextId(),
  title,
  lessons: [makeLesson()],
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
        setThumbPreview(draft.thumbnail || null);
        setExistingPromoVideo(draft.promotionalVideo || '');
        setSections((draft.syllabus || []).map((section) => ({
          id: nextId(),
          title: section.title || '',
          lessons: (section.lessonDetails?.length
            ? section.lessonDetails
            : (section.items || []).map((lessonTitle) => ({ title: lessonTitle, duration: section.duration })))
            .map((lesson) => ({
              id: nextId(),
              title: lesson.title || '',
              duration: lesson.duration || '',
              videoFile: null,
              videoUrl: lesson.videoUrl || '',
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

  const onLessonVideoSelected = (e) => {
    const file = e.target.files?.[0];
    const target = lessonTargetRef.current;
    if (!file || !target) return;
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      setError('Lesson video phải là file MP4 hoặc WebM.');
      return;
    }
    handleLessonFieldChange(target.sectionId, target.lessonId, 'videoFile', file);
    e.target.value = '';
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
      title: s.title,
      lessons: s.lessons.map((l) => ({
        title: l.title,
        duration: l.duration,
        videoUrl: l.videoUrl || '',
      })),
    })),
    category,
    level,
    price: Number(price) || 0,
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
          </section>
        </aside>
      </div>
    </div>
  );
}
