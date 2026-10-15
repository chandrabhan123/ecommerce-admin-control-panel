import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EditProduct.scss";

const PRODUCTS_URL = "http://localhost:3000/products";

function EditProduct() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    stock: "",
  });
  const [loadedProductId, setLoadedProductId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isLoading = loadedProductId !== productId;

  useEffect(() => {
    let isCurrent = true;

    async function loadProduct() {
      try {
        const response = await fetch(`${PRODUCTS_URL}/${productId}`);

        if (!response.ok) {
          throw new Error(`The server responded with status ${response.status}.`);
        }

        const product = await response.json();

        if (!product || typeof product !== "object") {
          throw new Error("The product data was not in the expected format.");
        }

        if (isCurrent) {
          setFormData({
            name: product.name ?? "",
            price: String(product.price ?? ""),
            category: product.category ?? "",
            stock: String(product.stock ?? ""),
          });
          setError("");
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(
            `The product could not be loaded. ${requestError.message} Please try again.`,
          );
        }
      } finally {
        if (isCurrent) {
          setLoadedProductId(productId);
        }
      }
    }

    loadProduct();

    return () => {
      isCurrent = false;
    };
  }, [productId]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = formData.name.trim();
    const category = formData.category.trim();
    const price = Number(formData.price);
    const stock = Number(formData.stock);

    if (!name) {
      setError("Enter a product name.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0 || formData.price.trim() === "") {
      setError("Enter a valid price greater than zero.");
      return;
    }

    if (!category) {
      setError("Enter a product category.");
      return;
    }

    if (
      formData.stock.trim() === "" ||
      !Number.isFinite(stock) ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError("Enter stock as a non-negative whole number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${PRODUCTS_URL}/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, price, category, stock }),
      });

      if (!response.ok) {
        throw new Error(`The server responded with status ${response.status}.`);
      }

      setSuccess("Product updated successfully. Redirecting to Products...");
      window.setTimeout(() => navigate("/products"), 900);
    } catch (requestError) {
      setError(
        `The product could not be updated. ${requestError.message} Please try again.`,
      );
      setIsSubmitting(false);
    }
  }

  return (
    <section className="edit-product" aria-labelledby="edit-product-title">
      <header className="edit-product__intro">
        <h2 className="edit-product__title" id="edit-product-title">
          Edit Product
        </h2>
        <p className="edit-product__description">
          Update the product details below.
        </p>
      </header>

      {isLoading && (
        <p className="edit-product__message" role="status">
          Loading product...
        </p>
      )}

      {!isLoading && error && (
        <p className="edit-product__message edit-product__message--error" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && (
        <form className="edit-product__form" onSubmit={handleSubmit} noValidate>
          {success && (
            <p className="edit-product__message edit-product__message--success" role="status">
              {success}
            </p>
          )}

          <div className="edit-product__field">
            <label className="edit-product__label" htmlFor="edit-product-name">
              Product Name
            </label>
            <input
              className="edit-product__input"
              id="edit-product-name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              autoComplete="off"
              required
            />
          </div>

          <div className="edit-product__field">
            <label className="edit-product__label" htmlFor="edit-product-price">
              Price ({"\u20B9"})
            </label>
            <input
              className="edit-product__input"
              id="edit-product-price"
              name="price"
              type="number"
              min="0.01"
              step="any"
              value={formData.price}
              onChange={handleChange}
              inputMode="decimal"
              required
            />
          </div>

          <div className="edit-product__field">
            <label className="edit-product__label" htmlFor="edit-product-category">
              Category
            </label>
            <input
              className="edit-product__input"
              id="edit-product-category"
              name="category"
              type="text"
              value={formData.category}
              onChange={handleChange}
              autoComplete="off"
              required
            />
          </div>

          <div className="edit-product__field">
            <label className="edit-product__label" htmlFor="edit-product-stock">
              Stock
            </label>
            <input
              className="edit-product__input"
              id="edit-product-stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              value={formData.stock}
              onChange={handleChange}
              inputMode="numeric"
              required
            />
          </div>

          <button
            className="edit-product__submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving Changes..." : "Save Changes"}
          </button>
        </form>
      )}
    </section>
  );
}

export default EditProduct;
