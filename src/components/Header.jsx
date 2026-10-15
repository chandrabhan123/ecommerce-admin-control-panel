import "./Header.scss";

function Header() {
  return (
    <header className="header">
      <h1 className="header__title">Dashboard</h1>

      <div className="header__actions">
        <div className="header__search">
          <label htmlFor="header-search">Search</label>
          <input
            id="header-search"
            type="search"
            placeholder="Search..."
          />
        </div>

        <button
          className="header__notification"
          type="button"
          aria-label="Notifications"
        >
          {"\u{1F514}"}
        </button>

        <div className="header__profile" aria-label="Admin profile">
          <span className="header__avatar" aria-hidden="true">
            A
          </span>
          <span>Admin</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
