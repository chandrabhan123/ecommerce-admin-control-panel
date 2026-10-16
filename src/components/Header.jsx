import "./Header.scss";
import { useLocation } from "react-router-dom";

function getPageTitle(pathname) {
  if (pathname === "/") return "Dashboard";
  if (pathname === "/products/add") return "Add Product";
  if (pathname.endsWith("/edit")) return "Edit Product";
  if (pathname.startsWith("/products")) return "Products";
  if (pathname.startsWith("/orders")) return "Orders";
  if (pathname.startsWith("/customers")) return "Customers";
  return "Admin Panel";
}

function Header() {
  const { pathname } = useLocation();

  return (
    <header className="header">
      <div className="header__context">
        <p className="header__eyebrow">E-commerce admin</p>
        <h1 className="header__title">{getPageTitle(pathname)}</h1>
      </div>

      <div className="header__profile" aria-label="Admin profile">
        <span className="header__avatar" aria-hidden="true">A</span>
        <span className="header__profile-copy">
          <strong>Admin</strong>
          <small>Workspace</small>
        </span>
      </div>
    </header>
  );
}

export default Header;
