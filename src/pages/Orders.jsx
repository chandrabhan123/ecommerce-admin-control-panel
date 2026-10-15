import { useEffect, useState } from "react";
import "./Orders.scss";

const ORDERS_URL = "http://localhost:3000/orders";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    let isCurrent = true;

    async function loadOrders() {
      try {
        const response = await fetch(ORDERS_URL);

        if (!response.ok) {
          throw new Error(`The server responded with status ${response.status}.`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("The order data was not in the expected format.");
        }

        if (isCurrent) {
          setOrders(data);
          setError("");
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(
            `Orders could not be loaded. ${requestError.message} Please check that JSON Server is running and try again.`,
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isCurrent = false;
    };
  }, [retryCount]);

  function handleRetry() {
    setError("");
    setIsLoading(true);
    setRetryCount((count) => count + 1);
  }

  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }

  function handleStatusChange(event) {
    setSelectedStatus(event.target.value);
    setCurrentPage(1);
  }

  function handlePageSizeChange(event) {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  }

  const statuses = [...new Set(orders.map((order) => order.status))]
    .filter(Boolean)
    .sort((first, second) => first.localeCompare(second));

  const searchValue = searchTerm.trim().toLowerCase();
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchValue) ||
      order.customer.toLowerCase().includes(searchValue);
    const matchesStatus = !selectedStatus || order.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const displayedPage = totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
  const firstOrderIndex = (displayedPage - 1) * pageSize;
  const pageOrders = filteredOrders.slice(
    firstOrderIndex,
    firstOrderIndex + pageSize,
  );
  const firstOrderNumber = filteredOrders.length === 0 ? 0 : firstOrderIndex + 1;
  const lastOrderNumber = Math.min(
    firstOrderIndex + pageSize,
    filteredOrders.length,
  );

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    } else if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <section className="orders" aria-labelledby="orders-title">
      <header className="orders__intro">
        <h2 className="orders__title" id="orders-title">Orders</h2>
        <p className="orders__description">
          Review and find customer orders in your store.
        </p>
      </header>

      {isLoading && (
        <p className="orders__message" role="status">
          Loading orders...
        </p>
      )}

      {!isLoading && error && (
        <div className="orders__message orders__message--error" role="alert">
          <p>{error}</p>
          <button className="orders__retry" type="button" onClick={handleRetry}>
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && orders.length === 0 && (
        <p className="orders__message">No orders found.</p>
      )}

      {!isLoading && !error && orders.length > 0 && (
        <>
          <div className="orders__controls">
            <div className="orders__control">
              <label className="orders__label" htmlFor="order-search">
                Search orders
              </label>
              <input
                className="orders__input"
                id="order-search"
                type="search"
                placeholder="Search by order ID or customer"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            <div className="orders__control">
              <label className="orders__label" htmlFor="order-status">
                Status
              </label>
              <select
                className="orders__select"
                id="order-status"
                value={selectedStatus}
                onChange={handleStatusChange}
              >
                <option value="">All statuses</option>
                {statuses.map((status) => (
                  <option value={status} key={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <p className="orders__message">No matching orders found.</p>
          ) : (
            <>
              <div className="orders__table-wrapper">
                <table className="orders__table">
                  <caption className="orders__caption">Customer orders</caption>
                  <thead>
                    <tr>
                      <th scope="col">Order ID</th>
                      <th scope="col">Customer</th>
                      <th scope="col">Date</th>
                      <th scope="col">Total</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.customer}</td>
                        <td>{dateFormatter.format(new Date(order.date))}</td>
                        <td>{currencyFormatter.format(Number(order.total) || 0)}</td>
                        <td>
                          <span className="orders__status">{order.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <nav className="orders__pagination" aria-label="Order pagination">
                <p className="orders__range" aria-live="polite">
                  Showing {firstOrderNumber}{"\u2013"}{lastOrderNumber} of {filteredOrders.length} orders
                </p>

                <div className="orders__pagination-actions">
                  <label className="orders__page-size-label" htmlFor="orders-page-size">
                    Orders per page
                  </label>
                  <select
                    className="orders__select orders__page-size"
                    id="orders-page-size"
                    value={pageSize}
                    onChange={handlePageSizeChange}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <button
                    className="orders__page-button"
                    type="button"
                    onClick={() => setCurrentPage(displayedPage - 1)}
                    disabled={displayedPage === 1}
                    aria-label="Previous orders page"
                  >
                    Previous
                  </button>
                  <span className="orders__page-indicator" aria-current="page">
                    Page {displayedPage} of {totalPages}
                  </span>
                  <button
                    className="orders__page-button"
                    type="button"
                    onClick={() => setCurrentPage(displayedPage + 1)}
                    disabled={displayedPage === totalPages}
                    aria-label="Next orders page"
                  >
                    Next
                  </button>
                </div>
              </nav>
            </>
          )}
        </>
      )}
    </section>
  );
}

export default Orders;
