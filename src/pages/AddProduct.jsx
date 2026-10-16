import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addProduct } from "../features/products/productsSlice";
import "./AddProduct.scss";

function AddProduct() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "",
    stock: "",
    thumbnail: "",
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

    const title = formData.title.trim();
    const category = formData.category.trim();
    const price = Number(formData.price);
    const stock = Number(formData.stock);

    if (!title) {
      setError("Enter a product title.");
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
      await dispatch(addProduct({
        title,
        price,
        category,
        stock,
        ...(formData.thumbnail.trim() && { thumbnail: formData.thumbnail.trim() }),
      })).unwrap();
      setSuccess("Product added for this session. DummyJSON does not permanently save it. Redirecting to Products...");
      window.setTimeout(() => navigate("/products"), 900);
    } catch (requestError) {
      setError(
        `The product could not be added. ${requestError} Please try again.`,
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
            Product Title
          </label>
          <input
            className="add-product__input"
            id="product-name"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            autoComplete="off"
            required
          />
        </div>

        <div className="add-product__field">
          <label className="add-product__label" htmlFor="product-thumbnail">
            Thumbnail URL (optional)
          </label>
          <input
            className="add-product__input"
            id="product-thumbnail"
            name="thumbnail"
            type="url"
            value={formData.thumbnail}
            onChange={handleChange}
            autoComplete="url"
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
