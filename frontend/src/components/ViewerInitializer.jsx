import { useState, useEffect } from "react";

import { initViewer } from "../utils/viewer";
import { showNotification, clearNotification } from "../utils/notifications";

import BucketSelector from "./BucketSelector.jsx";
import ModelSelector from "./ModelSelector.jsx";
import ModelUploader from "./ModelUploader.jsx";
import BucketCreator from "./BucketCreator.jsx";
import SidebarSection from "./SidebarSection.jsx";

const ViewerInitializer = () => {
  const [viewer, setViewer] = useState(null);
  const [selectedUrn, setSelectedUrn] = useState(null); // This is for MODEL URN
  const [selectedBucket, setSelectedBucket] = useState(null); // This is for BUCKET object
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Force components to refresh by updating key
  const refreshComponents = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    const initializeViewer = async () => {
      try {
        const viewerInstance = await initViewer(
          document.getElementById("preview")
        );
        setViewer(viewerInstance);
        window.viewer = viewerInstance; // Store viewer globally for delete function access

        // Check for model URN in URL hash
        const urn = window.location.hash?.substring(1);
        if (urn) {
          setSelectedUrn(urn);
        }
      } catch (err) {
        setError("Failed to initialize viewer. See console for details.");
        console.error(err);
      }
    };
    initializeViewer();
  }, []);

  const handleBucketSelected = (viewer, bucket) => {
    if (bucket && bucket.urn) {
      setSelectedBucket(bucket);
      // Clear selected model when switching buckets
      setSelectedUrn(null);
      // Show notification if bucket has no models (will be handled by ModelSelector)
      clearNotification();
    } else {
      setSelectedUrn(null);
      setSelectedBucket(null);
      // Clear models when no bucket is selected
      clearNotification();
    }
  };

  const handleBucketCreated = (viewer, bucket) => {
    setSelectedBucket(bucket);
    // Clear selected model for new bucket
    setSelectedUrn(null);
    // Show success notification
    showNotification(`Bucket "${bucket.name}" created successfully!`);
    setTimeout(() => {
      clearNotification();
    }, 2000);
    // Force components to refresh
    refreshComponents();
  };

  const handleModelSelected = (viewer, urn) => {
    setSelectedUrn(urn);
    // Update URL hash when model is selected
    if (urn) {
      window.location.hash = urn;
    } else {
      window.location.hash = "";
    }
  };

  const handleDeleteBucket = async (bucketName) => {
    try {
      // Use the correct API endpoint to delete a bucket
      const resp = await fetch(`/api/buckets/${bucketName}`, {
        method: "DELETE",
      });
      if (!resp.ok) {
        let errorMessage = "Failed to delete bucket";
        try {
          const errorData = await resp.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = (await resp.text()) || errorMessage;
        }
        throw new Error(errorMessage);
      }
      // Refresh bucket selection after successful deletion
      handleBucketSelected(viewer, null);
      showNotification(`Bucket "${bucketName}" deleted successfully!`);
      setTimeout(() => {
        clearNotification();
      }, 3000);
      // Force components to refresh
      refreshComponents();
    } catch (err) {
      if (
        err.message.includes("Access denied") ||
        err.message.includes("privilege")
      ) {
        setError(
          `Cannot delete bucket "${bucketName}". You can only delete buckets that you created with this app.`
        );
      } else {
        setError(`Failed to delete bucket ${bucketName}. ${err.message}`);
      }
      console.error(err);
    }
  };

  return (
    <>
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
          role="alert"
        >
          {error}
        </div>
      )}
      {viewer ? (
        <>
          <SidebarSection title="Bucket Selection" icon="🗂️">
            <BucketSelector
              key={`bucket-${refreshKey}`}
              viewer={viewer}
              selectedBucket={selectedBucket}
              onBucketSelected={handleBucketSelected}
              onDeleteBucket={handleDeleteBucket}
            />
          </SidebarSection>

          <SidebarSection title="Model Selection" icon="🏗️">
            <ModelSelector
              key={`model-${refreshKey}`}
              viewer={viewer}
              selectedUrn={selectedUrn}
              selectedBucketUrn={selectedBucket?.urn}
              onModelSelected={handleModelSelected}
            />
          </SidebarSection>

          <SidebarSection title="Upload Model" icon="📤">
            <ModelUploader
              viewer={viewer}
              selectedBucket={selectedBucket}
              onBucketSelected={handleBucketSelected}
            />
          </SidebarSection>

          <SidebarSection title="Create Bucket" icon="➕">
            <BucketCreator
              viewer={viewer}
              onBucketCreated={handleBucketCreated}
            />
          </SidebarSection>
        </>
      ) : (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Initializing viewer...</div>
          </div>
        </div>
      )}
    </>
  );
};

export default ViewerInitializer;
