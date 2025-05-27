import styles from './Home.module.scss';
import { mockResturantsData } from '../../api_data/mock_data';
import { type Restaurant } from '../../interface_data/index.ts';
import { mockPublish } from '../../api_data/mock_data';

export default function Home() {
  return (
      <div className={styles.home}>
        {mockResturantsData.map((rest: Restaurant) => (
          <div className={styles.card} key={rest.restaurantId}>
            <div className={styles.post}>
              <h4>{rest.restaurantTitle}</h4>
              <p>{rest.address}</p>
              <p>{rest.rating}</p>
            </div>
            
            <div className={styles.cardImage}>
              <img src={rest.images[0]}
               alt="Card Image" />
            </div>
            <div className={styles.cardHeader}>
            </div>
          </div>
        ))}
      </div>
  )
}