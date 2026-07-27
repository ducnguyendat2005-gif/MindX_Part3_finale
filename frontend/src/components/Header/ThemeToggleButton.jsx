import { useTheme } from "../../context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import styles from "./Header.module.scss";

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      style = {{ border:"1px solid #d0d0d0" ,borderRadius:"2px"}}
      type="button"
      className={styles.themeToggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <Moon size={30} /> : <Sun size={30} />}
    </button>
  );
};

export default ThemeToggleButton;