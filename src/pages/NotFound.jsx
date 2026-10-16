import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <p className="not-found__code">404</p>
      <h2 className="not-found__title" id="not-found-title">
        Page not found
      </h2>
      <p className="not-found__description">
        This page does not exist. Return to the Dashboard to continue.
      </p>
      <Link className="not-found__link" to="/">
        Go to Dashboard
      </Link>
    </section>
  );
}

export default NotFound;
