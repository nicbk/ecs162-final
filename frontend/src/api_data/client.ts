import type { Restaurant, Comment, User, InputComment } from '../interface_data/index.ts';
import { mockResturantsData, mockPublish } from './mock_data'

// Mock data retrieval so that frontend still works disconnected from server
export const getRestaurantsMock = (): Promise<Restaurant[]> => Promise.resolve(mockResturantsData)
export const getCommentsMock = (): Promise<Comment[]> => Promise.resolve(mockPublish)

const BASE = '/api/v1/';

async function fetchAPI<T>(paths: string): Promise<T> {
  const response = await fetch(`${BASE}${paths}`);

  //the T is the type of the data we are getting which for now is Restaurant[] or Publish[]
  return response.json() as T;
}

async function postAPI<T>(paths: string, body: any = null): Promise<T> {
  const response = await fetch(`${BASE}${paths}`, {
    method: 'POST',
    body: JSON.stringify(body)
  });

  return response.json() as T;
}

///////////////////////
// CREATE OPERATIONS //
///////////////////////

/*
 * Posts comment to a given resource
 * @param newComment content of the new comment to post
 * @param parentResourceId ID of the parent resource to post comment to
 * @returns does not return anything on success. On error, exception is thrown
 */
export const postComment = async (newComment: InputComment, parentResourceId: string) => {
  return await postAPI<any>(`comment/${parentResourceId}`, newComment);
};

/////////////////////
// READ OPERATIONS //
/////////////////////

/*
 * Gets all restaurants that are nearby the given coordinates
 * @param latitude latitude of GPS coordinates
 * @param longitude longitude of GPS coordinates
 * @param limit maximum number of restaurants to fetch
 * @param radius radius in meters to search within
 * @returns promise for when data is retrieved from backend
 */
export const getRestaurants = async (latitude: number, longitude: number, limit: number = 5, radius: number = 10000) => {
  const urlParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    limit: limit.toString(),
    radius: radius.toString()
  });

  return await fetchAPI<Restaurant[]>(`restaurants${urlParams}`);
};

/*
 * Gets the forest of comments associated with a given resource.
 * A resource is either a restaurant or a comment.
 * @param resourceId ID of a resource (restaurant or comment)
 * @returns promise for when data is retrieved from backend
 */
export const getResourceComments = async (resourceId: string) => {
  const urlParams = new URLSearchParams({ resourceId });
  
  return await fetchAPI<Comment[]>(`comments${urlParams}`);
}

/*
 * Gets the tree of replies for a given comment.
 * The root of the tree is the base comment itself.
 * @param commentId ID of a comment
 * @returns promise for when data is retrieved from backend
 */
export const getCommentTree = async (commentId: string) => {
  const urlParams = new URLSearchParams({ commentId });
  
  return await fetchAPI<Comment[]>(`comments${urlParams}`);
}

/*
 * Gets the currently logged in user
 * @returns boolean 'false' is returned if no user logged in. Otherwise, a User object is returned.
 */
export const getLoggedInUser = fetchAPI<User | boolean>('authed-user');

///////////////////////
// UPDATE OPERATIONS //
///////////////////////

/*
 * Updates user's bio
 * @param username username of user to update
 * @param bio new bio string for user
 * @returns does not return anything on success. On error, exception is thrown
 */
export const updateBio = async (username: string, bio: string) => {
  return await postAPI<any>(`user/${username}/bio`, {
    body: bio
  });
};

/*
 * Updates user's profile image
 * @param username username of user to update
 * @param profileImage base64-encoded data for profile image to upload
 * @returns does not return anything on success. On error, exception is thrown
 */
export const updateProfileImage = async (username: string, profileImage: string) => {
  return await postAPI<any>(`user/${username}/profile-image`, {
    profileImage
  });
};

/*
 * Adds a like to a comment
 * @param commentId ID of the comment to add a like to
 * @returns does not return anything on success. On error, exception is thrown
 */
export const addLike = async (commentId: string) => {
  return await postAPI<any>(`comment/${commentId}/add-like`);
};

/*
 * Remove a like from a comment
 * @param commentId ID of the comment to remove a like from
 * @returns does not return anything on success. On error, exception is thrown
 */
export const removeLike = async (commentId: string) => {
  return await postAPI<any>(`comment/${commentId}/remove-like`);
};
