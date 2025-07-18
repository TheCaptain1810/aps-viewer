import { useState, useEffect } from "react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

export function useModels(selectedBucket) {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);

  const fetchModels = async (bucketUrn) => {
    if (!bucketUrn) {
      setModels([]);
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);

      const resp = await fetch(
        `${SERVER_URL}/api/hubs/buckets/${encodeURIComponent(
          bucketUrn
        )}/objects`,
        { credentials: "include" }
      );

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      const modelsData = await resp.json();
      setModels(modelsData);

      return modelsData;
    } catch (err) {
      console.error("Failed to fetch models:", err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const uploadModel = async (file, bucketUrn) => {
    try {
      setIsLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const resp = await fetch(
        `${SERVER_URL}/api/hubs/buckets/${encodeURIComponent(
          bucketUrn
        )}/objects`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      const result = await resp.json();
      await fetchModels(bucketUrn); // Refresh models list

      return result;
    } catch (err) {
      console.error("Failed to upload model:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const checkModelStatus = async (urn, modelName, bucketUrn) => {
    try {
      const resp = await fetch(
        `${SERVER_URL}/api/hubs/buckets/${encodeURIComponent(
          bucketUrn
        )}/objects/${encodeURIComponent(modelName)}/status`,
        {
          credentials: "include",
        }
      );

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      const status = await resp.json();
      setModelStatus(status);

      return status;
    } catch (err) {
      console.error("Failed to check model status:", err);
      setError(err.message);
      return null;
    }
  };

  // Fetch models when selected bucket changes
  useEffect(() => {
    if (selectedBucket) {
      fetchModels(selectedBucket.urn);
    } else {
      setModels([]);
      setSelectedModel(null);
    }
  }, [selectedBucket]);

  // Auto-select first model when models are loaded
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0]);
    } else if (models.length === 0) {
      setSelectedModel(null);
    }
  }, [models, selectedModel]);

  return {
    models,
    selectedModel,
    setSelectedModel,
    modelStatus,
    isLoading,
    error,
    uploadModel,
    checkModelStatus,
    refreshModels: () => selectedBucket && fetchModels(selectedBucket.urn),
  };
}
