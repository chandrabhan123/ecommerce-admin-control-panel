import { configureStore } from "@reduxjs/toolkit";
import dashboardReducer from "../features/dashboard/dashboardSlice";
import productsReducer from "../features/products/productsSlice";

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    products: productsReducer,
  },
});
