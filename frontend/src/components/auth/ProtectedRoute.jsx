import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/NewAuthContext";
import LoadingSpinner from "../common/LoadingSpinner";

const ProtectedRoute = ({ roles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
