import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchProducts, removeProduct } from "../features/products/productsSlice";
import "./Products.scss";

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const sortOptions = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

function Products() {
  const dispatch = useDispatch();
  const { items: products, status, error } = useSelector(
    (state) => state.products,
  );
  const isLoading = status === "loading";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSort, setSelectedSort] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [deletingProductIds, setDeletingProductIds] = useState([]);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");

  useEffect(() => {
    // Redux owns this request, so it can safely finish if this page unmounts.
    dispatch(fetchProducts({ force: true }));
  }, [dispatch]);

  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }

  function handleCategoryChange(event) {
    setSelectedCategory(event.target.value);
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

  function handleRetry() {
    dispatch(fetchProducts({ force: true }));
  }

  async function handleDeleteProduct(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeleteError("");
    setDeleteSuccess("");
    setDeletingProductIds((currentIds) => [...currentIds, product.id]);

    try {
      const response = await fetch(`${PRODUCTS_URL}/${product.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`The server responded with status ${response.status}.`);
      }

      dispatch(removeProduct(product.id));
      setDeleteSuccess(`${product.name} was deleted successfully.`);
    } catch (requestError) {
      setDeleteError(
        `Could not delete ${product.name}. ${requestError.message} Please try again.`,
      );
    } finally {
      setDeletingProductIds((currentIds) =>
        currentIds.filter((productId) => productId !== product.id),
      );
    }
  }

  const categories = [...new Set(products.map((product) => product.category))]
    .filter(Boolean)
    .sort((first, second) => first.localeCompare(second));

  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
    )
    .filter(
      (product) => !selectedCategory || product.category === selectedCategory,
    )
    .slice()
    .sort((first, second) => {
      switch (selectedSort) {
        case "name-desc":
          return second.name.localeCompare(first.name, undefined, {
            sensitivity: "base",
          });
        case "price-asc":
          return Number(first.price) - Number(second.price);
        case "price-desc":
          return Number(second.price) - Number(first.price);
        case "name-asc":
        default:
          return first.name.localeCompare(second.name, undefined, {
            sensitivity: "base",
          });
      }
    });

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const displayedPage = totalPages === 0 ? 1 : Math.min(currentPage, totalPages);
  const firstProductIndex = (displayedPage - 1) * pageSize;
  const pageProducts = filteredProducts.slice(
    firstProductIndex,
    firstProductIndex + pageSize,
  );
  const firstProductNumber = filteredProducts.length === 0 ? 0 : firstProductIndex + 1;
  const lastProductNumber = Math.min(
    firstProductIndex + pageSize,
    filteredProducts.length,
  );

  useEffect(() => {
    if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    } else if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <section className="products" aria-labelledby="products-title">
      <header className="products__intro">
        <h2 className="products__title" id="products-title">Products</h2>
        <p className="products__description">
          Manage and review the products in your store.
        </p>
      </header>

      {deleteError && (
        <p className="products__message products__message--error" role="alert">
          {deleteError}
        </p>
      )}
      {deleteSuccess && (
        <p className="products__message products__message--success" role="status">
          {deleteSuccess}
        </p>
      )}

      {isLoading && (
        <p className="products__message" role="status">
          Loading products...
        </p>
      )}

      {!isLoading && error && (
        <div className="products__message products__message--error" role="alert">
          <p>{error}</p>
          <button className="products__retry" type="button" onClick={handleRetry}>
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <p className="products__message">
          No products found.
        </p>
      )}

      {!isLoading && !error && products.length > 0 && (
        <>
          <div className="products__controls" aria-label="Filter and sort products">
            <div className="products__control">
              <label className="products__label" htmlFor="product-search">
                Search products
              </label>
              <input
                className="products__input"
                id="product-search"
                type="search"
                placeholder="Search by product name"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            <div className="products__control">
              <label className="products__label" htmlFor="product-category">
                Category
              </label>
              <select
                className="products__select"
                id="product-category"
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="products__control">
              <label className="products__label" htmlFor="product-sort">
                Sort by
              </label>
              <select
                className="products__select"
                id="product-sort"
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

          {filteredProducts.length === 0 ? (
            <p className="products__message">No matching products found.</p>
          ) : (
            <>
              <div className="products__table-wrapper">
                <table className="products__table">
                  <caption className="products__caption">Products in your store</caption>
                  <thead>
                    <tr>
                      <th scope="col">ID</th>
                      <th scope="col">Product Name</th>
                      <th scope="col">Price</th>
                      <th scope="col">Category</th>
                      <th scope="col">Stock</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageProducts.map((product) => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>{product.name}</td>
                        <td>{priceFormatter.format(Number(product.price) || 0)}</td>
                        <td>{product.category}</td>
                        <td>{product.stock}</td>
                        <td>
                          <div className="products__row-actions">
                            <Link
                              className="products__action"
                              to={`/products/${product.id}/edit`}
                              aria-label={`Edit ${product.name}`}
                            >
                              Edit
                            </Link>
                            <button
                              className="products__delete-button"
                              type="button"
                              onClick={() => handleDeleteProduct(product)}
                              disabled={deletingProductIds.includes(product.id)}
                              aria-label={`Delete ${product.name}`}
                            >
                              {deletingProductIds.includes(product.id)
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <nav className="products__pagination" aria-label="Product pagination">
                <p className="products__range" aria-live="polite">
                  Showing {firstProductNumber}{"\u2013"}{lastProductNumber} of {filteredProducts.length} products
                </p>

                <div className="products__pagination-actions">
                  <label className="products__page-size-label" htmlFor="products-page-size">
                    Products per page
                  </label>
                  <select
                    className="products__select products__page-size"
                    id="products-page-size"
                    value={pageSize}
                    onChange={handlePageSizeChange}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>

                  <button
                    className="products__page-button"
                    type="button"
                    onClick={() => setCurrentPage(displayedPage - 1)}
                    disabled={displayedPage === 1}
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  <span className="products__page-indicator" aria-current="page">
                    Page {displayedPage} of {totalPages}
                  </span>
                  <button
                    className="products__page-button"
                    type="button"
                    onClick={() => setCurrentPage(displayedPage + 1)}
                    disabled={displayedPage === totalPages}
                    aria-label="Next page"
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

export default Products;
