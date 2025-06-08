import type { Dispatch, SetStateAction } from "react";
import type { UserAuthenticationState } from "../../global_state/global_state";
import { firebaseAuth } from "../../global_state/firebase";
import { getRedirectResult, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, type User as FirebaseUser } from "firebase/auth";

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
  setUserAuthenticationState: Dispatch<SetStateAction<UserAuthenticationState>>
) => {
  // We don't call await; instead we set loading state and then the firebase event handler will set the final state
  signInWithPopup(firebaseAuth, GoogleProvider);
  setUserAuthenticationState('loading');
}

export const onLogoutButtonPress = (
  setUserAuthenticationState: Dispatch<SetStateAction<UserAuthenticationState>>
) => {
  // We don't call await; instead we set loading state and then the firebase event handler will set the final state
  signOut(firebaseAuth);
  setUserAuthenticationState('loading');
}

export const initFirebaseHandler = (
  setUserAuthenticationState: Dispatch<SetStateAction<UserAuthenticationState>>
) => {
  const statusHandler = (user: FirebaseUser | null) => {
    if (user) {
      // NOTE: Here we need to also make the call to the Flask backend to get the rest of the user info from MongoDB
      // In this if statement clause we know that we have signed into Firebase.
      setUserAuthenticationState({
        // EXAMPLE DATA instead of mongodb data, but the rest of the user info is the same.
        // Given only the Google login method, we assume either display name or email is available for username.
        // In the backend, we should use the Firebase ID to identify users.
        //    So, replace the Dex OAuth ID field with Firebase ID instead.
        username: user.displayName || user.email!,
        profileImage: user.photoURL!,
        bio: 'Test Bio',
        comments: []
      });
    } else {
      setUserAuthenticationState('not-logged-in');
    }
  };

  // Register handler if auth state change detected
  firebaseAuth.onAuthStateChanged((user) => {
    statusHandler(user);
  });

  // Register handler for when redirect to application occurs
  /*
  getRedirectResult(firebaseAuth)
    .then(user => {
      console.log(user)
      if (user) {
        statusHandler(user.user!)
      }
    });
  */
};