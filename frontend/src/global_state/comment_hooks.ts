import { useContext } from "react";
import { GlobalStateContext } from "./global_state";
import { useFetchCommentForest, useToggleCacheLike } from "./cache_hooks";
import { isUser, type User } from "../interface_data";
import { addLike, removeLike } from "../api_data/client";
import { useFetchUser } from "./user_hooks";

export const useToggleLike = () => {
  const globalState = useContext(GlobalStateContext);
  const userAuthState = globalState!.userAuthState[0];
  const refetchUser = useFetchUser();
  const refetchCommentForest = useFetchCommentForest();
  const toggleCacheLike = useToggleCacheLike();

  const toggleLike = async (restaurantId: string, commentId: string) => {
    if (!isUser(userAuthState)) {
      return;
    }

    if ((userAuthState as User).likedComments.has(commentId)) {
      await removeLike(commentId);
    } else {
      await addLike(commentId);
    }
    toggleCacheLike(commentId);

    // Don't refetch - local cache is only updated successfully if the remote updates are successful
    //await refetchUser();
    //await refetchCommentForest(restaurantId);
  };

  return toggleLike;
};
