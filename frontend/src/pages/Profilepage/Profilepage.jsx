import React, { useState, useEffect } from 'react';
import { API, fetchWithAuth, tokenStorage } from '../../config/api.js';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/ProfileComponents/Sidebar/Sidebar.jsx';
import ProfileInfoTab from '../../components/ProfileComponents/ProfileInfoTab/ProfileInfoTab.jsx';
import EditProfileTab from '../../components/ProfileComponents/EditProfileTab/EditProfileTab.jsx';
import MyCoursesTab from '../../components/ProfileComponents/MyCoursesTab/MyCoursesTab.jsx';
import TeachersTab from '../../components/ProfileComponents/TeacherTab/TeacherTab.jsx';
import TeacherEditTab from '../../components/ProfileComponents/TeacherEditTab/TeacherEditTab.jsx';
import TeacherInfoTab from '../../components/ProfileComponents/TeacherInfoTab/TeacherInfoTab.jsx';
import MessageTab from '../../components/ProfileComponents/MessageTab/MessageTab.jsx';
import MyReviewsTab from '../../components/ProfileComponents/MyReviewTab/MyReviewTab.jsx';
import './ProfilePage.scss';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [instructorInfo, setInstructorInfo] = useState(null); 
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    description: '',
    learningGoal: '',
    level: '',
    interests: [],
    imageUrl: '',
  });
  const [preview, setPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null); // file thật, gửi lên khi Save changes
  // ── Teacher edit ──
  const [instructorForm, setInstructorForm] = useState({
    title: '',
    bio: '',
    yearsOfExperience: '',
  });
  const [existingPortfolio, setExistingPortfolio] = useState([]);
  const [savingInstructor, setSavingInstructor] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Đổi mật khẩu ──
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('loggedInUser');
    const at = tokenStorage.getAT();
    if (!stored || !at) { navigate('/signin'); return; }

    const loadProfile = async () => {
      try {
        const profileRes = await fetchWithAuth(API.myprofile);
        if (!profileRes.ok) throw new Error('Không lấy được thông tin tài khoản');
        const profileResult = await profileRes.json();
        const merged = {
          ...profileResult.user,
          myCourses: (profileResult.courses || []).map(e => e.courseId),
        };
        setUser(merged);
        // Role được lấy từ API đã xác thực, không dựa vào localStorage để phân quyền UI.
        setActiveTab((currentTab) => {
          if (merged.role === 'teacher') {
            return ['profile', 'edit'].includes(currentTab) ? 'teacherInfo' : currentTab;
          }
          return ['teacherInfo', 'teacherEdit'].includes(currentTab) ? 'profile' : currentTab;
        });
        if (merged.role === 'teacher') {
          const teacherRes = await fetchWithAuth(API.myTeacherProfile);
          if (teacherRes.ok) {
            const teacherResult = await teacherRes.json();
            const instructor = teacherResult.instructor;
            if (instructor) {
              setInstructorInfo(instructor); // lưu full object cho tab view
              setInstructorForm({
                title: instructor.title ?? '',
                bio: instructor.bio ?? '',
                yearsOfExperience: instructor.yearsOfExperience ?? '',
              });
              setExistingPortfolio(instructor.portfolioUrl ?? []);
            }
          }
        }
        localStorage.setItem('loggedInUser', JSON.stringify(merged));

        setForm({
          firstName: merged.Fname ?? '',
          lastName: merged.Lname ?? '',
          description: merged.description ?? '',
          learningGoal: merged.learningGoal ?? '',
          level: merged.level ?? '',
          interests: merged.interests ?? [],
          imageUrl: merged.avatar ?? '',
        });
        if (merged.avatar) setPreview(merged.avatar);

        const coursesRes = await fetchWithAuth(API.mycourses);
        if (coursesRes.ok) {
          const coursesResult = await coursesRes.json();
          setMyCourses(coursesResult.data || []);
        }
      } catch (err) {
        const localUser = JSON.parse(stored);
        setUser(localUser);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // Nhận File thật từ input type="file" trong EditProfileTab
  const handleAvatarFileChange = (file) => {
    setAvatarFile(file);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetchWithAuth(API.updateAccount, {
        method: 'PUT',
        body: JSON.stringify({
          Fname: form.firstName,
          Lname: form.lastName,
          description: form.description,
          learningGoal: form.learningGoal,
          level: form.level,
          interests: form.interests,
          avatar: form.imageUrl,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Cập nhật thông tin thất bại');
      }
      const result = await res.json();
      setUser(result.data);
      localStorage.setItem('loggedInUser', JSON.stringify(result.data));
      setForm((prev) => ({
        ...prev,
        firstName: result.data.Fname ?? '',
        lastName: result.data.Lname ?? '',
        description: result.data.description ?? '',
        learningGoal: result.data.learningGoal ?? '',
        level: result.data.level ?? '',
        interests: result.data.interests ?? [],
        imageUrl: result.data.avatar ?? '',
      }));
      setPreview(result.data.avatar ?? null);
      setActiveTab('profile');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  const handleInstructorChange = (field) => (e) =>
  setInstructorForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSaveInstructor = async () => {
    setSavingInstructor(true);
    try {
      const res = await fetchWithAuth(API.updateInstructor, {
        method: 'PUT',
        body: JSON.stringify(instructorForm),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Cập nhật thông tin giảng viên thất bại');
      }
      const result = await res.json();
      setInstructorInfo(result.data); // đồng bộ lại tab view
      setInstructorForm({
        title: result.data.title ?? '',
        bio: result.data.bio ?? '',
        yearsOfExperience: result.data.yearsOfExperience ?? '',
      });
      setActiveTab('teacherInfo');
    } catch (err) {
      console.error(err);
      // TODO: hiện toast/error UI nếu bạn có sẵn component thông báo
    } finally {
      setSavingInstructor(false);
    }
  };

  const handlePasswordChange = (field) => (e) => {
    setPasswordError('');
    setPasswordForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSavePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Vui lòng nhập đầy đủ các trường.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSavingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      const res = await fetchWithAuth(API.changePassword, {
        method: 'PUT',
        body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || 'Đổi mật khẩu thất bại');
      }
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess(body.message || 'Đổi mật khẩu thành công!'); // 👈 set success
      setTimeout(() => setPasswordSuccess(''), 3000); // tự ẩn sau 3s
    } catch (err) {
      setPasswordError(err.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return <p className="profile-page__loading">Đang tải...</p>;

  const isTeacher = user.role === 'teacher';

  const renderStudentInfo = () => (
    <div className="profile-view-grid">
      <ProfileInfoTab user={user} myCourses={myCourses} onEdit={() => setActiveTab('edit')} />
    </div>
  );

  const renderStudentEdit = () => (
    <div className="profile-edit-grid">
      <EditProfileTab form={form} handleChange={handleChange} preview={preview}
        handleAvatarFileChange={handleAvatarFileChange} handleSaveProfile={handleSaveProfile}
        saving={saving} onClose={() => setActiveTab('profile')} onCancel={() => setActiveTab('profile')}
        passwordForm={passwordForm} handlePasswordChange={handlePasswordChange}
        handleSavePassword={handleSavePassword} savingPassword={savingPassword} passwordError={passwordError}
        passwordSuccess={passwordSuccess}  />
    </div>
  );

  const renderTeacherInfo = () => (
    <TeacherInfoTab instructorInfo={instructorInfo} onEdit={() => setActiveTab('teacherEdit')} />
  );

  const renderTeacherEdit = () => (
    <div className="profile-edit-grid">
      <TeacherEditTab
        form={instructorForm}
        handleChange={handleInstructorChange}
        existingPortfolio={existingPortfolio}
        handleSaveInstructor={handleSaveInstructor}
        saving={savingInstructor}
        onClose={() => setActiveTab('teacherInfo')}
        onCancel={() => setActiveTab('teacherInfo')}
        // avatar (dùng chung logic account với student)
        preview={preview}
        handleAvatarFileChange={handleAvatarFileChange}
        handleSaveProfile={handleSaveProfile}
        savingAvatar={saving}
        // password
        passwordForm={passwordForm}
        handlePasswordChange={handlePasswordChange}
        handleSavePassword={handleSavePassword}
        savingPassword={savingPassword}
        passwordError={passwordError}
        passwordSuccess={passwordSuccess}
      />
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'profile':
        return isTeacher ? renderTeacherInfo() : renderStudentInfo();
      case 'edit':
        return isTeacher ? renderTeacherEdit() : renderStudentEdit();
      case 'teacherEdit':
        return isTeacher ? renderTeacherEdit() : renderStudentInfo();
      case 'teacherInfo':
        return isTeacher ? renderTeacherInfo() : renderStudentInfo();
      case 'courses':
        return <MyCoursesTab myCourses={myCourses} />;
      case 'teachers':
        return <TeachersTab />;
      case 'message':
        return <MessageTab />;
      case 'reviews':
        return <MyReviewsTab />;
      default:
        return null;
    }
  };
  return (
    <div className="profile-page">
      <div className="profile-page__inner">
        <Sidebar
          user={{ ...user, avatar: preview }}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <main className="profile-page__main">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}