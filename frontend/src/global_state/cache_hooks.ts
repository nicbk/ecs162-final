import { useContext, useEffect } from "react";
import { GlobalStateContext, UUID_LENGTH } from "./global_state";
import { isCommentTopLevel, isUser, type Comment, type Restaurant, type User } from "../interface_data";
import { getCommentTree, getResourceComments, getRestaurants } from "../api_data/client";
import { useGpsSetter } from "./gps_hooks";

export const useRestaurants = (): [Restaurant[], (restaurants: Restaurant[]) => void] => {
  const globalState = useContext(GlobalStateContext);
  const [globalCache, setGlobalCache] = globalState!.globalCache;

  const setRestaurants = (restaurants: Restaurant[]) => {
    let restaurantMap: Record<string, Restaurant> = {};
    
    for (const restaurant of restaurants) {
      restaurantMap[restaurant.restaurantId] = restaurant;
    }

    // Use set callbacks since we wish to set cache data sequentially before re-render
    // https://react.dev/learn/queueing-a-series-of-state-updates
    setGlobalCache((globalCacheLocal) => ({
      ...globalCacheLocal,
      restaurants: restaurantMap
    }));
  };

  const returnRestaurants = Object.values(globalCache.restaurants);
  return [returnRestaurants, setRestaurants];
};

export const useUpdateRestaurants = () => {
  const globalState = useContext(GlobalStateContext);
  const setGlobalCache = globalState!.globalCache[1];

  const updateRestaurants = (restaurants: Restaurant[]) => {
    // Use set callbacks since we wish to set cache data sequentially before re-render
    // https://react.dev/learn/queueing-a-series-of-state-updates
    setGlobalCache((globalCacheLocal) => {
      let restaurantMap: Record<string, Restaurant> = {
        ...globalCacheLocal.restaurants
      };
      
      for (const restaurant of restaurants) {
        restaurantMap[restaurant.restaurantId] = restaurant;
      }

      return {
        ...globalCacheLocal,
        restaurants: restaurantMap
      };
    });
  };

  return updateRestaurants;
};

export const useComments = (): [Comment[], (comments: Comment[]) => void] => {
  const globalState = useContext(GlobalStateContext);
  const [globalCache, setGlobalCache] = globalState!.globalCache;

  const setComments = (comments: Comment[]) => {
    let commentMap: Record<string, Comment> = {};
    
    for (const comment of comments) {
      commentMap[comment.id] = comment;
    }

    // Use set callbacks since we wish to set cache data sequentially before re-render
    // https://react.dev/learn/queueing-a-series-of-state-updates
    setGlobalCache((globalCacheLocal) => ({
      ...globalCacheLocal,
      comments: commentMap
    }));
  };

  const returnComments = Object.values(globalCache.comments);
  return [returnComments, setComments];
};

const treeCommentLikeUpdate = (targetId: string, commentRoot: Comment, shouldIncrease: boolean): Comment => {
  if (targetId === commentRoot.id) {
    if (shouldIncrease) {
      commentRoot.likes += 1;
    } else {
      commentRoot.likes -= 1;
    }
  } else {
    for (const reply of commentRoot.replies) {
      treeCommentLikeUpdate(targetId, reply, shouldIncrease);
    }
  }

  return commentRoot;
};

export const useToggleCacheLike = () => {
  const [globalCache, setGlobalCache] = useContext(GlobalStateContext)!.globalCache;
  const [userAuthState, setUserAuthState] = useContext(GlobalStateContext)!.userAuthState;

  const toggleCacheLike = (commentId: string) => {
    if (!isUser(userAuthState)) {
      return;
    }
    const user = userAuthState as User;
    const isLiked = user.likedComments.has(commentId);

    if (commentId.length === UUID_LENGTH) {
      const updatedCache = {
        ...globalCache
      };

      if (isLiked) {
        //updatedCache.comments[commentId].likes -= 1;
        for (const rootComment of Object.values(updatedCache.comments)) {
          treeCommentLikeUpdate(commentId, rootComment, false);
        }
      } else {
        //updatedCache.comments[commentId].likes += 1;
        for (const rootComment of Object.values(updatedCache.comments)) {
          treeCommentLikeUpdate(commentId, rootComment, true);
        }
      }

      setGlobalCache(updatedCache);
    }

    setUserAuthState((existingUser) => {
      const castedExistingUser = existingUser as User;
      const updatedUser = {
        ...castedExistingUser
      };

      if (isLiked) {
        updatedUser.likedComments.delete(commentId);
      } else {
        updatedUser.likedComments.add(commentId);
      }

      return updatedUser;
    });
  }

  return toggleCacheLike;
};

