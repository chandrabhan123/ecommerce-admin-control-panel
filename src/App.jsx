import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import "./App.scss";

const summaryCards = [
  { title: "Total Products", value: 120 },
  { title: "Total Orders", value: 58 },
  { title: "Total Customers", value: 95 },
];

function App() {
  return (
    <div className="app">
      <Sidebar />

      <main className="app__main">
        <Header />

        <div className="app__content">
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
                <p className="summary__value">{card.value}</p>
              </article>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
