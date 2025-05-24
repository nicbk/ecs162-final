//this is where the layout will be and including the header and any nvaigation bars please keep it simple and clean
import { useNavigate, Outlet } from 'react-router-dom'
import styles from './Layout.module.scss'

export default function Layout() {
  const navigate = useNavigate()
  return (
    <div className={styles.container}>
      <header className={styles.navigation}>
        <div className={styles.logo}>
          <h2>Foodie</h2>
        </div>
        <nav className={styles.navbar}>
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