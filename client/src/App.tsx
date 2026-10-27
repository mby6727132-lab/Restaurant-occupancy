import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import CreateRestaurant from "./pages/CreateRestaurant";
import MainLayout from "./layouts/MainLayout";
import IsRestaurant from "./pages/IsRestaurant";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/myRestaurants/new" element={<CreateRestaurant />} />
          <Route path="*" element={<Navigate to="/register" />} />
          <Route path="/home/:id" element={<IsRestaurant />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}