import { useContext } from "react";
import { GlobalStateContext, UUID_LENGTH } from "./global_state";
import { getLoggedInUser } from "../api_data/client";
import type { User } from "../interface_data";

export const useFetchUser = () => {
  const setUserAuthState = useContext(GlobalStateContext)!.userAuthState[1];

  const fetchUser = async () => {
    const backendUserRaw = await getLoggedInUser();
    if (!backendUserRaw) {
        return;
    }

    const backendUser = backendUserRaw as User;

    setUserAuthState(backendUser);
  }

  return fetchUser;
};

export const useLikedRestaurants = () => {
  const globalState = useContext(GlobalStateContext)!;
  const restaurantMap = globalState.globalCache[0].restaurants;
  const userAuthState = globalState.userAuthState[0] as User;

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
  const likedRestaurants = Array.from(userAuthState.likedComments)
    .filter(resourceId => resourceId.length < UUID_LENGTH)
    .map(restaurantId => {
      if (!(restaurantId in restaurantMap)) {
        // TODO: fetch the restaurant information from the backend into the restaurantMap
      }

      return restaurantMap[restaurantId];
    });

  return likedRestaurants;
};

export const useWishListRestaurants = () => {
  const globalState = useContext(GlobalStateContext)!;
  const userAuthState = globalState.userAuthState[0] as User;

  return Array.from(userAuthState.wishList)
};
