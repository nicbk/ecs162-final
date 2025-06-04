//this is where the layout will be and including the header and any nvaigation bars please keep it simple and clean
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import styles from './Layout.module.scss'
import { useState, useEffect } from 'react';

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation();

  // added theme toggle functionality but we will make it more optimized later for this is good enough 
  const [theme, setTheme] = useState<'light'|'dark'>(() => (localStorage.getItem('theme') as 'light'|'dark') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => {
    setTheme(current => (current === 'light' ? 'dark' : 'light'));
  };
  return (
    <div className={styles.container}>
      <header className={styles.navigation}>
        <div className={styles.logo}>
          <h2>Foodie</h2>
          <button className={styles.theme} onClick={toggleTheme}>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>

        <div className={styles.naviButtons}>
          {location.pathname === '/Profile' ? (
            <button className={styles.Home} onClick={() => navigate('/Home')}>Home</button>
          ) : (
            <button className={styles.profile} onClick={() => navigate('/Profile')}>Profile</button>
          )}
        </div>
      </header>
      
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}