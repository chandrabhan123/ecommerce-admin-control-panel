import "./Sidebar.scss";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Products", href: "/products" },
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
              <a
                className="sidebar__link"
                href={item.href}
                aria-current={item.label === "Dashboard" ? "page" : undefined}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
