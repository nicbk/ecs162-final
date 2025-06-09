import { useContext } from "react";
import { GlobalStateContext } from "./global_state";
import { useFetchCommentForest } from "./cache_hooks";
import { isUser, type User } from "../interface_data";
import { addLike, removeLike } from "../api_data/client";

export const useToggleLike = () => {
  const globalState = useContext(GlobalStateContext);
  const userAuthState = globalState!.userAuthState[0];
  const refetchCommentForest = useFetchCommentForest();

  const toggleLike = async (restaurantId: string, commentId: string) => {
    if (!isUser(userAuthState)) {
      return;
    }

    if ((userAuthState as User).likedComments.has(commentId)) {
      await removeLike(commentId);
    } else {
      await addLike(commentId);
    }

    await refetchCommentForest(restaurantId);
  };

  return toggleLike;
};
