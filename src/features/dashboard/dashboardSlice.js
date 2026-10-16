import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const USERS_URL =
  "https://dummyjson.com/users?limit=200&select=id,firstName,lastName,email,image,phone,gender,address";
// The Dashboard and Orders page share this cached collection of sample carts.
const CARTS_URL = "https://dummyjson.com/carts?limit=200";

async function fetchCollection(url, collectionKey, label, signal) {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`The server responded with status ${response.status}.`);
  }

  const data = await response.json();

  if (!data || !Array.isArray(data[collectionKey])) {
    throw new Error(`DummyJSON returned ${label} data in an unexpected format.`);
  }

  return {
    items: data[collectionKey],
    total: Number.isFinite(data.total) ? data.total : data[collectionKey].length,
  };
}

export const fetchDashboardUsers = createAsyncThunk(
  "dashboard/fetchUsers",
  async (_, { rejectWithValue, signal }) => {
    try {
      return await fetchCollection(USERS_URL, "users", "user", signal);
    } catch (requestError) {
      return rejectWithValue(
        requestError.message || "An unexpected error occurred while loading customers.",
      );
    }
  },
  {
    condition: ({ force } = {}, { getState }) => {
      const { usersStatus } = getState().dashboard;
      return usersStatus !== "loading" && (force || usersStatus !== "succeeded");
    },
  },
);

export const fetchDashboardCarts = createAsyncThunk(
  "dashboard/fetchCarts",
  async (_, { rejectWithValue, signal }) => {
    try {
      return await fetchCollection(CARTS_URL, "carts", "cart", signal);
    } catch (requestError) {
      return rejectWithValue(
        requestError.message || "An unexpected error occurred while loading carts.",
      );
    }
  },
  {
    condition: ({ force } = {}, { getState }) => {
      const { cartsStatus } = getState().dashboard;
      return cartsStatus !== "loading" && (force || cartsStatus !== "succeeded");
    },
  },
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    users: [],
    usersTotal: null,
    usersStatus: "idle",
    usersError: null,
    carts: [],
    cartsTotal: null,
    cartsStatus: "idle",
    cartsError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardUsers.pending, (state) => {
        state.usersStatus = "loading";
        state.usersError = null;
      })
      .addCase(fetchDashboardUsers.fulfilled, (state, action) => {
        state.usersStatus = "succeeded";
        state.users = action.payload.items;
        state.usersTotal = action.payload.total;
      })
      .addCase(fetchDashboardUsers.rejected, (state, action) => {
        if (action.meta.condition) return;
        state.usersStatus = action.meta.aborted ? "idle" : "failed";
        state.usersError = action.payload || action.error.message;
      })
      .addCase(fetchDashboardCarts.pending, (state) => {
        state.cartsStatus = "loading";
        state.cartsError = null;
      })
      .addCase(fetchDashboardCarts.fulfilled, (state, action) => {
        state.cartsStatus = "succeeded";
        state.carts = action.payload.items;
        state.cartsTotal = action.payload.total;
      })
      .addCase(fetchDashboardCarts.rejected, (state, action) => {
        if (action.meta.condition) return;
        state.cartsStatus = action.meta.aborted ? "idle" : "failed";
        state.cartsError = action.payload || action.error.message;
      });
  },
});

export default dashboardSlice.reducer;
