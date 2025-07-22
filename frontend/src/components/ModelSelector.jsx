import { useEffect } from "react";

import { useModels } from "../hooks/useAPS";
import { onModelSelected } from "../utils/models";
import { showNotification, clearNotification } from "../utils/notifications";

const ModelSelector = ({
  viewer,
  selectedUrn,
  selectedBucketUrn,
  onModelSelected: onModelSelectedCallback,
}) => {
  const { models, error } = useModels(selectedBucketUrn);

  // Only auto-load if there's a selectedUrn from URL hash or previous selection
  useEffect(() => {
    if (
      selectedUrn &&
      models.length > 0 &&
      models.find((m) => m.urn === selectedUrn)
    ) {
      onModelSelected(viewer, selectedUrn);
    }
  }, [models, selectedUrn, viewer]);

  // Show notification when bucket has no models
  useEffect(() => {
    if (selectedBucketUrn && !error && models.length === 0) {
      showNotification(
        "This bucket has no models. Upload a model to get started."
      );
      // Clear notification after 4 seconds
      const timer = setTimeout(clearNotification, 4000);
      return () => clearTimeout(timer);
    } else if (selectedBucketUrn && models.length > 0) {
      clearNotification();
    }
  }, [selectedBucketUrn, models, error]);

  const handleChange = (event) => {
    const newUrn = event.target.value;
    if (newUrn) {
      onModelSelected(viewer, newUrn);
      if (onModelSelectedCallback) {
        onModelSelectedCallback(viewer, newUrn);
      }
    }
  };

  // Don't show error if no bucket is selected
  const shouldShowError = error && selectedBucketUrn;

  return (
    <div className="w-full">
      {shouldShowError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm"
          role="alert"
        >
          Could not load models for this bucket. Please try again.
        </div>
      )}
      <select
        id="models"
        className="block w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-colors"
        onChange={handleChange}
        value={selectedUrn || ""}
        disabled={!selectedBucketUrn}
      >
        <option value="" disabled>
          {!selectedBucketUrn
            ? "Select a bucket first"
            : models.length === 0
            ? "No models available"
            : "Select a model"}
        </option>
        {models.map((model) => (
          <option key={model.urn} value={model.urn}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector;
