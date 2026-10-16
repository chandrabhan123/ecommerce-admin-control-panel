import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDashboardCarts,
  fetchDashboardUsers,
} from "../features/dashboard/dashboardSlice";
import "./Orders.scss";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const sortOptions = [
  { value: "id-desc", label: "Order ID: newest first" },
  { value: "id-asc", label: "Order ID: oldest first" },
  { value: "total-desc", label: "Cart total: high to low" },
  { value: "total-asc", label: "Cart total: low to high" },
];

function getCustomerName(user) {
  if (!user) return "";
  return [user.firstName, user.lastName]
    .filter((part) => typeof part === "string" && part.trim())
    .join(" ");
}

function getCartAmount(cart) {
  const value = cart?.discountedTotal ?? cart?.total;
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function getProductCount(cart) {
  if (cart?.totalProducts !== null && cart?.totalProducts !== undefined && cart?.totalProducts !== "" && Number.isFinite(Number(cart.totalProducts))) {
    return Number(cart.totalProducts);
  }
  return Array.isArray(cart?.products) ? cart.products.length : null;
}

function getOptionalNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatAmount(amount) {
  return amount === null ? "Amount unavailable" : currencyFormatter.format(amount);
}

function OrdersSkeleton() {
  return (
    <div className="orders__table-wrapper" aria-label="Loading simulated orders">
      <table className="orders__table">
        <caption className="orders__caption">Loading sample carts</caption>
        <thead>
          <tr>
            <th scope="col">Demo order ID</th>
            <th scope="col">Customer</th>
            <th scope="col">Products</th>
            <th scope="col">Simulated cart total</th>
            <th scope="col">Details</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }, (_, index) => (
            <tr key={index}>
              {Array.from({ length: 5 }, (_, cellIndex) => (
                <td key={cellIndex}><span className="orders__skeleton" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderDetails({ cart, customerName }) {
  const products = Array.isArray(cart.products) ? cart.products : [];

  return (
    <section className="orders__details" aria-labelledby="order-details-title">
      <div className="orders__details-heading">
        <div>
          <h3 className="orders__details-title" id="order-details-title">
            Cart #{cart.id} details
          </h3>
          <p className="orders__details-note">
            {customerName || `User ID ${cart.userId ?? "unavailable"}`} · Simulated cart data
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="orders__message">This cart has no product details available.</p>
      ) : (
        <div className="orders__table-wrapper orders__details-table-wrapper">
          <table className="orders__table orders__details-table">
            <caption className="orders__caption">Products in cart #{cart.id}</caption>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Quantity</th>
                <th scope="col">Unit price</th>
                <th scope="col">Discount</th>
                <th scope="col">Line total</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => {
                const unitPrice = getOptionalNumber(product.price);
                const quantity = getOptionalNumber(product.quantity);
                const discount = getOptionalNumber(product.discountPercentage);
                const lineTotal = getOptionalNumber(product.discountedTotal)
                  ?? getOptionalNumber(product.total);

                return (
                  <tr key={product.id ?? `${cart.id}-${index}`}>
                    <td>{product.title || "Product name unavailable"}</td>
                    <td>{quantity === null ? "Unavailable" : quantity}</td>
                    <td>{formatAmount(unitPrice)}</td>
                    <td>{discount === null ? "Unavailable" : `${discount}%`}</td>
                    <td>{formatAmount(lineTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="orders__details-note">
        Amounts are DummyJSON sample values formatted in INR for this demo; they are not converted prices or actual revenue.
      </p>
    </section>
  );
}

function Orders() {
  const dispatch = useDispatch();
  const { carts, cartsTotal, cartsStatus, cartsError, users, usersStatus, usersError } =
    useSelector((state) => state.dashboard);
  const isLoading = cartsStatus === "loading";
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("id-desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCartId, setSelectedCartId] = useState(null);

  useEffect(() => {
    // Both pages share the same Redux requests; loaded or pending data is reused.
    dispatch(fetchDashboardCarts());
    dispatch(fetchDashboardUsers());
  }, [dispatch]);

  const usersById = useMemo(
    () => new Map(users.map((user) => [String(user.id), user])),
    [users],
  );
  const searchValue = searchTerm.trim().toLowerCase();
  const sortedOrders = useMemo(() => carts
    .filter((cart) => {
      const customer = usersById.get(String(cart.userId));
      const customerName = getCustomerName(customer);
      const id = cart.id == null ? "" : String(cart.id);
      return id.toLowerCase().includes(searchValue) || customerName.toLowerCase().includes(searchValue);
    })
    .slice()
    .sort((first, second) => {
      if (sortBy.startsWith("total")) {
        const firstTotal = getCartAmount(first);
        const secondTotal = getCartAmount(second);
        if (firstTotal === null && secondTotal === null) return 0;
        if (firstTotal === null) return 1;
        if (secondTotal === null) return -1;
        return sortBy === "total-asc" ? firstTotal - secondTotal : secondTotal - firstTotal;
      }

      const result = Number(first.id) - Number(second.id);
      return sortBy === "id-asc" ? result : -result;
    }), [carts, searchValue, sortBy, usersById]);

  const totalPages = Math.ceil(sortedOrders.length / pageSize);
  const displayedPage = totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
  const firstOrderIndex = (displayedPage - 1) * pageSize;
  const pageOrders = sortedOrders.slice(firstOrderIndex, firstOrderIndex + pageSize);
  const firstOrderNumber = sortedOrders.length === 0 ? 0 : firstOrderIndex + 1;
  const lastOrderNumber = Math.min(firstOrderIndex + pageSize, sortedOrders.length);
  const selectedCart = carts.find((cart) => String(cart.id) === String(selectedCartId));
  const selectedCustomerName = getCustomerName(
    selectedCart ? usersById.get(String(selectedCart.userId)) : null,
  );

  function retryFailedRequests() {
    if (cartsStatus === "failed") dispatch(fetchDashboardCarts({ force: true }));
    if (usersStatus === "failed") dispatch(fetchDashboardUsers({ force: true }));
  }

  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }

  function handleSortChange(event) {
    setSortBy(event.target.value);
    setCurrentPage(1);
  }

  function handlePageSizeChange(event) {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  }

  return (
    <section className="orders" aria-labelledby="orders-title">
      <header className="orders__intro">
        <h2 className="orders__title" id="orders-title">Orders</h2>
        <p className="orders__description">
          Browse DummyJSON carts as simulated demo orders. Cart totals are sample values, not actual revenue; fulfillment statuses and order dates are not provided.
        </p>
        {cartsTotal != null && cartsStatus === "succeeded" && (
          <p className="orders__dataset-note">
            {carts.length} carts loaded from {cartsTotal} carts reported by the API.
          </p>
        )}
      </header>

      {(cartsError || usersStatus === "failed") && (
        <div className="orders__message orders__message--error" role="alert">
          <p>
            {cartsError && <>Simulated orders could not be loaded. {cartsError}</>}
            {usersStatus === "failed" && <> Customer details are unavailable. {usersError}</>}
          </p>
          <button className="orders__retry" type="button" onClick={retryFailedRequests} disabled={isLoading}>
            Try again
          </button>
        </div>
      )}

      {isLoading && carts.length === 0 && (
        <div role="status" aria-live="polite">
          <span className="orders__loading-label">Loading simulated orders...</span>
          <OrdersSkeleton />
        </div>
      )}
      {isLoading && carts.length > 0 && (
        <p className="orders__message" role="status">Refreshing cart data...</p>
      )}
      {cartsStatus === "succeeded" && carts.length === 0 && (
        <p className="orders__message">No sample carts were returned by the API.</p>
      )}

      {carts.length > 0 && (
        <>
          <div className="orders__controls">
            <div className="orders__control">
              <label className="orders__label" htmlFor="order-search">Search orders</label>
              <input
                className="orders__input"
                id="order-search"
                type="search"
                placeholder="Search by cart ID or customer name"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <div className="orders__control">
              <label className="orders__label" htmlFor="order-sort">Sort orders</label>
              <select className="orders__select" id="order-sort" value={sortBy} onChange={handleSortChange}>
                {sortOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          {sortedOrders.length === 0 ? (
            <p className="orders__message">No simulated orders match your search.</p>
          ) : (
            <>
              <div className="orders__table-wrapper">
                <table className="orders__table">
                  <caption className="orders__caption">DummyJSON carts used as demo orders</caption>
                  <thead>
                    <tr>
                      <th scope="col">Demo order ID</th>
                      <th scope="col">User ID</th>
                      <th scope="col">Customer</th>
                      <th scope="col">Products</th>
                      <th scope="col">Simulated cart total (INR)</th>
                      <th scope="col">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageOrders.map((cart) => {
                      const customer = usersById.get(String(cart.userId));
                      const customerName = getCustomerName(customer);
                      const count = getProductCount(cart);
                      const isSelected = String(selectedCartId) === String(cart.id);

                      return (
                        <tr key={cart.id}>
                          <td>Cart #{cart.id ?? "unavailable"}</td>
                          <td>{cart.userId ?? "Unavailable"}</td>
                          <td>{customerName || customer?.email || "Customer details unavailable"}</td>
                          <td>{count === null ? "Unavailable" : count}</td>
                          <td>{formatAmount(getCartAmount(cart))}</td>
                          <td>
                            <button
                              className="orders__detail-button"
                              type="button"
                              aria-expanded={isSelected}
                              aria-controls="order-details-title"
                              onClick={() => setSelectedCartId(isSelected ? null : cart.id)}
                            >
                              {isSelected ? "Hide details" : "View details"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <nav className="orders__pagination" aria-label="Order pagination">
                <p className="orders__range" aria-live="polite">
                  Showing {firstOrderNumber}–{lastOrderNumber} of {sortedOrders.length} loaded carts
                </p>
                <div className="orders__pagination-actions">
                  <label className="orders__page-size-label" htmlFor="orders-page-size">Carts per page</label>
                  <select className="orders__select orders__page-size" id="orders-page-size" value={pageSize} onChange={handlePageSizeChange}>
                    <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option>
                  </select>
                  <button className="orders__page-button" type="button" onClick={() => setCurrentPage(displayedPage - 1)} disabled={displayedPage === 1} aria-label="Previous orders page">Previous</button>
                  <span className="orders__page-indicator" aria-current="page">Page {displayedPage} of {totalPages}</span>
                  <button className="orders__page-button" type="button" onClick={() => setCurrentPage(displayedPage + 1)} disabled={displayedPage === totalPages} aria-label="Next orders page">Next</button>
                </div>
              </nav>
              {selectedCart && <OrderDetails cart={selectedCart} customerName={selectedCustomerName} />}
            </>
          )}
        </>
      )}
    </section>
  );
}

export default Orders;
