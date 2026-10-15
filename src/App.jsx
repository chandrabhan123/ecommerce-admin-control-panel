import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AppRoutes from "./routes/AppRoutes";
import "./App.scss";

function App() {
  return (
    <div className="app">
      <Sidebar />

      <main className="app__main">
        <Header />

        <div className="app__content">
          <AppRoutes />
        </div>
      </main>
    </div>
  );
}

export default App;
