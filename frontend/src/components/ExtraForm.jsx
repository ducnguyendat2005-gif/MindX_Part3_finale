// src/components/SignUp/ExtraForm.jsx
import StudentExtraForm from './StudentExtraForm/StudentExtraForm.jsx';
import TeacherExtraForm from './TeacherExtraForm/TeacherExtraForm.jsx';

export default function ExtraForm({ role, onSubmit, onBack }) {
  if (role === 'teacher') {
    return <TeacherExtraForm onSubmit={onSubmit} onBack={onBack} />;
  }
  return <StudentExtraForm onSubmit={onSubmit} onBack={onBack} />;
}
