// I learn about using context for global state management from here: https://react.dev/learn/passing-data-deeply-with-context

import { createContext, type Dispatch, type SetStateAction } from "react";
import type { Restaurant, User, Comment } from "../interface_data";

export interface GPSCoordinates {
    latitude: number;
    longitude: number;
};

export interface GlobalCache {
    restaurants: Record<string, Restaurant>;
    comments: Record<string, Comment>;
};

export type GPSCoordinatesNullable = GPSCoordinates | null;
export type UserAuthState = User | 'not-logged-in' | 'loading';

export interface GlobalStateProps {
    userLocationState: [GPSCoordinatesNullable, Dispatch<SetStateAction<GPSCoordinatesNullable>>];
    userAuthState: [UserAuthState, Dispatch<SetStateAction<UserAuthState>>];
    globalCache: [GlobalCache, Dispatch<SetStateAction<GlobalCache>>];
};

export const GlobalStateContext = createContext<GlobalStateProps | null>(null);