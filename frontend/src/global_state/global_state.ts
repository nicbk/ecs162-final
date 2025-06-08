// I learn about using context for global state management from here: https://react.dev/learn/passing-data-deeply-with-context

import { createContext, type Dispatch, type SetStateAction } from "react";
import type { User } from "../interface_data";

export interface GPSCoordinates {
    latitude: number;
    longitude: number;
};

export type GPSCoordinatesNullable = GPSCoordinates | null;
export type UserAuthState = User | boolean;

export interface GlobalStateProps {
    userLocationState: [GPSCoordinatesNullable, Dispatch<SetStateAction<GPSCoordinatesNullable>>];
    userAuthState: [UserAuthState, Dispatch<SetStateAction<UserAuthState>>];
};

export const GlobalStateContext = createContext<GlobalStateProps | null>(null);