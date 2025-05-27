import type { Restaurant, Comment } from '../interface_data/index.ts';

//mock data for now
const BASE = '/api/v1';

//not yet called but I will after the intial setup and checking the mock data
//for now we just gonna use the mock data using the generic function
async function fetchAPI<T>(paths: string): Promise<T> {

  const response = await fetch(`${BASE}${paths}`);

  //the T is the type of the data we are getting which for now is Restaurant[] or Publish[]
  return response.json() as T;

}

export const getRestaurants = () => fetchAPI<Restaurant[]>('/restaurant');
export const getPublishes  = () => fetchAPI<Comment[]>('/Comment')