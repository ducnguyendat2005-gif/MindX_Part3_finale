import React, { useState, useEffect } from 'react';
import { API, fetchWithAuth, tokenStorage } from '../../config/api.js';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../../components/ProfileComponents/Sidebar/Sidebar.jsx';
import ProfileInfoTab from '../../components/ProfileComponents/ProfileInfoTab/ProfileInfoTab.jsx';
import EditProfileTab from '../../components/ProfileComponents/EditProfileTab/EditProfileTab.jsx';
import MyCoursesTab from '../../components/ProfileComponents/MyCoursesTab/MyCoursesTab.jsx';
import TeachersTab from '../../components/ProfileComponents/TeacherTab/TeacherTab.jsx';
import MessageTab from '../../components/ProfileComponents/MessageTab/MessageTab.jsx';
import MyReviewsTab from '../../components/ProfileComponents/MyReviewTab/MyReviewTab.jsx';
import './ProfilePage.scss';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    description: '',
    language: '',
    imageUrl: '',
  });
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

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
        localStorage.setItem('loggedInUser', JSON.stringify(merged));

        setForm({
          firstName: merged.Fname ?? '',
          lastName: merged.Lname ?? '',
          headline: merged.headline ?? '',
          description: merged.description ?? '',
          language: merged.language ?? '',
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

  const handleUploadImage = () => {
    if (form.imageUrl) setPreview(form.imageUrl);
  };

  const handleSaveProfile = async () => {
    // TODO: nối API PUT /account/myprofile khi backend sẵn sàng
    setSaving(true);
    console.log('Save profile:', { ...form, avatar: preview });
    setTimeout(() => setSaving(false), 500);
  };

  if (!user) return <p className="profile-page__loading">Đang tải...</p>;

  const renderTab = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <ProfileInfoTab
            user={user}
            myCourses={myCourses}
            onEdit={() => setActiveTab('edit')}
          />
        );
      case 'edit':
        return (
          <EditProfileTab
            form={form}
            handleChange={handleChange}
            preview={preview}
            handleUploadImage={handleUploadImage}
            handleSaveProfile={handleSaveProfile}
            saving={saving}
            onClose={() => setActiveTab('profile')}
            onCancel={() => setActiveTab('profile')}
          />
        );
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