import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../backoffice/src/providers/AuthProvider';
import PropTypes from 'prop-types';

/**
 * Composant de route accessible uniquement aux utilisateurs non authentifiés
 * Redirige vers le dashboard admin si l'utilisateur est déjà connecté
 */
const PublicOnlyRoute = ({ redirectPath = '/admin/dashboard' }) => {
  //const { isAuthenticated } = useAuth();
  const  isAuthenticated  = false;

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

PublicOnlyRoute.propTypes = {
  redirectPath: PropTypes.string
};

export default PublicOnlyRoute;