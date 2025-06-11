import styles from './Restaurant.module.scss';
import { useContext, useEffect, useState } from 'react';
import mapIcon from '../../assets/map-icon.svg';
import { type GoogleApiRestaurantResponse, type PriceLevel } from '../../interface_data/index';
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner.tsx';
import { getRestaurantById } from '../../api_data/client';
import { GlobalStateContext } from '../../global_state/global_state.ts';


export default function Restaurant() {
  const [restaurant, setRestaurant] = useState<GoogleApiRestaurantResponse | null>(null);
  const globalState = useContext(GlobalStateContext);
  const selectedRestaurantId = globalState?.globalCache[0].selectedRestaurantId;

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!selectedRestaurantId) {
        console.error("No restaurant ID selected");
        return;
      }

      const restaurantInfo = await getRestaurantById(selectedRestaurantId)
      setRestaurant(restaurantInfo);
    };

    fetchRestaurant();
  }, []);


  if (restaurant === null) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.restaurantContainer}>
      {/* Render restaurant details */}
      <h1 className={styles.restaurantTitle}>
        <img src={mapIcon}
          alt="Map Icon"
          className={styles.mapIcon}
          onClick={() => window.open(restaurant.googleMapsUri, '_blank')}
          onMouseEnter={(e) => e.currentTarget.style.cursor = 'pointer'}
        />
        {restaurant.displayName} 
      </h1>
      <div className={styles.restaurantDetails}>
        <div className={styles.restaurantFoodOptions}>
          <p>Takeout: {boolTickCross(restaurant.takeout)}</p>
          <p>Delivery: {boolTickCross(restaurant.delivery)}</p>
          <p>Dine In: {boolTickCross(restaurant.dineIn)}</p>
        </div>
        <p>Rating: {restaurant.rating}</p>
        <p>Address: {restaurant.formattedAddress}</p>
        <p>Price Level: {getPriceLevelText(restaurant.priceLevel)}</p>
        <div className={styles.images}>
          {restaurant.images.map((image, index) => (
            <img key={index} src={image} alt={`Restaurant image ${index + 1}`} />
          ))}
        </div>
      </div>

    </div>
  );
}

const boolTickCross = (value: boolean) => {
  return value ? '✔️' : '❌';
}

const getPriceLevelText = (priceLevel: PriceLevel) => {
  switch (priceLevel) {
    case 'PRICE_LEVEL_FREE':
      return 'Free';
    case 'PRICE_LEVEL_INEXPENSIVE':
      return '$';
    case 'PRICE_LEVEL_MODERATE':
      return '$$';
    case 'PRICE_LEVEL_EXPENSIVE':
      return '$$$';
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return '$$$$';
    default:
      return 'Unknown Price Level';
  }
}