import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import styles from "./Header.module.scss";

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  const iconProps = { size: 22 };

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon {...iconProps} color="#000000" />
      ) : (
        <Sun {...iconProps} color="#FFFFFF" />
      )}
    </button>
  );
};

export default ThemeToggleButton;