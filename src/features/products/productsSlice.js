import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const PRODUCTS_URL = "http://localhost:3000/products";

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (_, { rejectWithValue, signal }) => {
    try {
      const response = await fetch(PRODUCTS_URL, { signal });

      if (!response.ok) {
        return rejectWithValue(
          `The server responded with status ${response.status}.`,
        );
      }

      const products = await response.json();

      if (!Array.isArray(products)) {
        return rejectWithValue("The product data was not in the expected format.");
      }

      return products;
    } catch (requestError) {
      return rejectWithValue(
        requestError.message || "An unexpected error occurred while loading products.",
      );
    }
  },
  {
    condition: ({ force } = {}, { getState }) => {
      const { status } = getState().products;

      if (status === "loading") {
        return false;
      }

      return force || status !== "succeeded";
    },
  },
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {
    removeProduct(state, action) {
      state.items = state.items.filter((product) => product.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        if (action.meta.aborted) {
          state.status = "idle";
          return;
        }

        state.status = "failed";
        state.error =
          action.payload || action.error.message || "Unable to load products.";
      });
  },
});

export const { removeProduct } = productsSlice.actions;
export default productsSlice.reducer;
