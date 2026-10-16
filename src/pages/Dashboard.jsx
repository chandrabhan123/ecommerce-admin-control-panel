import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDashboardCarts,
  fetchDashboardUsers,
} from "../features/dashboard/dashboardSlice";
import { fetchProducts } from "../features/products/productsSlice";

const LOW_STOCK_THRESHOLD = 10;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function getValidNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getMetricValue(status, total) {
  if (status === "loading" && total == null) return "Loading...";
  if (status === "failed" && total == null) return "Unavailable";
  return total ?? "Not available";
}

function Dashboard() {
  const dispatch = useDispatch();
  const {
    items: products,
    total: productsTotal,
    status: productStatus,
    error: productError,
  } = useSelector((state) => state.products);
  const {
    users,
    usersTotal,
    usersStatus,
    usersError,
    carts,
    cartsTotal,
    cartsStatus,
    cartsError,
  } = useSelector((state) => state.dashboard);

  useEffect(() => {
    // Both thunks skip requests when their Redux data is already loaded or loading.
    dispatch(fetchProducts());
    dispatch(fetchDashboardUsers());
    dispatch(fetchDashboardCarts());
  }, [dispatch]);

  function handleRetry() {
    if (productStatus !== "loading" && productStatus !== "succeeded") {
      dispatch(fetchProducts({ force: true }));
    }
    if (usersStatus !== "loading" && usersStatus !== "succeeded") {
      dispatch(fetchDashboardUsers({ force: true }));
    }
    if (cartsStatus !== "loading" && cartsStatus !== "succeeded") {
      dispatch(fetchDashboardCarts({ force: true }));
    }
  }

  const productRatings = products
    .map((product) => getValidNumber(product.rating))
    .filter((rating) => rating !== null && rating >= 0);
  const averageRating = productRatings.length > 0
    ? productRatings.reduce((sum, rating) => sum + rating, 0) / productRatings.length
    : null;
  const usersById = new Map(users.map((user) => [String(user.id), user]));
  const productMetricTotal = productStatus === "succeeded" || products.length > 0
    ? productsTotal ?? products.length
    : null;
  const lowStockProducts = products
    .filter((product) => {
      const stock = getValidNumber(product.stock);
      return stock !== null && stock >= 0 && stock <= LOW_STOCK_THRESHOLD;
    })
    .sort((first, second) => Number(first.stock) - Number(second.stock));

  const errors = [
    productError && `Products could not be loaded. ${productError}`,
    usersError && `Customers could not be loaded. ${usersError}`,
    cartsError && `Simulated orders could not be loaded. ${cartsError}`,
  ].filter(Boolean);

  const summaryCards = [
    {
      title: "Total Products",
      value: getMetricValue(productStatus, productMetricTotal),
      note: `${products.length} product records currently loaded`,
    },
    {
      title: "Total Customers",
      value: getMetricValue(usersStatus, usersTotal),
      note: "Total users reported by DummyJSON",
    },
    {
      title: "Total Simulated Orders",
      value: getMetricValue(cartsStatus, cartsTotal),
      note: "DummyJSON carts are sample order data",
    },
    {
      title: "Average Product Rating",
      value: productStatus === "loading" && products.length === 0
        ? "Loading..."
        : productStatus === "failed" && products.length === 0
          ? "Unavailable"
          : averageRating === null
            ? "Not available"
            : `${averageRating.toFixed(1)} / 5`,
      note: `Calculated from ${productRatings.length} rated loaded products`,
    },
  ];

  return (
    <>
      <section className="welcome" aria-labelledby="welcome-title">
        <h2 className="welcome__title" id="welcome-title">
          Welcome to your dashboard
        </h2>
        <p className="welcome__description">
          A snapshot of your DummyJSON product catalog and sample cart activity.
        </p>
      </section>

      <section className="summary dashboard-summary" aria-label="Store summary">
        {summaryCards.map((card) => (
          <article className="summary__card" key={card.title}>
            <h3 className="summary__title">{card.title}</h3>
            <p
              className="summary__value"
              role={card.value === "Loading..." ? "status" : undefined}
            >
              {card.value}
            </p>
            <p className="summary__note">{card.note}</p>
          </article>
        ))}
      </section>

      {errors.length > 0 && (
        <div className="summary__error" role="alert">
          <div>
            {errors.map((message) => <p key={message}>{message}</p>)}
          </div>
          <button className="summary__retry" type="button" onClick={handleRetry}>
            Retry failed requests
          </button>
        </div>
      )}

      <section className="dashboard-details" aria-label="Cart activity and inventory">
        <article className="dashboard-panel">
          <h2 className="dashboard-panel__title">Recent Simulated Orders</h2>
          <p className="dashboard-panel__note">
            Highest cart IDs are shown first. DummyJSON carts do not include an order date.
          </p>
          {cartsStatus === "loading" && <p role="status">Loading carts...</p>}
          {cartsStatus === "failed" && <p>Cart activity is unavailable. Use the retry button above.</p>}
          {cartsStatus === "succeeded" && carts.length === 0 && (
            <p>No simulated carts are available.</p>
          )}
          {cartsStatus === "succeeded" && carts.length > 0 && (
            <ul className="dashboard-list">
              {carts
                .slice()
                .sort((first, second) => Number(second.id) - Number(first.id))
                .slice(0, 5)
                .map((cart) => {
                  const customer = usersById.get(String(cart.userId));
                  const customerName = customer
                    ? [customer.firstName, customer.lastName].filter(Boolean).join(" ")
                    : "";
                  const productCount = Number.isFinite(Number(cart.totalProducts))
                    ? Number(cart.totalProducts)
                    : Array.isArray(cart.products)
                      ? cart.products.length
                      : null;
                  const total = getValidNumber(cart.discountedTotal)
                    ?? getValidNumber(cart.total);

                  return (
                    <li className="dashboard-list__item dashboard-list__item--order" key={cart.id}>
                      <div className="dashboard-order__identity">
                        <strong>{cart.id != null ? `Cart #${cart.id}` : "Cart ID unavailable"}</strong>
                        <span>{customerName || (customer?.email ?? (cart.userId != null ? `Customer #${cart.userId}` : "Customer information unavailable"))}</span>
                      </div>
                      <span>{productCount === null ? "Product count unavailable" : `${productCount} products`}</span>
                      <strong>{total === null ? "Amount unavailable" : currencyFormatter.format(total)}</strong>
                    </li>
                  );
                })}
            </ul>
          )}
          <p className="dashboard-panel__note">
            Sample cart amounts use INR formatting only; they are not business revenue or converted currency values.
          </p>
        </article>

        <article className="dashboard-panel">
          <h2 className="dashboard-panel__title">Low Stock Products</h2>
          <p className="dashboard-panel__note">
            Stock at or below {LOW_STOCK_THRESHOLD} units
          </p>
          {productStatus === "loading" && products.length === 0 && <p role="status">Loading products...</p>}
          {productStatus === "failed" && products.length === 0 && <p>Inventory is unavailable. Use the retry button above.</p>}
          {productStatus === "succeeded" && products.length === 0 && <p>No products are in the catalog.</p>}
          {products.length > 0 && lowStockProducts.length === 0 && (
            <p>No products are at or below the low-stock threshold.</p>
          )}
          {lowStockProducts.length > 0 && (
            <ul className="dashboard-list">
              {lowStockProducts.map((product) => (
                <li className="dashboard-list__item" key={product.id}>
                  <div className="dashboard-order__identity">
                    {product.thumbnail && (
                      <img src={product.thumbnail} alt="" loading="lazy" />
                    )}
                    <strong>{product.title || "Untitled product"}</strong>
                  </div>
                  <span>{product.stock} in stock</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </>
  );
}

export default Dashboard;
