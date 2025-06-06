import type { GPSCoordinates } from "../../global_state/global_state";

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

    navigator.geolocation.getCurrentPosition(onSuccess, onError);
  });
};
