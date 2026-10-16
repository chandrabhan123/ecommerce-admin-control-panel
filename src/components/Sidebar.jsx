import "./Sidebar.scss";
import { NavLink } from "react-router-dom";

const navigationItems = [
  { label: "Dashboard", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Add Product", href: "/products/add" },
  { label: "Orders", href: "/orders" },
  { label: "Customers", href: "/customers" },
];

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Admin sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark" aria-hidden="true">S</span>
        <div>
          <h2 className="sidebar__title">Storefront</h2>
          <p className="sidebar__subtitle">Control panel</p>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Main navigation">
        <ul className="sidebar__list">
          {navigationItems.map((item) => (
            <li className="sidebar__item" key={item.href}>
              <NavLink
                className="sidebar__link"
                to={item.href}
                end={item.href === "/" || item.href === "/products"}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
