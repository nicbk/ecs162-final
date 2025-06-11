import { useContext, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { GlobalStateContext } from "./global_state";
import { getRestaurants } from "../api_data/client";
import type { Restaurant } from "../interface_data";
import { useUpdateRestaurants } from "./cache_hooks";

export type LoadRestaurantPos = -1 | 0 | 1 | 2;

export const metersToDegrees = (meters: number) => {
  // https://stackoverflow.com/questions/7477003/calculating-new-longitude-latitude-from-old-n-meters
  // Number of meters in a GPS coordinate degree
  return meters / 111320;
};

export const degreesToMeters = (degrees: number) => {
  return degrees / 11320;
};

const DEFAULT_CIRCLE_NUM_RESTAURANTS = 20;
const DEBOUNCER_DELAY = 2500; // in milliseconds

export const useRestaurantLazyLoad = (radiusMeters: number): [boolean, () => Promise<any>] => {
  const [xOffset, setXOffset] = useState<LoadRestaurantPos>(-1);
  const [yOffset, setYOffset] = useState<LoadRestaurantPos>(-1);
  const updateRestaurants = useUpdateRestaurants();
  const userPosition = useContext(GlobalStateContext)!.userLocationState[0];

  const updateNextRestaurants = async () => {
    console.log('initial')
    console.log(userPosition)
    if (!userPosition) {
      return;
    }

    let localXOffset = xOffset;
    let localYOffset = yOffset; 
    let circleRestaurants: Restaurant[] = [];
    console.log('retrieving user stuff')

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

    setXOffset(localXOffset);
    setYOffset(localYOffset);
  };

  const isEndOfList = yOffset === 2;

  return [isEndOfList, updateNextRestaurants];
};

// Realtime-based debouncer that can be used with scroll event
// https://www.sitepoint.com/throttle-scroll-events/
export const useDebounce = (delay: number) => {
  const timeout = useRef<number>(new Date().getMilliseconds());

  const debouncer = async (callback: () => Promise<any>) => {
    const currTime = new Date().getMilliseconds();

    if (currTime < timeout.current) {
      return;
    }

    timeout.current = new Date().getMilliseconds() + delay;
    return await callback();
  };

  return debouncer;
}