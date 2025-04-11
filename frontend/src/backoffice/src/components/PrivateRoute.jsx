import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

const PrivateRoute = () => {
  //const { isAuthenticated } = useAuth();
  const isAuthenticated  = true;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;