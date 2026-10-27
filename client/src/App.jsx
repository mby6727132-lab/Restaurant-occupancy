import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ResDetails from "./pages/ResDetails";
import CreateRestaurant from "./pages/CreateRestaurant";
import EditTables from "./pages/EditTables";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/myRestaurants/new" element={<CreateRestaurant />} />
        <Route path="/myRestaurants/new" element={<ResDetails />} />
         <Route path="/myRestaurants/new" element={<EditTables />} />

        <Route path="*" element={<Navigate to="/register" />} />
      </Routes>
    </BrowserRouter>
  );
}