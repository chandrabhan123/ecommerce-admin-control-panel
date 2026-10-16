import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import productsReducer from "../features/products/productsSlice";
import Products from "./Products";

const sampleProducts = [
  {
    id: 101,
    title: "Aurora Phone",
    price: 899,
    category: "smartphones",
    rating: 4.5,
    stock: 12,
    thumbnail: "https://example.test/phone.jpg",
  },
  {
    id: 102,
    title: "Canvas Tote",
    price: 24,
    category: "womens-bags",
    rating: 4.1,
    stock: 4,
    thumbnail: "",
  },
];

function renderProducts(overrides = {}) {
  const initialState = productsReducer(undefined, { type: "test/init" });
  const store = configureStore({
    reducer: { products: productsReducer },
    preloadedState: {
      products: {
        ...initialState,
        items: sampleProducts,
        total: sampleProducts.length,
        status: "succeeded",
        ...overrides,
      },
    },
  });

  render(
    <Provider store={store}>
      <MemoryRouter>
        <Products />
      </MemoryRouter>
    </Provider>,
  );

  return store;
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Products page", () => {
  it("renders product data and image fallbacks accessibly", () => {
    renderProducts();

    const productsTable = screen.getByRole("table", { name: /products in your store/i });
    expect(within(productsTable).getByRole("row", { name: /Aurora Phone/ })).toBeInTheDocument();
    expect(within(productsTable).getByRole("img", { name: "Aurora Phone" })).toBeInTheDocument();
    expect(within(productsTable).getByRole("img", { name: /product image unavailable/i })).toBeInTheDocument();
    expect(within(productsTable).getByText("Smartphones")).toBeInTheDocument();
    expect(within(productsTable).getByRole("link", { name: "Edit Aurora Phone" })).toHaveAttribute(
      "href",
      "/products/101/edit",
    );
  });

  it("shows a loading skeleton while products are loading", () => {
    renderProducts({ status: "loading", items: [], total: 0 });

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /loading product catalog/i })).toBeInTheDocument();
  });

  it("shows an error and retries the product request", async () => {
    fetch
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: [], total: 0, skip: 0, limit: 200 }),
      });
    renderProducts({ status: "idle", items: [], total: 0, error: null });

    expect(await screen.findByRole("alert")).toHaveTextContent("status 503");
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      "https://dummyjson.com/products?limit=200",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    ));
    expect(await screen.findByText("No products found.")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("searches by title and filters by category", () => {
    renderProducts();

    fireEvent.change(screen.getByRole("searchbox", { name: /search products/i }), {
      target: { value: "phone" },
    });
    expect(screen.getByRole("row", { name: /Aurora Phone/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Canvas Tote/ })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "womens-bags" },
    });
    expect(screen.getByText("No matching products found.")).toBeInTheDocument();
  });

  it("confirms and removes a product after a successful delete request", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fetch.mockResolvedValue({ ok: true, json: async () => ({ isDeleted: true }) });
    const store = renderProducts();

    fireEvent.click(screen.getByRole("button", { name: "Delete Aurora Phone" }));

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete "Aurora Phone"?');
    await waitFor(() => expect(store.getState().products.items).toHaveLength(1));
    expect(screen.getByRole("status")).toHaveTextContent(/removed for this session/i);
    expect(fetch).toHaveBeenCalledWith(
      "https://dummyjson.com/products/101",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
