import type { Dispatch, SetStateAction } from "react";
import type { UserAuthState } from "../../global_state/global_state";
import { firebaseAuth } from "../../global_state/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, type User as FirebaseUser } from "firebase/auth";
import { FirebaseJWT, getLoggedInUser } from "../../api_data/client";
import type { User } from "../../interface_data";

// Our app supports google login only (every uc davis student has a google account)
const GoogleProvider = new GoogleAuthProvider();
// https://developers.google.com/identity/protocols/oauth2/scopes
// Get the email
GoogleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
// Get the profile info
GoogleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
// Get openid info
GoogleProvider.addScope('openid');

export const onLoginButtonPress = (
  setUserAuthenticationState: Dispatch<SetStateAction<UserAuthState>>
) => {
  // We don't call await; instead we set loading state and then the firebase event handler will set the final state
  signInWithPopup(firebaseAuth, GoogleProvider);
  setUserAuthenticationState('loading');
}

export const onLogoutButtonPress = (
  setUserAuthenticationState: Dispatch<SetStateAction<UserAuthState>>
) => {
  // We don't call await; instead we set loading state and then the firebase event handler will set the final state
  signOut(firebaseAuth);
  setUserAuthenticationState('loading');
}

export const initFirebaseHandler = (
  setUserAuthenticationState: Dispatch<SetStateAction<UserAuthState>>
) => {
  const statusHandler = (user: FirebaseUser | null) => {
    if (user) {
      (async () => {
        // NOTE: Here we need to also make the call to the Flask backend to get the rest of the user info from MongoDB
        // In this if statement clause we know that we have signed into Firebase.
        FirebaseJWT.jwt = (await user.getIdTokenResult()).token
        const backendUserRaw = await getLoggedInUser();
        if (!backendUserRaw) {
          signOut(firebaseAuth);
          return;
        }

        const backendUser = backendUserRaw as User;

        setUserAuthenticationState(backendUser);
      })();
    } else {
      setUserAuthenticationState('not-logged-in');
      FirebaseJWT.jwt = null;
    }
  };

  // Register handler if auth state change detected
  firebaseAuth.onAuthStateChanged((user) => {
    statusHandler(user);
  });
};