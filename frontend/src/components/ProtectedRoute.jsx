import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/NewAuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";

const ProtectedRoute = ({ roles, adminOnly }) => {
    const { user, loading, isAdmin } = useAuth();
    const location = useLocation();

    if (loading) return <LoadingSpinner />;

    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

    if (adminOnly && !isAdmin()) {
        return <Navigate to="/unauthorized" replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
