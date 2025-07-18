import { useEffect } from "react";
import PropTypes from "prop-types";

function Notification({ message, type = "info", autoClose = false, onClose }) {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  if (!message) return null;

  return (
    <div className="notification-overlay">
      <div className={`notification notification-${type}`}>
        <div
          className="notification-content"
          dangerouslySetInnerHTML={{ __html: message }}
        />
        {onClose && (
          <button
            className="notification-close"
            onClick={onClose}
            aria-label="Close notification"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

Notification.propTypes = {
  message: PropTypes.string,
  type: PropTypes.oneOf(["info", "success", "warning", "error"]),
  autoClose: PropTypes.bool,
  onClose: PropTypes.func,
};

export default Notification;
