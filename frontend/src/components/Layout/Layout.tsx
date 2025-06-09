//this is where the layout will be and including the header and any nvaigation bars please keep it simple and clean
import { useNavigate, Outlet, useLocation, useParams } from 'react-router-dom'
import styles from './Layout.module.scss'
import { useState, useEffect, useContext } from 'react';
import { getCommentsMock  } from '../../api_data/client.ts'
import { FaBars, FaTimes FaUserCircle} from 'react-icons/fa'
import { GlobalStateContext} from '../../global_state/global_state';
import type { User } from '../../interface_data/index.ts';
import { initFirebaseHandler, onLoginButtonPress, onLogoutButtonPress } from './helpers.ts';

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation();
  const { commentId } = useParams<{ commentId: string }>()
  const globalState = useContext(GlobalStateContext);
  const [userAuthenticationState, setUserAuthenticationState] = globalState!.userAuthState;

  // Init the firebase auth event handler
  useEffect(() => {
    initFirebaseHandler(setUserAuthenticationState);
  }, []);

  // added theme toggle functionality but we will make it more optimized later for this is good enough 
  const [theme, setTheme] = useState<'light'|'dark'>(() => (localStorage.getItem('theme') as 'light'|'dark') || 'light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => {
    setTheme(current => (current === 'light' ? 'dark' : 'light'));
  };
  const [PUserName, setParentUserN] = useState<string | null>(null)
  // needs to change it once we decide the final way of getting the comments
  // but for now I think the rough idea is there
  useEffect(() => {
    if (!commentId) {
      setParentUserN(null)
      return
    }
    // I am loading the parent username using the commentId which is for now mock
    async function loadPUserName() {
      try {
        const comments = await getCommentsMock();
        const found = comments.find(comm => comm.id === commentId)
        setParentUserN(found ? found.username : null)
      } catch (error) {
        console.error('Failed to load the Parent', error)
        setParentUserN(null)
      }
    }
    loadPUserName()
  }, [commentId])

  const [navigOpen, setNavOpen] = useState(false)
  const toggleNav = () => setNavOpen(open => !open)
  const SocialM = location.pathname === '/SocialMedia'
  const [isSocialM, setIsSocial] = useState(SocialM)

  useEffect(() => {
    setIsSocial(location.pathname === '/SocialMedia')
  }, [location.pathname])

  const toggle = () => {
    setIsSocial(!isSocialM)
    navigate(!isSocialM ? '/SocialMedia' : '/Home')
  }

  const handleP = (event: React.MouseEvent) => {
    event.preventDefault()
    if (userAuthenticationState === 'not-logged-in') {
      onLoginButtonPress(setUserAuthenticationState)
    } 
    else if (userAuthenticationState !== 'loading') {
      navigate('/Profile')
    }
  }

  const getLogin = 
    userAuthenticationState !== 'not-logged-in' &&
    userAuthenticationState !== 'loading'
  const pAvatar = getLogin
    ? (userAuthenticationState as User).profileImage
    : undefined

  const isProfile = location.pathname === '/Profile'

  return (
    <div>
      <div className={styles.avatar} onClick={handleP}>
        {pAvatar ? (
          <img
            src={pAvatar}
            alt="pic"
          />
        ) : (
          <FaUserCircle />
        )}
      </div>
      <div className={styles.header}>
        {!isProfile && (
          <div className={styles.contentToggle}>
            <label className={styles.toggleSwitch}>
              <input type="checkbox" checked={isSocialM} onChange={toggle} />
              <div className={styles.switcher}>
                <span className={styles.changeable}>Restaurants</span>
                <span className={styles.changeable}>Social</span>
                <div className={styles.selector} />
              </div>
            </label>
          </div>
        )}
        {!navigOpen && (<button className={styles.navigToggle}
            onClick={toggleNav}
            aria-label="Open menu"
          >
            <FaBars />
          </button>
        )}
      </div>
      <div className={styles.container}>
        {/* for now this is gonna be just toggle menu but later maybe we can also do hover on side? */}
        <aside className={`${styles.sidebar} ${navigOpen ? styles.open : ''}`}>
          {navigOpen && (
            <button className={styles.navigClose}
              onClick={toggleNav}
              aria-label="Close menu"
            >
              <FaTimes />
            </button>
          )}
          {typeof userAuthenticationState === 'object' ? (<span><strong>Welcome {(userAuthenticationState as User).username}!</strong></span>) : null}
          <div className={styles.logo}>
            <h2>Foodie</h2>
            <button className={styles.theme} onClick={toggleTheme}>
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
          {/* talked with the team but still thinking about it maybe or maybe not leave this part. */}
          {PUserName && (
            <div className={styles.threadnavigation}>
              <h4 className={styles.threadTitle}>
                thread of {PUserName}
              </h4>
            </div>
          )}
          {/* we as a team decided maybe the side bar will look better then the top so I change it to see how it looks like */}
          <nav className={styles.pageNav}>
            <button className={`${styles.Home} ${location.pathname === '/Home' ? styles.active : ''}`}
              onClick={() => navigate('/Home')}>Home</button>

            {userAuthenticationState === 'not-logged-in' ? (
              <button
                className={styles.login}
                onClick={(event) => {
                  event.preventDefault();
                  onLoginButtonPress(setUserAuthenticationState);
                }}
              >
                Login
              </button>
            ) : userAuthenticationState === 'loading' ? (
              <span>Logging in...</span>
            ) : (
              <>
                <button className={`${styles.profile} ${location.pathname === '/Profile' ? styles.active : ''}`}
                  onClick={() => navigate('/Profile')}>Profile</button>
                <div className={styles.authSection}>
                  <button
                    className={styles.logout}
                    onClick={(event) => {
                      event.preventDefault();
                      onLogoutButtonPress(setUserAuthenticationState);
                    }}
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </nav>
        </aside>
        
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}