import { useEffect, useState } from "react";
import "./Customers.scss";

const CUSTOMERS_URL = "http://localhost:3000/customers";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatRegistrationDate(value) {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return dateFormatter.format(date);
}

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    let isCurrent = true;

    async function loadCustomers() {
      try {
        const response = await fetch(CUSTOMERS_URL);

        if (!response.ok) {
          throw new Error(`The server responded with status ${response.status}.`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("The customer data was not in the expected format.");
        }

        if (isCurrent) {
          setCustomers(data);
          setError("");
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(
            `Customers could not be loaded. ${requestError.message} Please check that JSON Server is running and try again.`,
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadCustomers();

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

  function handlePageSizeChange(event) {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  }

  const searchValue = searchTerm.trim().toLowerCase();
  const filteredCustomers = customers.filter((customer) => {
    const name = (customer.name || "").toLowerCase();
    const email = (customer.email || "").toLowerCase();

    return name.includes(searchValue) || email.includes(searchValue);
  });

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const displayedPage = totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
  const firstCustomerIndex = (displayedPage - 1) * pageSize;
  const pageCustomers = filteredCustomers.slice(
    firstCustomerIndex,
    firstCustomerIndex + pageSize,
  );
  const firstCustomerNumber =
    filteredCustomers.length === 0 ? 0 : firstCustomerIndex + 1;
  const lastCustomerNumber = Math.min(
    firstCustomerIndex + pageSize,
    filteredCustomers.length,
  );

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    } else if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <section className="customers" aria-labelledby="customers-title">
      <header className="customers__intro">
        <h2 className="customers__title" id="customers-title">Customers</h2>
        <p className="customers__description">
          Browse customer contact details and registration dates.
        </p>
      </header>

      {isLoading && (
        <p className="customers__message" role="status">
          Loading customers...
        </p>
      )}

      {!isLoading && error && (
        <div className="customers__message customers__message--error" role="alert">
          <p>{error}</p>
          <button className="customers__retry" type="button" onClick={handleRetry}>
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && customers.length === 0 && (
        <p className="customers__message">No customers found.</p>
      )}

      {!isLoading && !error && customers.length > 0 && (
        <>
          <div className="customers__controls">
            <div className="customers__control">
              <label className="customers__label" htmlFor="customer-search">
                Search customers
              </label>
              <input
                className="customers__input"
                id="customer-search"
                type="search"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <p className="customers__message">No matching customers found.</p>
          ) : (
            <>
              <div className="customers__table-wrapper">
                <table className="customers__table">
                  <caption className="customers__caption">Store customers</caption>
                  <thead>
                    <tr>
                      <th scope="col">Customer ID</th>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Registration Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td>{customer.id}</td>
                        <td>{customer.name || "Not provided"}</td>
                        <td>{customer.email || "Not provided"}</td>
                        <td>{customer.phone || "Not provided"}</td>
                        <td>{formatRegistrationDate(customer.registrationDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <nav className="customers__pagination" aria-label="Customer pagination">
                <p className="customers__range" aria-live="polite">
                  Showing {firstCustomerNumber}{"\u2013"}{lastCustomerNumber} of {filteredCustomers.length} customers
                </p>

                <div className="customers__pagination-actions">
                  <label
                    className="customers__page-size-label"
                    htmlFor="customers-page-size"
                  >
                    Customers per page
                  </label>
                  <select
                    className="customers__select customers__page-size"
                    id="customers-page-size"
                    value={pageSize}
                    onChange={handlePageSizeChange}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <button
                    className="customers__page-button"
                    type="button"
                    onClick={() => setCurrentPage(displayedPage - 1)}
                    disabled={displayedPage === 1}
                    aria-label="Previous customers page"
                  >
                    Previous
                  </button>
                  <span className="customers__page-indicator" aria-current="page">
                    Page {displayedPage} of {totalPages}
                  </span>
                  <button
                    className="customers__page-button"
                    type="button"
                    onClick={() => setCurrentPage(displayedPage + 1)}
                    disabled={displayedPage === totalPages}
                    aria-label="Next customers page"
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

export default Customers;
