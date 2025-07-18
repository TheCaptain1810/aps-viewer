import { useState } from "react";
import PropTypes from "prop-types";

function BucketCreator({ onCreateBucket, isLoading }) {
  const [bucketName, setBucketName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = bucketName.trim();
    if (!trimmedName) {
      alert("Please enter a bucket name.");
      return;
    }

    try {
      setIsCreating(true);
      await onCreateBucket(trimmedName);
      setBucketName(""); // Clear input on success
    } catch (err) {
      // Error handling is done in the hook
      console.error("Bucket creation failed:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (e) => {
    setBucketName(e.target.value);
  };

  const disabled = isLoading || isCreating;

  return (
    <form onSubmit={handleSubmit} className="bucket-creator">
      <div className="input-group">
        <input
          type="text"
          id="bucket"
          value={bucketName}
          onChange={handleInputChange}
          placeholder="Enter bucket name"
          disabled={disabled}
          className="bucket-input"
          aria-label="Bucket name"
        />
        <button
          type="submit"
          id="create"
          disabled={disabled}
          className="create-btn"
          aria-label="Create bucket"
        >
          {isCreating ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}

BucketCreator.propTypes = {
  onCreateBucket: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default BucketCreator;
