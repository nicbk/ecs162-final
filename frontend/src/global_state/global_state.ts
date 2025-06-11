// I learn about using context for global state management from here: https://react.dev/learn/passing-data-deeply-with-context

import { createContext, type Dispatch, type SetStateAction } from "react";
import type { Restaurant, User, Comment } from "../interface_data";

export const UUID_LENGTH = 36;

export interface GPSCoordinates {
    latitude: number;
    longitude: number;
};

export interface LazyLoadOffset {
    offsetX: -1 | 0 | 1,
    offsetY: -1 | 0 | 1 | 2
};

export interface GlobalCache {
    restaurants: Record<string, Restaurant>;
    comments: Record<string, Comment>;
    wishList: string[];
    selectedRestaurantId?: string; // Optional, used to store the currently selected restaurant ID
};

export type GPSCoordinatesNullable = GPSCoordinates | null;
export type UserAuthState = User | 'not-logged-in' | 'loading';

export interface GlobalStateProps {
    userLocationState: [GPSCoordinatesNullable, Dispatch<SetStateAction<GPSCoordinatesNullable>>];
    userAuthState: [UserAuthState, Dispatch<SetStateAction<UserAuthState>>];
    globalCache: [GlobalCache, Dispatch<SetStateAction<GlobalCache>>];
    lazyLoadOffset: [LazyLoadOffset, Dispatch<SetStateAction<LazyLoadOffset>>];
};

export const GlobalStateContext = createContext<GlobalStateProps | null>(null);