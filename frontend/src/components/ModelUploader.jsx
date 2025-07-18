import { useState, useRef } from "react";
import PropTypes from "prop-types";

function ModelUploader({ selectedBucket, onUploadModel, isLoading }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    if (!selectedBucket) {
      alert("Please select a bucket before uploading a model.");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedBucket) {
      alert("Please select a bucket before uploading a model.");
      e.target.value = "";
      return;
    }

    let entrypoint = null;
    if (file.name.endsWith(".zip")) {
      entrypoint = window.prompt(
        "Please enter the filename of the main design inside the archive."
      );
      if (!entrypoint) {
        e.target.value = "";
        return;
      }
    }

    try {
      setIsUploading(true);
      await onUploadModel(file, selectedBucket.urn, entrypoint);
    } catch (err) {
      alert(
        `Could not upload model ${file.name}. See the console for more details.`
      );
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Clear the file input
    }
  };

  const disabled = isLoading || isUploading || !selectedBucket;

  return (
    <div className="model-uploader">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept=".dwg,.rvt,.ipt,.iam,.dwf,.dwfx,.step,.stp,.iges,.igs,.catpart,.catproduct,.cgr,.3dxml,.zip"
        aria-label="Upload model file"
      />
      <button
        onClick={handleUploadClick}
        disabled={disabled}
        className="upload-btn"
        aria-label="Upload model"
      >
        {isUploading ? "Uploading..." : "Upload Model"}
      </button>
      {!selectedBucket && (
        <p className="upload-hint">Select a bucket to upload models</p>
      )}
    </div>
  );
}

ModelUploader.propTypes = {
  selectedBucket: PropTypes.shape({
    urn: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onUploadModel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default ModelUploader;
