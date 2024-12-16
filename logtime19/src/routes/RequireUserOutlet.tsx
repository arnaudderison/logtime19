import { Outlet } from "react-router-dom";
import RequireAuth from "../auth/RequiredAuth";

function RequiredUserOutlet() {
  return (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  );
}

export default RequiredUserOutlet;