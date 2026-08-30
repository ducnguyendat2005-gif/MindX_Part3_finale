import { useEffect, useState } from 'react';
import { API, fetchWithAuth } from '../../config/api.js';
import styles from './AdminEvent.module.scss';

const GAME_TYPE_OPTIONS = [
  { value: 'quiz', label: 'Quiz trắc nghiệm' },
  { value: 'unscramble', label: 'Xáo chữ (Unscramble)' },
  { value: 'matching', label: 'Nối cặp (Matching pairs)' },
];

const emptyQuestion = (gameType) => {
  if (gameType === 'unscramble') {
    return { word: '', hint: '', basePoints: 100, timeLimitSeconds: 30 };
  }
  if (gameType === 'matching') {
    return {
      pairs: [{ left: '', right: '' }, { left: '', right: '' }],
      basePoints: 100,
      timeLimitSeconds: 30,
    };
  }
  return {
    questionText: '',
    options: ['', ''],
    correctIndex: 0,
    basePoints: 100,
    timeLimitSeconds: 30,
  };
};

const emptyForm = () => ({
  title: '',
  description: '',
  coverImage: '',
  startDate: '',
  endDate: '',
  gameType: 'quiz',
  questions: [emptyQuestion('quiz')],
});

function getStatus(ev) {
  const now = new Date();
  const start = new Date(ev.startDate);
  const end = new Date(ev.endDate);
  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'active';
}

