import Home from './pages/home/Home';
import Restaurant from './pages/restaurant/Restaurant';
import Layout from './components/Layout/Layout';
import { Routes, Route } from 'react-router-dom'
import Profile from './pages/profile/Profile';
import './global_styles/_global.scss';
import Threads from './pages/threads/Threads';
import { GlobalStateContext, type UserAuthState, type GPSCoordinatesNullable, type GlobalCache, type LazyLoadOffset } from './global_state/global_state';
import { useState } from 'react';
import SocialMedia from './pages/social_media/SocialMedia';

export default function App() {
  const userLocationState = useState<GPSCoordinatesNullable>(null);
  const userAuthState = useState<UserAuthState>('not-logged-in');
  const globalCache = useState<GlobalCache>({
    restaurants: {},
    comments: {},
    wishList: []
  });
  const lazyLoadOffset = useState<LazyLoadOffset>({
    offsetX: -1,
    offsetY: -1
  });

  return (
    <GlobalStateContext value={{
      userLocationState,
      userAuthState,
      globalCache,
      lazyLoadOffset
    }}>
      <Routes>
        <Route path="/Login" element={<div>dex stuff will be used here</div>} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/Home"           element={<Home />} />
          <Route path="/Profile"       element={<Profile />} />
          <Route path="/SocialMedia" element={<SocialMedia/>} />
          <Route path="/threads/:commentId" element={<Threads />} />
          <Route path="/Home/:restaurantId?" element={<Home />} />
          <Route path="/Restaurant/" element={<Restaurant />} />
          <Route path="404" element={<div><strong>COMING SOON!!! FOR NOW WORKING ON HOMEPAGE</strong></div>} />
        </Route>
      </Routes>
    </GlobalStateContext>
  );
}