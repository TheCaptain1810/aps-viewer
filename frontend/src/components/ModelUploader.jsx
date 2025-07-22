import { useState, useRef } from "react";

import { clearNotification, showNotification } from "../utils/notifications";

const ModelUploader = ({ viewer, selectedBucket, onBucketSelected }) => {
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async () => {
    const file = fileInputRef.current.files[0];
    if (!file) return;

    // Validate selected bucket
    if (
      !selectedBucket?.urn ||
      selectedBucket.name === "Select a bucket..." ||
      selectedBucket.name === "No buckets available" ||
      selectedBucket.name === "Error loading buckets"
    ) {
      setError("Please select a bucket before uploading a model.");
      fileInputRef.current.value = "";
      return;
    }

    let data = new FormData();
    data.append("model-file", file);
    data.append("bucket-urn", selectedBucket.urn);

    if (file.name.endsWith(".zip")) {
      const entrypoint = window.prompt(
        "Please enter the filename of the main design inside the archive."
      );
      if (!entrypoint) {
        fileInputRef.current.value = "";
        return;
      }
      data.append("model-zip-entrypoint", entrypoint);
    }

    setIsUploading(true);
    setError(null);
    showNotification(
      `Uploading model <em>${file.name}</em> to bucket <em>${selectedBucket.name}</em>. Do not reload the page.`
    );

    try {
      const resp = await fetch("/api/models", {
        method: "POST",
        body: data,
      });

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      await resp.json();
      onBucketSelected(viewer, selectedBucket);
    } catch (err) {
      setError(
        `Could not upload model ${file.name}. See the console for more details.`
      );
      console.error(err);
    } finally {
      clearNotification();
      setIsUploading(false);
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}
      <div className="space-y-3">
        <input
          id="input"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          id="upload"
          onClick={handleUploadClick}
          disabled={isUploading}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isUploading ? "Uploading..." : "Upload Model"}
        </button>
      </div>
    </div>
  );
};

export default ModelUploader;
