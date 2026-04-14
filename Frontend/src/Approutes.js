import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OrderView from "./Views/Seller/OrderView";
import Signup from "./Views/Authentication/Signup";
import Login from "./Views/Authentication/Login";

function AppRoutes() {
    return (
        <Router>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/orders" element={<OrderView />} />
            </Routes>
        </Router>
    );
}

export default AppRoutes;
