import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useBuckets } from "../hooks/useBuckets";
import { useModels } from "../hooks/useModels";
import BucketSelector from "./BucketSelector";
import BucketCreator from "./BucketCreator";
import ModelUploader from "./ModelUploader";
import ModelSelector from "./ModelSelector";
import Notification from "./Notification";
import { loadModel } from "../utils/viewer";

function BucketManager({ viewer }) {
  const [notification, setNotification] = useState(null);

  const {
    buckets,
    selectedBucket,
    setSelectedBucket,
    isLoading: bucketsLoading,
    error: bucketsError,
    createBucket,
    deleteBucket,
  } = useBuckets();

  const {
    models,
    selectedModel,
    setSelectedModel,
    modelStatus,
    isLoading: modelsLoading,
    error: modelsError,
    uploadModel,
    checkModelStatus,
  } = useModels(selectedBucket);

  const showNotification = (message, type = "info", autoClose = false) => {
    setNotification({ message, type, autoClose });
  };

  const clearNotification = () => {
    setNotification(null);
  };

  const handleBucketSelect = (bucket) => {
    setSelectedBucket(bucket);
    clearNotification();
  };

  const handleCreateBucket = async (bucketName) => {
    try {
      showNotification(
        `Creating bucket <em>${bucketName}</em>. Please wait...`,
        "info"
      );
      await createBucket(bucketName);
      showNotification(
        `Bucket "${bucketName}" created successfully.`,
        "success",
        true
      );
    } catch (err) {
      showNotification(`Failed to create bucket: ${err.message}`, "error");
      throw err;
    }
  };

  const handleDeleteBucket = async (bucketName) => {
    try {
      showNotification(`Deleting bucket <em>${bucketName}</em>...`, "info");
      await deleteBucket(bucketName);
      showNotification(
        `Bucket "${bucketName}" deleted successfully.`,
        "success",
        true
      );
    } catch (err) {
      showNotification(`Failed to delete bucket: ${err.message}`, "error");
      throw err;
    }
  };

  const handleUploadModel = async (file, bucketUrn, entrypoint) => {
    try {
      showNotification(
        `Uploading model <em>${file.name}</em> to bucket <em>${selectedBucket.name}</em>. Do not reload the page.`,
        "info"
      );
      await uploadModel(file, bucketUrn, entrypoint);
      showNotification(
        `Model "${file.name}" uploaded successfully.`,
        "success",
        true
      );
    } catch (err) {
      showNotification(`Failed to upload model: ${err.message}`, "error");
      throw err;
    }
  };

  const handleModelSelect = async (model) => {
    setSelectedModel(model);
    if (selectedBucket && model) {
      await checkModelStatus(model.urn, model.name, selectedBucket.id);
    }
  };

  const handleCheckStatus = async (urn) => {
    if (selectedBucket && selectedModel) {
      const status = await checkModelStatus(
        urn,
        selectedModel.name,
        selectedBucket.id
      );
      return status;
    }
    return null;
  };

  // Load model in viewer when ready
  useEffect(() => {
    if (viewer && selectedModel && modelStatus?.status === "success") {
      clearNotification();
      loadModel(viewer, selectedModel.urn);
    } else if (modelStatus?.status === "n/a") {
      showNotification("Model has not been translated.", "warning");
    } else if (modelStatus?.status === "inprogress") {
      showNotification(
        `Model is being translated (${modelStatus.progress})...`,
        "info"
      );
    } else if (modelStatus?.status === "failed") {
      const messages =
        modelStatus.messages?.map((msg) => JSON.stringify(msg)).join(", ") ||
        "Unknown error";
      showNotification(`Translation failed: ${messages}`, "error");
    }
  }, [viewer, selectedModel, modelStatus]);

  // Show errors as notifications
  useEffect(() => {
    if (bucketsError) {
      showNotification(`Buckets error: ${bucketsError}`, "error");
    }
  }, [bucketsError]);

  useEffect(() => {
    if (modelsError) {
      showNotification(`Models error: ${modelsError}`, "error");
    }
  }, [modelsError]);

  return (
    <div className="bucket-manager">
      <div className="controls-section">
        <h3>Bucket Management</h3>

        <div className="bucket-controls">
          <BucketCreator
            onCreateBucket={handleCreateBucket}
            isLoading={bucketsLoading}
          />

          <BucketSelector
            buckets={buckets}
            selectedBucket={selectedBucket}
            onBucketSelect={handleBucketSelect}
            onDeleteBucket={handleDeleteBucket}
            isLoading={bucketsLoading}
          />
        </div>

        <div className="model-controls">
          <ModelUploader
            selectedBucket={selectedBucket}
            onUploadModel={handleUploadModel}
            isLoading={modelsLoading}
          />

          <ModelSelector
            models={models}
            selectedModel={selectedModel}
            onModelSelect={handleModelSelect}
            onCheckStatus={handleCheckStatus}
            modelStatus={modelStatus}
            isLoading={modelsLoading}
          />
        </div>
      </div>

      <Notification
        message={notification?.message}
        type={notification?.type}
        autoClose={notification?.autoClose}
        onClose={clearNotification}
      />
    </div>
  );
}

BucketManager.propTypes = {
  viewer: PropTypes.object,
};

export default BucketManager;
