import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OrderView from "./Views/Seller/OrderView";

function AppRoutes() {
    return (
        <Router>
            <Routes>
            <Route path="/" element={<OrderView />} />
            </Routes>
        </Router>
    );
}

export default AppRoutes;
