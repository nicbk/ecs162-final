import styles from './Home.module.scss';
import { mockResturantsData } from '../../api_data/mock_data';
import { type Restaurant } from '../../interface_data/index.ts';
import { mockPublish } from '../../api_data/mock_data';

export default function Home() {
  return (
      <div className={styles.home}>
        {mockResturantsData.map((rest: Restaurant) => (
          <div className={styles.card} key={rest.id}>
            <div className={styles.post}>
              <h4>{rest.name}</h4>
              <p>{rest.address}</p>
              <p>{rest.city}</p>
              <p>{rest.state}</p>
            </div>
            
            <div className={styles.cardImage}>
              <img src="https://assets.bonappetit.com/photos/631788f25635b01b337f6bb4/16:9/w_2560%2Cc_limit/220827_GuangXu_BA-UncleLou_014.jpg"
               alt="Card Image" />
            </div>
            <div className={styles.cardHeader}>
            </div>
          </div>
        ))}
      </div>
  )
}