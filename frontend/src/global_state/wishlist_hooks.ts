import { useContext } from "react";
import { GlobalStateContext } from "./global_state";
import { useToggleCacheWish } from "./cache_hooks";
import { isUser, type User } from "../interface_data";
import { addToWishlist, removeFromWishlist } from "../api_data/client";

export const useToggleWish = () => {
  const globalState = useContext(GlobalStateContext);
  const userAuthState = globalState!.userAuthState[0];
  const toggleCacheWish = useToggleCacheWish();

  const toggleWish = async (restaurantId: string) => {
    if (!isUser(userAuthState)) {
      return;
    }

    if ((userAuthState as User).wishList.has(restaurantId)) {
      await removeFromWishlist(restaurantId);
    } else {
      await addToWishlist(restaurantId);
    }
    toggleCacheWish(restaurantId);
  };

  return toggleWish;
};
