//this is where the layout will be and including the header and any nvaigation bars please keep it simple and clean
import { useNavigate, Outlet } from 'react-router-dom'
import styles from './Layout.module.scss'
import { useState, useEffect } from 'react';

export default function Layout() {
  const navigate = useNavigate()
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
        </div>
        <nav className={styles.navbar}>
            <button className={styles.navButton} onClick={toggleTheme}>
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
            <button className={styles.navButton} onClick={() => navigate('/Home')}> Home</button>
            {/* added profile for now in navigation bar but we have to change to avatar icon after */}
            <button className={styles.navButton} onClick={() => navigate('/Profile')}> Profile</button>
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

    </div>
  )
}