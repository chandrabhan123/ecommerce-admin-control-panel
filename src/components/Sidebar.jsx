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
      <h2 className="sidebar__title">Admin Panel</h2>

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
