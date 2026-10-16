import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardUsers } from "../features/dashboard/dashboardSlice";
import "./Customers.scss";

const sortOptions = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
];

function getCustomerName(customer) {
  return [customer.firstName, customer.lastName]
    .filter((part) => typeof part === "string" && part.trim())
    .join(" ");
}

function getCustomerAddress(address) {
  if (!address || typeof address !== "object") return "Address not provided";

  const parts = [
    address.address,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter((part) => typeof part === "string" && part.trim());

  return parts.length > 0 ? parts.join(", ") : "Address not provided";
}

function getInitials(customer) {
  const initials = [customer.firstName, customer.lastName]
    .filter((part) => typeof part === "string" && part.trim())
    .map((part) => part.trim().charAt(0));

  return initials.join("").toUpperCase() || "?";
}

function CustomerAvatar({ customer }) {
  const [hasImageError, setHasImageError] = useState(false);

  if (!customer.image || hasImageError) {
    return (
      <span className="customers__avatar customers__avatar--fallback" role="img" aria-label={`Avatar unavailable for ${getCustomerName(customer) || "customer"}`}>
        {getInitials(customer)}
      </span>
    );
  }

  return (
    <img
      className="customers__avatar"
      src={customer.image}
      alt=""
      loading="lazy"
      onError={() => setHasImageError(true)}
    />
  );
}

function CustomerSkeleton() {
  return (
    <div className="customers__table-wrapper" aria-label="Loading customer profiles">
      <table className="customers__table">
        <caption className="customers__caption">Loading customer profiles</caption>
        <thead>
          <tr>
            <th scope="col">Avatar</th>
            <th scope="col">Customer</th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col">Gender</th>
            <th scope="col">Address</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }, (_, index) => (
            <tr key={index}>
              {Array.from({ length: 6 }, (_, cellIndex) => (
                <td key={cellIndex}>
                  <span className="customers__skeleton" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Customers() {
  const dispatch = useDispatch();
  const { users: customers, usersTotal, usersStatus, usersError } = useSelector(
    (state) => state.dashboard,
  );
  const isLoading = usersStatus === "loading";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedSort, setSelectedSort] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    // Dashboard and Customers share this thunk and cached users in Redux.
    dispatch(fetchDashboardUsers());
  }, [dispatch]);

  function handleRetry() {
    dispatch(fetchDashboardUsers({ force: true }));
  }

  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }

  function handleGenderChange(event) {
    setSelectedGender(event.target.value);
    setCurrentPage(1);
  }

  function handleSortChange(event) {
    setSelectedSort(event.target.value);
    setCurrentPage(1);
  }

  function handlePageSizeChange(event) {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  }

  const genders = [...new Set(
    customers
      .map((customer) => customer.gender)
      .filter((gender) => typeof gender === "string" && gender.trim()),
  )].sort((first, second) => first.localeCompare(second));
  const searchValue = searchTerm.trim().toLowerCase();

  const filteredCustomers = customers
    .filter((customer) => {
      const firstName = typeof customer.firstName === "string" ? customer.firstName : "";
      const lastName = typeof customer.lastName === "string" ? customer.lastName : "";
      const fullName = getCustomerName(customer);
      const email = typeof customer.email === "string" ? customer.email : "";
      const matchesSearch = [firstName, lastName, fullName, email]
        .some((value) => value.toLowerCase().includes(searchValue));
      const matchesGender = !selectedGender || customer.gender === selectedGender;

      return matchesSearch && matchesGender;
    })
    .slice()
    .sort((first, second) => {
      const firstName = getCustomerName(first);
      const secondName = getCustomerName(second);
      const result = firstName.localeCompare(secondName, undefined, {
        sensitivity: "base",
      });

      return selectedSort === "name-desc" ? -result : result;
    });

  const totalPages = Math.ceil(filteredCustomers.length / pageSize);
  const displayedPage = totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
  const firstCustomerIndex = (displayedPage - 1) * pageSize;
  const pageCustomers = filteredCustomers.slice(
    firstCustomerIndex,
    firstCustomerIndex + pageSize,
  );
  const firstCustomerNumber = filteredCustomers.length === 0 ? 0 : firstCustomerIndex + 1;
  const lastCustomerNumber = Math.min(
    firstCustomerIndex + pageSize,
    filteredCustomers.length,
  );

  return (
    <section className="customers" aria-labelledby="customers-title">
      <header className="customers__intro">
        <h2 className="customers__title" id="customers-title">Customers</h2>
        <p className="customers__description">
          Browse DummyJSON user profiles. Customer spending and order counts are not available here.
        </p>
        {usersTotal != null && (
          <p className="customers__dataset-note">
            {customers.length} profiles loaded from {usersTotal} users reported by the API.
          </p>
        )}
      </header>

      {usersError && (
        <div className="customers__message customers__message--error" role="alert">
          <p>Customers could not be loaded. {usersError}</p>
          <button
            className="customers__retry"
            type="button"
            onClick={handleRetry}
            disabled={isLoading}
          >
            Try again
          </button>
        </div>
      )}

      {isLoading && customers.length === 0 && (
        <div role="status" aria-live="polite">
          <span className="customers__loading-label">Loading customers...</span>
          <CustomerSkeleton />
        </div>
      )}

      {isLoading && customers.length > 0 && (
        <p className="customers__message" role="status">Refreshing customer profiles...</p>
      )}

      {usersStatus === "succeeded" && customers.length === 0 && (
        <p className="customers__message">No customers were returned by the API.</p>
      )}

      {customers.length > 0 && (
        <>
          <div className="customers__controls" aria-label="Search and filter customers">
            <div className="customers__control">
              <label className="customers__label" htmlFor="customer-search">
                Search customers
              </label>
              <input
                className="customers__input"
                id="customer-search"
                type="search"
                placeholder="Search first name, last name, full name, or email"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            <div className="customers__control">
              <label className="customers__label" htmlFor="customer-gender">
                Gender
              </label>
              <select
                className="customers__select"
                id="customer-gender"
                value={selectedGender}
                onChange={handleGenderChange}
              >
                <option value="">All genders</option>
                {genders.map((gender) => (
                  <option value={gender} key={gender}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="customers__control">
              <label className="customers__label" htmlFor="customer-sort">
                Sort by name
              </label>
              <select
                className="customers__select"
                id="customer-sort"
                value={selectedSort}
                onChange={handleSortChange}
              >
                {sortOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <p className="customers__message">No customers match your search and filters.</p>
          ) : (
            <>
              <div className="customers__table-wrapper">
                <table className="customers__table">
                  <caption className="customers__caption">Customer profiles</caption>
                  <thead>
                    <tr>
                      <th scope="col">Avatar</th>
                      <th scope="col">Customer</th>
                      <th scope="col">Email</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Gender</th>
                      <th scope="col">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageCustomers.map((customer) => {
                      const fullName = getCustomerName(customer);

                      return (
                        <tr key={customer.id}>
                          <td>
                            <CustomerAvatar customer={customer} />
                          </td>
                          <td>{fullName || "Name not provided"}</td>
                          <td>{customer.email || "Email not provided"}</td>
                          <td>{customer.phone || "Phone not provided"}</td>
                          <td>{customer.gender || "Not provided"}</td>
                          <td className="customers__address">{getCustomerAddress(customer.address)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <nav className="customers__pagination" aria-label="Customer pagination">
                <p className="customers__range" aria-live="polite">
                  Showing {firstCustomerNumber}{"\u2013"}{lastCustomerNumber} of {filteredCustomers.length} loaded profiles
                </p>

                <div className="customers__pagination-actions">
                  <label
                    className="customers__page-size-label"
                    htmlFor="customers-page-size"
                  >
                    Profiles per page
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
