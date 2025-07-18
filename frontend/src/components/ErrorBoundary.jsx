import PropTypes from "prop-types";

function ErrorBoundary({ error, onRetry }) {
  return (
    <div className="error-container">
      <h2>Error</h2>
      <p>{error}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  );
}

ErrorBoundary.propTypes = {
  error: PropTypes.string.isRequired,
  onRetry: PropTypes.func.isRequired,
};

export default ErrorBoundary;
