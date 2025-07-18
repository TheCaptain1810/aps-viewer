import PropTypes from "prop-types";

function Header({ user, isLoading, onLogin, onLogout }) {
  return (
    <div id="header">
      <img
        className="logo"
        src="https://cdn.autodesk.io/logo/black/stacked.png"
        alt="Autodesk Platform Services"
      />
      <span className="title">Hubs Browser</span>
      {isLoading ? (
        <button disabled>Loading...</button>
      ) : user ? (
        <button onClick={onLogout}>Logout ({user.name})</button>
      ) : (
        <button onClick={onLogin}>Login</button>
      )}
    </div>
  );
}

Header.propTypes = {
  user: PropTypes.object,
  isLoading: PropTypes.bool.isRequired,
  onLogin: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default Header;
