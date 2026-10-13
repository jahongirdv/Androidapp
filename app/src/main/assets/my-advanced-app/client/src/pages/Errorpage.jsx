import { useRouteError } from 'react-router-dom';
import './css/Errorpage.css';
import { Link } from 'react-router-dom';

export default function Errorpage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="error-page">
      <h1>404</h1>
      <p className="error-message">
        {' '}
        <i>{error.statusText || error.message}</i>
      </p>
      <p className="error-subtext">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <Link to="/" className="link-btn primary">
        Go Home
      </Link>
    </div>
  );
}
