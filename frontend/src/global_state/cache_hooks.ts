import { useContext, useEffect } from "react";
import { GlobalStateContext } from "./global_state";
import { isCommentTopLevel, type Comment, type Restaurant } from "../interface_data";
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

export const useThread = (parentId: string) => {
  const comments = useContext(GlobalStateContext)!.globalCache[0].comments;

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
  const setComments = useComments()[1];

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
        setComments(commentsAll);
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
      updateComments(comments);
    }
  )
};