import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const PRODUCTS_URL = "https://dummyjson.com/products";
const PRODUCTS_LIST_URL = `${PRODUCTS_URL}?limit=200`;

async function readProductResponse(response, action) {
  if (!response.ok) {
    return {
      error: `Could not ${action} the product. The server responded with status ${response.status}.`,
    };
  }

  try {
    const product = await response.json();

    if (!product || typeof product !== "object" || product.id == null) {
      return { error: "DummyJSON returned product data in an unexpected format." };
    }

    return { product };
  } catch {
    return { error: "DummyJSON returned invalid product data." };
  }
}

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (_, { rejectWithValue, signal }) => {
    try {
      const response = await fetch(PRODUCTS_LIST_URL, { signal });

      if (!response.ok) {
        return rejectWithValue(
          `The server responded with status ${response.status}.`,
        );
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.products)) {
        return rejectWithValue(
          "DummyJSON product data was not in the expected format.",
        );
      }

      return {
        products: data.products,
        total: Number.isFinite(data.total) ? data.total : data.products.length,
        skip: Number.isFinite(data.skip) ? data.skip : 0,
        limit: Number.isFinite(data.limit) ? data.limit : data.products.length,
      };
    } catch (requestError) {
      return rejectWithValue(
        requestError.message || "An unexpected error occurred while loading products.",
      );
    }
  },
  {
    condition: ({ force } = {}, { getState }) => {
      const { status } = getState().products;

      if (status === "loading") return false;
      return force || status !== "succeeded";
    },
  },
);

// DummyJSON returns a created product, but does not permanently save it.
export const addProduct = createAsyncThunk(
  "products/addProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${PRODUCTS_URL}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      const result = await readProductResponse(response, "add");
      return result.error ? rejectWithValue(result.error) : result.product;
    } catch (requestError) {
      return rejectWithValue(
        requestError.message || "An unexpected error occurred while adding the product.",
      );
    }
  },
  {
    condition: (_, { getState }) => getState().products.addStatus !== "loading",
  },
);

// Merge PATCH's response with the current row because only changed fields may be returned.
export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, ...productData }, { getState, rejectWithValue }) => {
    try {
      const response = await fetch(`${PRODUCTS_URL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      const result = await readProductResponse(response, "update");

      if (result.error) return rejectWithValue(result.error);

      const existingProduct = getState().products.items.find(
        (product) => String(product.id) === String(id),
      );

      return { ...existingProduct, ...result.product };
    } catch (requestError) {
      return rejectWithValue(
        requestError.message || "An unexpected error occurred while updating the product.",
      );
    }
  },
  {
    condition: (_, { getState }) => getState().products.updateStatus !== "loading",
  },
);

// DummyJSON marks a product as deleted in its response; Redux removes it for this session.
export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      const response = await fetch(`${PRODUCTS_URL}/${id}`, { method: "DELETE" });

      if (!response.ok) {
        return rejectWithValue(
          `Could not delete the product. The server responded with status ${response.status}.`,
        );
      }

      return id;
    } catch (requestError) {
      return rejectWithValue(
        requestError.message || "An unexpected error occurred while deleting the product.",
      );
    }
  },
  {
    condition: (_, { getState }) => getState().products.deleteStatus !== "loading",
  },
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    total: 0,
    skip: 0,
    limit: 0,
    itemsVersion: 0,
    fetchStartedAtVersion: 0,
    status: "idle",
    error: null,
    addStatus: "idle",
    addError: null,
    updateStatus: "idle",
    updateError: null,
    deleteStatus: "idle",
    deleteError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.fetchStartedAtVersion = state.itemsVersion;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        // An older fetch must not overwrite products changed while it was running.
        if (state.fetchStartedAtVersion === state.itemsVersion) {
          state.items = action.payload.products;
          state.total = action.payload.total;
          state.skip = action.payload.skip;
          state.limit = action.payload.limit;
        }
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
      })
      .addCase(addProduct.pending, (state) => {
        state.addStatus = "loading";
        state.addError = null;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.addStatus = "succeeded";
        state.items.unshift(action.payload);
        state.total += 1;
        state.itemsVersion += 1;
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.addStatus = "failed";
        state.addError = action.payload || action.error.message;
      })
      .addCase(updateProduct.pending, (state) => {
        state.updateStatus = "loading";
        state.updateError = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.updateStatus = "succeeded";
        const index = state.items.findIndex(
          (product) => String(product.id) === String(action.payload.id),
        );

        if (index !== -1) state.items[index] = action.payload;
        state.itemsVersion += 1;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.updateError = action.payload || action.error.message;
      })
      .addCase(deleteProduct.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.items = state.items.filter(
          (product) => String(product.id) !== String(action.payload),
        );
        state.total = Math.max(0, state.total - 1);
        state.itemsVersion += 1;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload || action.error.message;
      });
  },
});

export default productsSlice.reducer;
