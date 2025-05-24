import Layout from '../../components/Layout/Layout';
import styles from './Home.module.scss';

export default function Home() {
  return (
    <Layout>
      <div className={styles.home}>
        {/*We will add more stuff here after I finish the setup and pull mock data */}
        <h2>Restaurants</h2>
        <h2>Posts</h2>
      </div>
    </Layout>
  );
}