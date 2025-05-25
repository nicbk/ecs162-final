import Home from './pages/home/Home';
import Layout from './components/Layout/Layout';
import { Routes, Route } from 'react-router-dom'
import Profile from './pages/profile/Profile';
import './global_styles/_global.scss';
export default function App() {
  return (
  <Routes>
    {/* for now temp we will have the login stuff here but we need to remove it after it is done */}
    <Route path="/Login" element={<div>dex stuff will be used here</div>} />
    <Route element={<Layout />}>
      <Route path="/Home"           element={<Home />} />
      <Route path="/Profile"       element={<Profile />} />
      <Route path="*" element={<div><strong>COMING SOON!!! FOR NOW WORKING ON HOMEPAGE</strong></div>} />
    </Route>
  </Routes>
  )
}