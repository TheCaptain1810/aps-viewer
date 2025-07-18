import { useState } from "react";
import PropTypes from "prop-types";

function BucketSelector({
  buckets,
  selectedBucket,
  onBucketSelect,
  onDeleteBucket,
  isLoading,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleBucketSelect = (bucket) => {
    onBucketSelect(bucket);
    setIsOpen(false);
  };

  const handleDeleteBucket = async (bucketName, event) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete bucket "${bucketName}"?\n\n` +
        `Note: You can only delete buckets that you created with this app. ` +
        `Buckets created by other applications or users cannot be deleted.\n\n` +
        `This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await onDeleteBucket(bucketName);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const getDisplayText = () => {
    if (isLoading) return "Loading buckets...";
    if (buckets.length === 0) return "No buckets available";
    if (selectedBucket) return selectedBucket.name;
    return "Select a bucket...";
  };

  return (
    <div className={`dropdown-container ${isLoading ? "disabled" : ""}`}>
      <div className={`dropdown ${isOpen ? "open" : ""}`} id="buckets">
        <div
          className="dropdown-selected"
          onClick={() => !isLoading && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Select bucket"
        >
          <span className="selected-text" title={selectedBucket?.name || ""}>
            {getDisplayText()}
          </span>
          <span className="dropdown-arrow" aria-hidden="true">
            {isOpen ? "▲" : "▼"}
          </span>
        </div>

        {isOpen && buckets.length > 0 && (
          <div className="dropdown-options" role="listbox">
            {buckets.map((bucket) => (
              <div
                key={bucket.id}
                className={`dropdown-option ${
                  selectedBucket?.id === bucket.id ? "selected" : ""
                }`}
                onClick={() => handleBucketSelect(bucket)}
                role="option"
                tabIndex={-1}
                title={bucket.name}
                aria-selected={selectedBucket?.id === bucket.id}
              >
                <span className="option-name" title={bucket.name}>
                  {bucket.name}
                </span>
                <button
                  className="delete-btn"
                  onClick={(e) => handleDeleteBucket(bucket.name, e)}
                  title={`Delete bucket ${bucket.name}`}
                  aria-label={`Delete bucket ${bucket.name}`}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="dropdown-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

BucketSelector.propTypes = {
  buckets: PropTypes.arrayOf(
    PropTypes.shape({
      urn: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedBucket: PropTypes.shape({
    urn: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onBucketSelect: PropTypes.func.isRequired,
  onDeleteBucket: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default BucketSelector;
