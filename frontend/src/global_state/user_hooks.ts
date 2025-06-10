import { useContext } from "react";
import { GlobalStateContext } from "./global_state";
import { getLoggedInUser } from "../api_data/client";
import type { User } from "../interface_data";

export const useFetchUser = () => {
  const setUserAuthState = useContext(GlobalStateContext)!.userAuthState[1];

  const fetchUser = async () => {
    const backendUserRaw = await getLoggedInUser();
    if (!backendUserRaw) {
        return;
    }

    const backendUser = backendUserRaw as User;

    setUserAuthState(backendUser);
  }

  return fetchUser;
};