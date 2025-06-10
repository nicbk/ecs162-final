import { useContext } from "react";
import { GlobalStateContext } from "./global_state";
import { useFetchCommentForest, useToggleCacheLike, useToggleCacheWish } from "./cache_hooks";
import { isUser, type User } from "../interface_data";
import { addLike, addToWishlist, removeFromWishlist, removeLike } from "../api_data/client";
import { useFetchUser } from "./user_hooks";

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

    // Don't refetch - local cache is only updated successfully if the remote updates are successful
    //await refetchUser();
    //await refetchCommentForest(restaurantId);
  };

  return toggleWish;
};
