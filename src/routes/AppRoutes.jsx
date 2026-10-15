import { Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import Orders from "../pages/Orders";
import Customers from "../pages/Customers";
import AddProduct from "../pages/AddProduct";
import EditProduct from "../pages/EditProduct";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/add" element={<AddProduct />} />
      <Route path="/products/:productId/edit" element={<EditProduct />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/customers" element={<Customers />} />
    </Routes>
  );
}

export default AppRoutes;
