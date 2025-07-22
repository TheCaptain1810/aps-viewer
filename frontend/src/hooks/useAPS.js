import { useState, useEffect, useCallback } from "react";

export const useBuckets = () => {
  const [buckets, setBuckets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBuckets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/buckets");
      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      const data = await resp.json();
      setBuckets(data);
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch buckets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBucket = useCallback(async (bucketName) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/buckets/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bucketName: bucketName.trim() }),
      });

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      const newBucket = await resp.json();
      setBuckets((prev) => [...prev, newBucket]);
      return newBucket;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBucket = useCallback(async (bucketName) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `/api/buckets/${encodeURIComponent(bucketName)}`,
        {
          method: "DELETE",
        }
      );

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

      setBuckets((prev) => prev.filter((bucket) => bucket.name !== bucketName));
      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    buckets,
    loading,
    error,
    fetchBuckets,
    createBucket,
    deleteBucket,
    refetch: fetchBuckets,
  };
};

export const useModels = (bucketUrn) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchModels = useCallback(async () => {
    if (!bucketUrn) {
      setModels([]);
      setError(null); // Clear error when no bucket is selected
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(
        `/api/models?bucket=${encodeURIComponent(bucketUrn)}`
      );
      if (!resp.ok) {
        throw new Error(await resp.text());
      }
      const data = await resp.json();
      setModels(data);
    } catch (err) {
      setError(err.message);
      console.error("Failed to fetch models:", err);
      setModels([]); // Clear models on error
    } finally {
      setLoading(false);
    }
  }, [bucketUrn]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    loading,
    error,
    refetch: fetchModels,
  };
};
