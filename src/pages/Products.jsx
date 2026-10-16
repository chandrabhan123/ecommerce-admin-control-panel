import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { deleteProduct, fetchProducts } from "../features/products/productsSlice";
import { formatCategory } from "../features/products/productUtils";
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

function ProductThumbnail({ product }) {
  const [hasImageError, setHasImageError] = useState(false);

  if (!product.thumbnail || hasImageError) {
    return (
      <span className="products__image-placeholder" role="img" aria-label="Product image unavailable">
        No image
      </span>
    );
  }

  return (
    <img
      className="products__thumbnail"
      src={product.thumbnail}
      alt={product.title || "Product"}
      loading="lazy"
      onError={() => setHasImageError(true)}
    />
  );
}

function ProductSkeleton() {
  return (
    <div className="products__table-wrapper" aria-label="Loading products">
      <table className="products__table">
        <caption className="products__caption">Loading product catalog</caption>
        <thead>
          <tr>
            <th scope="col">ID</th><th scope="col">Image</th><th scope="col">Title</th>
            <th scope="col">Price</th><th scope="col">Category</th><th scope="col">Rating</th>
            <th scope="col">Stock</th><th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: 8 }, (_, cellIndex) => (
                <td key={cellIndex}><span className="products__skeleton" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Products() {
  const dispatch = useDispatch();
  const { items: products, status, error } = useSelector(
    (state) => state.products,
  );
  const deleteStatus = useSelector((state) => state.products.deleteStatus);
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
    // The thunk skips this request while loading or when products are already loaded.
    dispatch(fetchProducts());
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
      `Are you sure you want to delete "${product.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeleteError("");
    setDeleteSuccess("");
    setDeletingProductIds((currentIds) => [...currentIds, product.id]);

    try {
      await dispatch(deleteProduct(product.id)).unwrap();
      setDeleteSuccess(
        `${product.title || "Product"} was removed for this session. DummyJSON does not permanently delete products.`,
      );
    } catch (requestError) {
      setDeleteError(
        `Could not delete ${product.title || "product"}. ${requestError} Please try again.`,
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
      (typeof product.title === "string" ? product.title : "")
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase()),
    )
    .filter(
      (product) => !selectedCategory || product.category === selectedCategory,
    )
    .slice()
    .sort((first, second) => {
      switch (selectedSort) {
        case "name-desc":
          return (second.title || "").localeCompare(first.title || "", undefined, {
            sensitivity: "base",
          });
        case "price-asc":
          return Number(first.price) - Number(second.price);
        case "price-desc":
          return Number(second.price) - Number(first.price);
        case "name-asc":
        default:
          return (first.title || "").localeCompare(second.title || "", undefined, {
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

  return (
    <section className="products" aria-labelledby="products-title">
      <header className="products__intro">
        <h2 className="products__title" id="products-title">Products</h2>
        <p className="products__description">
          Browse and manage the DummyJSON product catalog.
        </p>
        <p className="products__api-note">
          Demo API: add, edit, and delete changes appear here for this session but are not permanently saved by DummyJSON. Prices use INR formatting; no currency conversion is applied.
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
        <div role="status" aria-live="polite">
          <span className="products__loading-label">Loading products...</span>
          <ProductSkeleton />
        </div>
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
                placeholder="Search by product title"
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
                      <th scope="col">Image</th>
                      <th scope="col">Title</th>
                      <th scope="col">Price</th>
                      <th scope="col">Category</th>
                      <th scope="col">Rating</th>
                      <th scope="col">Stock</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageProducts.map((product) => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>
                          <ProductThumbnail product={product} />
                        </td>
                        <td>{product.title || "Untitled product"}</td>
                        <td>{priceFormatter.format(Number(product.price) || 0)}</td>
                        <td>{formatCategory(product.category)}</td>
                        <td>
                          {product.rating !== "" && Number.isFinite(Number(product.rating)) && product.rating != null
                            ? `${Number(product.rating).toFixed(1)} / 5`
                            : "Not rated"}
                        </td>
                        <td>{product.stock !== "" && Number.isFinite(Number(product.stock)) && product.stock != null ? product.stock : "\u2014"}</td>
                        <td>
                          <div className="products__row-actions">
                            <Link
                              className="products__action"
                              to={`/products/${product.id}/edit`}
                              aria-label={`Edit ${product.title || "product"}`}
                            >
                              Edit
                            </Link>
                            <button
                              className="products__delete-button"
                              type="button"
                              onClick={() => handleDeleteProduct(product)}
                              disabled={
                                deleteStatus === "loading" ||
                                deletingProductIds.includes(product.id)
                              }
                              aria-label={`Delete ${product.title || "product"}`}
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
