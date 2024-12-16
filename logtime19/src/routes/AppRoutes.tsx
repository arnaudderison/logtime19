import { Routes, Route } from 'react-router-dom';
import Login from '../auth/Login';
import Callback from '../auth/Callback';
import Home from '../home/Home';
import RequiredUserOutlet from './RequireUserOutlet';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/callback" element={<Callback />} />

      <Route path="" element={<RequiredUserOutlet />}>
        <Route path="/home" element={<Home />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;