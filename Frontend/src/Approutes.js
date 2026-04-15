import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OrderView from "./Views/Seller/OrderView";
import Signup from "./Views/Authentication/Signup";
import Login from "./Views/Authentication/Login";
import { Navigate } from 'react-router-dom';

function AppRoutes() {
    return (
        <Router>
            <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/orders" element={<OrderView />} />
            </Routes>
        </Router>
    );
}

export default AppRoutes;