export const useToggleCacheWish = () => {
  const [globalCache, setGlobalCache] = useContext(GlobalStateContext)!.globalCache;
  const [userAuthState, setUserAuthState] = useContext(GlobalStateContext)!.userAuthState;

  

  const toggleCacheWish = (restaurantId: string) => {
    if (!isUser(userAuthState)) {
      return;
    }
    const user = userAuthState as User;
    const isWished = user.wishList.has(restaurantId);

    if (restaurantId.length === UUID_LENGTH) {
      const updatedCache = {
        ...globalCache
      };

      if (isWished) {
        updatedCache.wishList.filter((id) => id !== restaurantId);
      } else {
        updatedCache.wishList.push(restaurantId);
      }

      setGlobalCache(updatedCache);
    }

    setUserAuthState((existingUser) => {
      const castedExistingUser = existingUser as User;
      const updatedUser = {
        ...castedExistingUser
      };

      if (isWished) {
        updatedUser.wishList.delete(restaurantId);
      } else {
        updatedUser.wishList.add(restaurantId);
      }

      return updatedUser;
    });
  }

  return toggleCacheWish;
};

export const useThread = (parentId: string | null) => {
  const comments = useContext(GlobalStateContext)!.globalCache[0].comments;

  if (!parentId) {
    return null;
  }

  if (parentId in comments) {
    return comments[parentId];
  } else {
    return null;
  }
}

export const useUpdateComments = () => {
  const globalState = useContext(GlobalStateContext);
  const setGlobalCache = globalState!.globalCache[1];

  const updateComments = (comments: Comment[]) => {
    // Use set callbacks since we wish to set cache data sequentially before re-render
    // https://react.dev/learn/queueing-a-series-of-state-updates
    setGlobalCache((globalCacheLocal) => {
      let commentMap: Record<string, Comment> = {
        ...globalCacheLocal.comments
      };
      
      for (const comment of comments) {
        commentMap[comment.id] = comment;
      }

      return {
        ...globalCacheLocal,
        comments: commentMap
      };
    });
  };

  return updateComments;
};

export interface CommentWithRestaurant {
  restaurant: Restaurant;
  comment: Comment;
};

export const useFirstLevelComments = () => {
  const comments = useComments()[0];
  const restaurantMap = useContext(GlobalStateContext)!.globalCache[0].restaurants;

  const firstLevelComments = Object.values(comments).filter(comment => comment.rating && !Number.isNaN(comment.rating))
    // TODO: remove this line \/ when restaurant retrieval code is implemented
    .filter(comment => comment.parentId in restaurantMap);

  const commentsWithRestaurant: CommentWithRestaurant[] = firstLevelComments.map(comment => {
    if (!(comment.parentId in restaurantMap)) {
      // TODO: execute code here to get the restaurant from the backend, given the restaurantId (parentId)
    }

    return {
      restaurant: restaurantMap[comment.parentId],
      comment
    };
  });

  return commentsWithRestaurant;
};

export const useRestaurantCommentMap = () => {
  const globalState = useContext(GlobalStateContext);
  const globalCache = globalState!.globalCache[0];
  const comments = Object.values(globalCache.comments);

  let restaurantCommentMap: Record<string, Comment[]> = {};

  for (const comment of comments) {
    if (isCommentTopLevel(comment)) {
      if (!(comment.parentId in restaurantCommentMap)) {
        restaurantCommentMap[comment.parentId] = [];
      }

      restaurantCommentMap[comment.parentId].push(comment);
    }
  }

  return restaurantCommentMap;
};

export const useInitialDataLoad = () => {
  useGpsSetter();

  const DEFAULT_NUM_RESTAURANTS = 6;

  const globalState = useContext(GlobalStateContext)!;
  const userLocation = globalState.userLocationState[0];

  const setRestaurants = useRestaurants()[1];
  //const setComments = useComments()[1];
  const updateComments = useUpdateComments();

  // Initial data load
  useEffect(() => {
    const loadTheData = async () => {
      if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
        return;
      }

      try {
        const restaurantsData = await getRestaurants(userLocation?.latitude!, userLocation?.longitude!, DEFAULT_NUM_RESTAURANTS);
        const commentsList = await Promise.all(restaurantsData.map(restaurant => getResourceComments(restaurant.restaurantId)));
        const commentsAll = commentsList.flat();

        setRestaurants(restaurantsData)
        //setComments(commentsAll);
        updateComments(commentsAll);
      } catch (error) {
        console.error('Failed to load data', error)
      }
    }
    loadTheData()
  }, [userLocation]);
};

export const useFetchCommentForest = () => {
  const updateComments = useUpdateComments();

  return (
    async (restaurantId: string) => {
      const comments = await getResourceComments(restaurantId);
      updateComments(comments);
    }
  )
};

export const useFetchCommentTree = () => {
  const updateComments = useUpdateComments();

  return (
    async (restaurantId: string) => {
      const comments = await getCommentTree(restaurantId);
      updateComments([comments]);
    }
  )
};