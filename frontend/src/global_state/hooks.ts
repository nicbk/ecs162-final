import { useContext } from "react";
import { GlobalStateContext } from "./global_state";
import { isCommentTopLevel, type Comment, type Restaurant } from "../interface_data";

export const useRestaurants = (): [Restaurant[], (restaurants: Restaurant[]) => void] => {
  const globalState = useContext(GlobalStateContext);
  const [globalCache, setGlobalCache] = globalState!.globalCache;

  const setRestaurants = (restaurants: Restaurant[]) => {
    let restaurantMap: Record<string, Restaurant> = {};
    
    for (const restaurant of restaurants) {
      restaurantMap[restaurant.restaurantId] = restaurant;
    }

    // Use set callbacks since we wish to set cache data sequentially
    // https://react.dev/learn/queueing-a-series-of-state-updates
    setGlobalCache((globalCacheLocal) => ({
      ...globalCacheLocal,
      restaurants: restaurantMap
    }));
  };

  const returnRestaurants = Object.values(globalCache.restaurants);
  return [returnRestaurants, setRestaurants];
};

export const useComments = (): [Comment[], (comments: Comment[]) => void] => {
  const globalState = useContext(GlobalStateContext);
  const [globalCache, setGlobalCache] = globalState!.globalCache;

  const setComments = (comments: Comment[]) => {
    let commentMap: Record<string, Comment> = {};
    
    for (const comment of comments) {
      commentMap[comment.id] = comment;
    }

    // Use set callbacks since we wish to set cache data sequentially
    // https://react.dev/learn/queueing-a-series-of-state-updates
    setGlobalCache((globalCacheLocal) => ({
      ...globalCacheLocal,
      comments: commentMap
    }));
  };

  const returnComments = Object.values(globalCache.comments);
  return [returnComments, setComments];
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