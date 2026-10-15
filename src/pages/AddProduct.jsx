import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddProduct.scss";

const PRODUCTS_URL = "http://localhost:3000/products";

function AddProduct() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    stock: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const response = await fetch(PRODUCTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, price, category, stock }),
      });

      if (!response.ok) {
        throw new Error(`The server responded with status ${response.status}.`);
      }

      setSuccess("Product added successfully. Redirecting to Products...");
      window.setTimeout(() => navigate("/products"), 900);
    } catch (requestError) {
      setError(
        `The product could not be added. ${requestError.message} Please try again.`,
      );
      setIsSubmitting(false);
    }
  }

  return (
    <section className="add-product" aria-labelledby="add-product-title">
      <header className="add-product__intro">
        <h2 className="add-product__title" id="add-product-title">
          Add Product
        </h2>
        <p className="add-product__description">
          Enter the details below to add a product to your store.
        </p>
      </header>

      <form className="add-product__form" onSubmit={handleSubmit} noValidate>
        {error && (
          <p className="add-product__message add-product__message--error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="add-product__message add-product__message--success" role="status">
            {success}
          </p>
        )}

        <div className="add-product__field">
          <label className="add-product__label" htmlFor="product-name">
            Product Name
          </label>
          <input
            className="add-product__input"
            id="product-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            autoComplete="off"
            required
          />
        </div>

        <div className="add-product__field">
          <label className="add-product__label" htmlFor="product-price">
            Price ({"\u20B9"})
          </label>
          <input
            className="add-product__input"
            id="product-price"
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

        <div className="add-product__field">
          <label className="add-product__label" htmlFor="product-category">
            Category
          </label>
          <input
            className="add-product__input"
            id="product-category"
            name="category"
            type="text"
            value={formData.category}
            onChange={handleChange}
            autoComplete="off"
            required
          />
        </div>

        <div className="add-product__field">
          <label className="add-product__label" htmlFor="product-stock">
            Stock
          </label>
          <input
            className="add-product__input"
            id="product-stock"
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
          className="add-product__submit"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding Product..." : "Add Product"}
        </button>
      </form>
    </section>
  );
}

export default AddProduct;
