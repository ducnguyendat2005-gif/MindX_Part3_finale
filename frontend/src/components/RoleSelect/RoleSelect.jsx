// src/components/SignUp/RoleSelect.jsx
import { GraduationCap, Presentation } from 'lucide-react';
import { motion } from 'motion/react';
import './RoleSelect.scss';

export default function RoleSelect({ onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.4 }}
      className="role-select-inner"
    >
      <div className="role-select-heading">
        <h1>You are ?...</h1>
        <p>Dont worry, you can change this later in the setting</p>
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
          <h3>Students</h3>
          <p>Explore and learn courses from various fields</p>
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
          <h3>Teacher</h3>
          <p>Create, manage, and sell your own courses</p>
        </motion.button>
      </div>
    </motion.div>
  );
}