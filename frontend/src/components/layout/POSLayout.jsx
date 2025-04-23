import { Outlet } from "react-router-dom";

function POSLayout() {
    return (
        <div className="min-h-screen w-full bg-white">
            <Outlet />
        </div>
    );
}

export default POSLayout;
