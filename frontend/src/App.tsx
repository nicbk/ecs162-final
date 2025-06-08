import Home from './pages/home/Home';
import Layout from './components/Layout/Layout';
import { Routes, Route } from 'react-router-dom'
import Profile from './pages/profile/Profile';
import './global_styles/_global.scss';
import Threads from './pages/threads/Threads';
import { GlobalStateContext, type GPSCoordinatesNullable, type UserAuthState } from './global_state/global_state';
import { useState } from 'react';
import type { User } from './interface_data';
export default function App() {
  const userLocationState = useState<GPSCoordinatesNullable>(null);
  const userAuthState = useState<UserAuthState>(false);

  return (
    <GlobalStateContext value={{
      userLocationState,
      userAuthState
    }}>
      <Routes>
        {/* for now temp we will have the login stuff here but we need to remove it after it is done */}
        <Route path="/Login" element={<div>dex stuff will be used here</div>} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/Home"           element={<Home />} />
          <Route path="/Profile"       element={<Profile />} />
          <Route path="/threads/:commentId" element={<Threads />} />
          <Route path="404" element={<div><strong>COMING SOON!!! FOR NOW WORKING ON HOMEPAGE</strong></div>} />
        </Route>
      </Routes>
    </GlobalStateContext>
  );
}