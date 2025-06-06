import { useContext, useEffect } from "react";
import { GlobalStateContext, type GPSCoordinates } from "../../global_state/global_state";

// Promisify getting GPS coordinates to make code inside main Home component more elegant
export const getGpsCoords = (): Promise<GPSCoordinates> => {
  return new Promise<GPSCoordinates>((resolve: (newCoords: GPSCoordinates) => void, reject: ((err: string) => void)) => {
    const onSuccess = (pos: GeolocationPosition) => {
      resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      });
    };

    const onError = (_reason: any) => {
      reject('Unable to get GPS coordinates');
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(onSuccess, onError);
    } else {
      reject('GPS coordinates are unavailable');
    }
  });
};

export const useGpsSetter = () => {
  const [userLocation, setUserLocation] = useContext(GlobalStateContext)!.userLocationState;

  useEffect(() => {
    // Set the user GPS coordinates in global state using browser
    if (!userLocation) {
      // I learn how to get GPS coordinates from browser from MDN docs: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API/Using_the_Geolocation_API

      (async () => {
        try {
          const gpsCoords = await getGpsCoords();
          setUserLocation(gpsCoords);
        } catch {
          // Set location to sane default if GPS not available or user denies request.
          setUserLocation({
            // Intersection of F and 3rd street in Davis according to Google Maps: https://www.google.com/maps/place/Davis,+CA/@38.5446714,-121.7407222,101m/data=!3m1!1e3!4m6!3m5!1s0x808529999495543f:0xc3013f1b6ee28fff!8m2!3d38.5449065!4d-121.7405167!16zL20vMDJoeXQ!5m1!1e2?entry=ttu&g_ep=EgoyMDI1MDYwMy4wIKXMDSoASAFQAw%3D%3D
            latitude: 38.544725,
            longitude: -121.740363
          });
        }
      })();
    }
  }, []);
}

