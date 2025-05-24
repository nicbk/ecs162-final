//this is where the layout will be and including the header and any nvaigation bars please keep it simple and clean
import type { ReactNode } from 'react';
import styles from './Layout.module.scss';

interface LayoutProps { children: ReactNode; }

const Layout: React.FC<LayoutProps> = ({ children }) => (
  <div className={styles.container}>
    <header className={styles.header}>
      <h1>my layout</h1>
    </header>
    <main className={styles.main}>{children}</main>
    <footer>Team foodie copyrights</footer>
  </div>
);

export default Layout;