function gameTypeLabel(gameType) {
  return GAME_TYPE_OPTIONS.find((g) => g.value === gameType)?.label || 'Quiz trắc nghiệm';
}

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [mode, setMode] = useState('list'); // 'list' | 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(API.adminEvents);
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Không tải được danh sách sự kiện');
      setEvents(body.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const openCreate = () => {
    setForm(emptyForm());
    setEditingId(null);
    setFormError('');
    setMode('create');
  };

  const openEdit = (ev) => {
    const gameType = ev.gameType || 'quiz';
    setForm({
      title: ev.title,
      description: ev.description || '',
      coverImage: ev.coverImage || '',
      startDate: ev.startDate.slice(0, 16),
      endDate: ev.endDate.slice(0, 16),
      gameType,
      questions: ev.questions.length ? ev.questions.map((q) => ({ ...q })) : [emptyQuestion(gameType)],
    });
    setEditingId(ev._id);
    setFormError('');
    setMode('edit');
  };

  const closeForm = () => {
    setMode('list');
    setEditingId(null);
    setFormError('');
  };

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // Đổi gameType (chỉ cho phép khi TẠO MỚI) sẽ reset lại toàn bộ câu hỏi,
  // vì cấu trúc dữ liệu của mỗi loại game khác nhau hoàn toàn.
  const changeGameType = (gameType) => {
    setForm((f) => ({ ...f, gameType, questions: [emptyQuestion(gameType)] }));
  };

  const updateQuestion = (index, patch) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }));
  };

  // ── Quiz: options ──
  const updateOption = (qIndex, optIndex, value) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => {
        if (i !== qIndex) return q;
        const options = [...q.options];
        options[optIndex] = value;
        return { ...q, options };
      }),
    }));
  };

  const addOption = (qIndex) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i === qIndex ? { ...q, options: [...q.options, ''] } : q
      ),
    }));
  };

  const removeOption = (qIndex, optIndex) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => {
        if (i !== qIndex) return q;
        const options = q.options.filter((_, oi) => oi !== optIndex);
        const correctIndex = q.correctIndex >= options.length ? 0 : q.correctIndex;
        return { ...q, options, correctIndex };
      }),
    }));
  };

  // ── Matching: pairs ──
  const updatePair = (qIndex, pairIndex, side, value) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => {
        if (i !== qIndex) return q;
        const pairs = q.pairs.map((p, pi) => (pi === pairIndex ? { ...p, [side]: value } : p));
        return { ...q, pairs };
      }),
    }));
  };

  const addPair = (qIndex) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i === qIndex ? { ...q, pairs: [...q.pairs, { left: '', right: '' }] } : q
      ),
    }));
  };

  const removePair = (qIndex, pairIndex) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i === qIndex ? { ...q, pairs: q.pairs.filter((_, pi) => pi !== pairIndex) } : q
      ),
    }));
  };

  const addQuestion = () => {
    setForm((f) => ({ ...f, questions: [...f.questions, emptyQuestion(f.gameType)] }));
  };

  const removeQuestion = (index) => {
    setForm((f) => ({ ...f, questions: f.questions.filter((_, i) => i !== index) }));
  };

  const validateForm = () => {
    if (!form.title.trim()) return 'Cần nhập tiêu đề sự kiện';
    if (!form.startDate || !form.endDate) return 'Cần chọn thời gian bắt đầu/kết thúc';
    if (new Date(form.startDate) >= new Date(form.endDate)) return 'Thời gian bắt đầu phải trước kết thúc';
    if (form.questions.length === 0) return 'Cần ít nhất 1 câu hỏi';

    if (form.gameType === 'unscramble') {
      for (const [i, q] of form.questions.entries()) {
        if (!q.word.trim()) return `Câu ${i + 1}: thiếu từ khóa (word)`;
        if (q.word.trim().length < 2) return `Câu ${i + 1}: từ khóa cần ít nhất 2 ký tự`;
      }
      return '';
    }

    if (form.gameType === 'matching') {
      for (const [i, q] of form.questions.entries()) {
        if (!q.pairs || q.pairs.length < 2) return `Câu ${i + 1}: cần ít nhất 2 cặp nối`;
        if (q.pairs.some((p) => !p.left.trim() || !p.right.trim())) {
          return `Câu ${i + 1}: có cặp nối bị trống`;
        }
      }
      return '';
    }

    // quiz
    for (const [i, q] of form.questions.entries()) {
      if (!q.questionText.trim()) return `Câu ${i + 1}: thiếu nội dung câu hỏi`;
      if (q.options.some((o) => !o.trim())) return `Câu ${i + 1}: có lựa chọn trống`;
      if (q.options.length < 2) return `Câu ${i + 1}: cần ít nhất 2 lựa chọn`;
    }
    return '';
  };

  const handleSubmit = async () => {
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        coverImage: form.coverImage.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        gameType: form.gameType, // backend chỉ dùng field này khi TẠO MỚI, bỏ qua khi update
        questions: form.questions,
      };

      const url = editingId ? API.adminEventById(editingId) : API.adminEvents;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetchWithAuth(url, { method, body: JSON.stringify(payload) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Không lưu được sự kiện');

      await loadEvents();
      closeForm();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa sự kiện này? Hành động không thể hoàn tác.')) return;
    try {
      const res = await fetchWithAuth(API.adminEventById(id), { method: 'DELETE' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Không xóa được sự kiện');
      await loadEvents();
    } catch (e) {
      alert(e.message);
    }
  };

  if (mode !== 'list') {
    return (
      <div className={styles.wrap}>
        <div className={styles.formHeader}>
          <button className={styles.backBtn} onClick={closeForm}>← Quay lại</button>
          <h2>{editingId ? 'Sửa sự kiện' : 'Tạo sự kiện mới'}</h2>
        </div>

        <div className={styles.formCard}>
          <label className={styles.field}>
            <span>Tiêu đề</span>
            <input value={form.title} onChange={(e) => updateField('title', e.target.value)} />
          </label>

          <label className={styles.field}>
            <span>Mô tả</span>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>Ảnh bìa (URL)</span>
            <input value={form.coverImage} onChange={(e) => updateField('coverImage', e.target.value)} />
          </label>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>Bắt đầu</span>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Kết thúc</span>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
              />
            </label>
          </div>

          <div className={styles.field}>
            <span>Loại trò chơi</span>
            {editingId ? (
              <div className={styles.gameTypeLocked}>
                {gameTypeLabel(form.gameType)}
                <em>Không thể đổi loại game sau khi đã tạo sự kiện</em>
              </div>
            ) : (
              <div className={styles.gameTypeOptions}>
                {GAME_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={styles.gameTypeOption}
                    data-active={form.gameType === opt.value}
                    onClick={() => changeGameType(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.questionsHead}>
            <h3>Câu hỏi ({form.questions.length})</h3>
            <button type="button" className={styles.addBtn} onClick={addQuestion}>+ Thêm câu hỏi</button>
          </div>

          {form.questions.map((q, qi) => (
            <div key={qi} className={styles.questionCard}>
              <div className={styles.questionCardHead}>
                <span>Câu {qi + 1}</span>
                {form.questions.length > 1 && (
                  <button type="button" className={styles.removeBtn} onClick={() => removeQuestion(qi)}>
                    Xóa câu
                  </button>
                )}
              </div>

              {/* ── QUIZ ── */}
              {form.gameType === 'quiz' && (
                <>
                  <input
                    className={styles.questionInput}
                    placeholder="Nội dung câu hỏi"
                    value={q.questionText}
                    onChange={(e) => updateQuestion(qi, { questionText: e.target.value })}
                  />

                  <div className={styles.optionsList}>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className={styles.optionRow}>
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={q.correctIndex === oi}
                          onChange={() => updateQuestion(qi, { correctIndex: oi })}
                          title="Đáp án đúng"
                        />
                        <input
                          value={opt}
                          placeholder={`Lựa chọn ${String.fromCharCode(65 + oi)}`}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                        />
                        {q.options.length > 2 && (
                          <button type="button" className={styles.optRemoveBtn} onClick={() => removeOption(qi, oi)}>
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className={styles.addOptBtn} onClick={() => addOption(qi)}>
                      + Thêm lựa chọn
                    </button>
                  </div>
                </>
              )}

              {/* ── UNSCRAMBLE ── */}
              {form.gameType === 'unscramble' && (
                <>
                  <label className={styles.field}>
                    <span>Từ khóa (đáp án đúng)</span>
                    <input
                      className={styles.questionInput}
                      placeholder="VD: REACT"
                      value={q.word}
                      onChange={(e) => updateQuestion(qi, { word: e.target.value.toUpperCase() })}
                    />
                  </label>
                  <label className={styles.field}>
                    <span>Gợi ý (hiển thị cho người chơi)</span>
                    <input
                      className={styles.questionInput}
                      placeholder="VD: Thư viện UI phổ biến của Facebook"
                      value={q.hint}
                      onChange={(e) => updateQuestion(qi, { hint: e.target.value })}
                    />
                  </label>
                </>
              )}

              {/* ── MATCHING ── */}
              {form.gameType === 'matching' && (
                <div className={styles.optionsList}>
                  {q.pairs.map((p, pi) => (
                    <div key={pi} className={styles.optionRow}>
                      <input
                        placeholder="Vế trái"
                        value={p.left}
                        onChange={(e) => updatePair(qi, pi, 'left', e.target.value)}
                      />
                      <span className={styles.pairLink}>↔</span>
                      <input
                        placeholder="Vế phải"
                        value={p.right}
                        onChange={(e) => updatePair(qi, pi, 'right', e.target.value)}
                      />
                      {q.pairs.length > 2 && (
                        <button type="button" className={styles.optRemoveBtn} onClick={() => removePair(qi, pi)}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className={styles.addOptBtn} onClick={() => addPair(qi)}>
                    + Thêm cặp nối
                  </button>
                </div>
              )}

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Điểm gốc</span>
                  <input
                    type="number"
                    min={0}
                    value={q.basePoints}
                    onChange={(e) => updateQuestion(qi, { basePoints: Number(e.target.value) })}
                  />
                </label>
                <label className={styles.field}>
                  <span>Thời gian (giây)</span>
                  <input
                    type="number"
                    min={5}
                    value={q.timeLimitSeconds}
                    onChange={(e) => updateQuestion(qi, { timeLimitSeconds: Number(e.target.value) })}
                  />
                </label>
              </div>
            </div>
          ))}

          {formError && <div className={styles.formError}>{formError}</div>}

          <button className={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo sự kiện'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.listHeader}>
        <h2>Quản lý sự kiện</h2>
        <button className={styles.addBtn} onClick={openCreate}>+ Tạo sự kiện</button>
      </div>

      {loading && <p className={styles.state}>Đang tải...</p>}
      {error && <p className={`${styles.state} ${styles.stateError}`}>{error}</p>}

      {!loading && !error && (
        events.length === 0 ? (
          <p className={styles.state}>Chưa có sự kiện nào. Tạo sự kiện đầu tiên.</p>
        ) : (
          <div className={styles.table}>
            {events.map((ev) => {
              const status = getStatus(ev);
              return (
                <div key={ev._id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <span className={styles.status} data-status={status}>
                      {status === 'active' ? 'Đang diễn ra' : status === 'upcoming' ? 'Sắp diễn ra' : 'Đã kết thúc'}
                    </span>
                    <div>
                      <p className={styles.rowTitle}>{ev.title}</p>
                      <p className={styles.rowMeta}>
                        <span className={styles.gameTypeTag}>{gameTypeLabel(ev.gameType)}</span>
                        {' · '}
                        {ev.questions.length} câu hỏi ·{' '}
                        {new Date(ev.startDate).toLocaleDateString('vi-VN')} –{' '}
                        {new Date(ev.endDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className={styles.rowActions}>
                    <button onClick={() => openEdit(ev)}>Sửa</button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(ev._id)}>Xóa</button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

export default AdminEvents;