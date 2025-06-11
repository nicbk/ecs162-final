import styles from './Restaurant.module.scss';
import { useContext, useEffect, useState } from 'react';
import mapIcon from '../../assets/map-icon.svg';
import { type GoogleApiRestaurantResponse, type PriceLevel } from '../../interface_data/index';
import { LoadingSpinner } from '../../components/LoadingSpinner/LoadingSpinner.tsx';
import { getRestaurantById } from '../../api_data/client';
import { GlobalStateContext } from '../../global_state/global_state.ts';
import { StarRating } from '../home/Home.tsx';
import { useNavigate } from 'react-router-dom';


export default function Restaurant() {
  const [restaurant, setRestaurant] = useState<GoogleApiRestaurantResponse | null>(null);
  const globalState = useContext(GlobalStateContext);
  const selectedRestaurantId = globalState?.globalCache[0].selectedRestaurantId;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!selectedRestaurantId) {
        // If no restaurant ID is selected, redirect to Home
        navigate('/Home');
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
        
        {restaurant.displayName} 
      </h1>
      <div className={styles.flexContainer}>
        <div className={styles.restaurantLocation}>
          <img src={mapIcon}
            alt="Map Icon"
            className={styles.mapIcon}
            onClick={() => window.open(restaurant.googleMapsUri, '_blank')}
            onMouseEnter={(e) => e.currentTarget.style.cursor = 'pointer'}
          />
          <p>{restaurant.formattedAddress}</p>
        </div>
        <StarRating ratingofRest={restaurant.rating} />
      </div>
      <div className={styles.restaurantDetails}>
        <div className={styles.restaurantFoodOptions}>
          <p>Takeout: {boolTickCross(restaurant.takeout)}</p>
          <p>Delivery: {boolTickCross(restaurant.delivery)}</p>
          <p>Dine In: {boolTickCross(restaurant.dineIn)}</p>
        </div>
        <p>Price Level: {getPriceLevelText(restaurant.priceLevel)}</p>
        <p>{getOpeningHoursText(restaurant.regularOpeningHours)}</p>
      </div>
      <div className={styles.images}>
        {restaurant.images.map((image, index) => (
          <img key={index} src={image} alt={`Restaurant image ${index + 1}`} />
        ))}
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

const todaysOpeningHours = (todaysHours: Object) => {
  const openTime = (todaysHours as any).open;
  const closeTime = (todaysHours as any).close;

  const formatTime = (time: Object) => {
    const hour = (time as any).hour;
    const minutes = (time as any).minute;


    if (hour > 12) {
      return `${hour - 12}:${minutes < 10 ? minutes + '0' : minutes} PM`;
    } else {
      return `${hour}:${minutes < 10 ? minutes + '0' : minutes} AM`;
    }
  }
  return `${formatTime(openTime)} - ${formatTime(closeTime)}`;
}

const getOpeningHoursText = (openingHours: Object) => {
  // Assuming openingHours has an 'openNow' property
  const openNow = (openingHours as any).openNow;
  const today = (new Date().getDay()) % 7;
  const todaysHours = (openingHours as any).periods?.[today];


  if (!openingHours || Object.keys(openingHours).length === 0) {
    return 'No opening hours available';
  }
  return (
    <div className={styles.openingHours}>
      <div className={styles.openingStatus}>
        {openNow ? (
          <span style={{ color: 'green' }}>Open</span>
          ) : (
          <span style={{ color: 'red' }}>Closed</span>
        )}
      </div>
      <div>
        {todaysOpeningHours(todaysHours)}
      </div>
    </div>

  );
}