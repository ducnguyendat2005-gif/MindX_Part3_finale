// src/components/SignUp/RoleSelect.jsx
import { GraduationCap, Presentation } from 'lucide-react';
import { motion } from 'motion/react';
import './RoleSelect.scss';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function RoleSelect({ onSelect }) {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4 }}
      className="role-select-inner"
    >
      <div className="role-select-heading">
        <h1>{t('auth.roleQuestion')}</h1>
        <p>{t('auth.roleHint')}</p>
      </div>

      <div className="role-select-grid">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('student')}
          className="role-card"
        >
          <div className="role-card__icon">
            <GraduationCap size={32} />
          </div>
          <h3>{t('auth.student')}</h3>
          <p>{t('auth.studentDescription')}</p>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect('teacher')}
          className="role-card"
        >
          <div className="role-card__icon">
            <Presentation size={32} />
          </div>
          <h3>{t('auth.teacher')}</h3>
          <p>{t('auth.teacherDescription')}</p>
        </motion.button>
      </div>
    </motion.div>
  );
}
