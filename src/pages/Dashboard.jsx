import { useEffect, useState } from "react";

const PRODUCTS_URL = "http://localhost:3000/products";

function Dashboard() {
  const [productCount, setProductCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadProductCount() {
      try {
        const response = await fetch(PRODUCTS_URL);

        if (!response.ok) {
          throw new Error(`The server responded with status ${response.status}.`);
        }

        const products = await response.json();

        if (!Array.isArray(products)) {
          throw new Error("The product data was not in the expected format.");
        }

        if (isCurrent) {
          setProductCount(products.length);
          setError("");
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(
            `Product statistics could not be loaded. ${requestError.message}`,
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadProductCount();

    return () => {
      isCurrent = false;
    };
  }, [retryCount]);

  function handleRetry() {
    setError("");
    setIsLoading(true);
    setRetryCount((count) => count + 1);
  }

  const summaryCards = [
    {
      title: "Total Products",
      value: isLoading ? "Loading..." : error ? "Unavailable" : productCount,
      note: "Live count from your product catalog",
      isLoading,
    },
    {
      title: "Total Orders",
      value: 58,
      note: "Placeholder value - order statistics are not connected yet",
    },
    {
      title: "Total Customers",
      value: 95,
      note: "Placeholder value - customer statistics are not connected yet",
    },
  ];

  return (
    <>
      <section className="welcome" aria-labelledby="welcome-title">
        <h2 className="welcome__title" id="welcome-title">
          Welcome to your dashboard
        </h2>
        <p className="welcome__description">
          Here is an overview of your e-commerce store.
        </p>
      </section>

      <section className="summary" aria-label="Store summary">
        {summaryCards.map((card) => (
          <article className="summary__card" key={card.title}>
            <h3 className="summary__title">{card.title}</h3>
            <p className="summary__value" role={card.isLoading ? "status" : undefined}>
              {card.value}
            </p>
            <p className="summary__note">{card.note}</p>
          </article>
        ))}
      </section>

      {error && (
        <div className="summary__error" role="alert">
          <p>{error}</p>
          <button className="summary__retry" type="button" onClick={handleRetry}>
            Try again
          </button>
        </div>
      )}
    </>
  );
}

export default Dashboard;
