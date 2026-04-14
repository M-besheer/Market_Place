import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import OrderView from "./Views/Seller/OrderView";

function AppRoutes() {
    return (
        <Router>
            <Routes>

            {/* This is temporary until we add authentication and a real dashboard. */}
            {/* 1. If user hits "/", automatically send them to "/orders" */}
            <Route path="/" element={<Navigate to="/orders" replace />} />
            {/* 2. Define the orders route */}
            <Route path="/orders" element={<OrderView />} />

            </Routes>
        </Router>
    );
}

export default AppRoutes;
