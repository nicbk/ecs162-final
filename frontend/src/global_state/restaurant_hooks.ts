import { useContext, useRef} from "react";
import { GlobalStateContext } from "./global_state";
import { getRestaurants } from "../api_data/client";
import type { Restaurant } from "../interface_data";
import { useUpdateRestaurants } from "./cache_hooks";

export const metersToDegrees = (meters: number) => {
  // https://stackoverflow.com/questions/7477003/calculating-new-longitude-latitude-from-old-n-meters
  // Number of meters in a GPS coordinate degree
  return meters / 111320;
};

export const degreesToMeters = (degrees: number) => {
  return degrees / 11320;
};

const DEFAULT_CIRCLE_NUM_RESTAURANTS = 5;

export const useRestaurantLazyLoad = (radiusMeters: number): [boolean, () => Promise<any>] => {
  const [offset, setOffset] = useContext(GlobalStateContext)!.lazyLoadOffset;
  const updateRestaurants = useUpdateRestaurants();
  const userPosition = useContext(GlobalStateContext)!.userLocationState[0];

  const updateNextRestaurants = async () => {
    if (!userPosition) {
      return;
    }

    let localXOffset = offset.offsetX;
    let localYOffset = offset.offsetY; 
    let circleRestaurants: Restaurant[] = [];

    while (localYOffset < 2 && circleRestaurants.length === 0) {
      const radiusDegrees = metersToDegrees(radiusMeters);

      const degreesXNew = userPosition!.latitude + 2*radiusDegrees*localXOffset;
      const degreesYNew = userPosition!.longitude + 2*radiusDegrees*localYOffset;

      circleRestaurants = circleRestaurants.concat(await getRestaurants(degreesXNew, degreesYNew, DEFAULT_CIRCLE_NUM_RESTAURANTS, radiusMeters));

      if (localXOffset < 1) {
        localXOffset += 1;
      } else {
        localXOffset = -1;
        localYOffset += 1;
      }
    }

    updateRestaurants(circleRestaurants);

    setOffset({
      offsetX: localXOffset,
      offsetY: localYOffset
    });
  };

  const isEndOfList = offset.offsetY === 2;

  return [isEndOfList, updateNextRestaurants];
};

// Realtime-based debouncer that can be used with scroll event
// https://www.sitepoint.com/throttle-scroll-events/
export const useDebounce = (delay: number) => {
  const timeout = useRef<number>(Date.now());

  const debouncer = async (callback: () => Promise<any>) => {
    const currTime = Date.now();

    if (currTime < timeout.current) {
      return;
    }

    timeout.current = Date.now() + delay;
    return await callback();
  };

  return debouncer;
}

export const useSelectedRestaurant = () => {
  const globalState = useContext(GlobalStateContext);
  if (!globalState) {
    throw new Error("GlobalStateContext is not available");
  }

  const [globalCache, setGlobalCache] = globalState.globalCache;

  const selectRestaurantToView = (restaurantId: string) => {
    if (!restaurantId) {
      console.error("Invalid restaurant ID provided");
      return;
    }

    if (!globalCache.restaurants[restaurantId]) {
      console.warn(`Restaurant with ID ${restaurantId} not found in cache`);
      return;
    }

    setGlobalCache((prevCache) => ({
      ...prevCache,
      selectedRestaurantId: restaurantId
    }));
  }

  return selectRestaurantToView;
}