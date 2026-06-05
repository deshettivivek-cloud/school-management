import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '4rem', color: 'var(--danger-500)', marginBottom: '1rem' }}>403</h1>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Access Denied</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px' }}>
        You do not have the required permissions to view this page. If you believe this is an error, please contact the principal.
      </p>
      <Link to="/" className="btn btn-primary">
        Return to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;
