import { useState, useEffect } from "react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

export function useBuckets() {
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBuckets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const resp = await fetch(`${SERVER_URL}/api/hubs/buckets`, {
        credentials: "include",
      });

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      const bucketsData = await resp.json();
      setBuckets(bucketsData);

      // Auto-select first bucket if none selected
      if (bucketsData.length > 0 && !selectedBucket) {
        setSelectedBucket(bucketsData[0]);
      }

      return bucketsData;
    } catch (err) {
      console.error("Failed to fetch buckets:", err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const createBucket = async (bucketName) => {
    try {
      setIsLoading(true);
      setError(null);

      const resp = await fetch(`${SERVER_URL}/api/hubs/buckets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ bucketName }),
      });

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      const newBucket = await resp.json();
      await fetchBuckets(); // Refresh the list
      setSelectedBucket(newBucket);

      return newBucket;
    } catch (err) {
      console.error("Failed to create bucket:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBucket = async (bucketName) => {
    try {
      setIsLoading(true);
      setError(null);

      const resp = await fetch(`${SERVER_URL}/api/hubs/buckets/${bucketName}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      await fetchBuckets(); // Refresh the list

      // Clear selection if deleted bucket was selected
      if (selectedBucket && selectedBucket.name === bucketName) {
        setSelectedBucket(null);
      }
    } catch (err) {
      console.error("Failed to delete bucket:", err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadBuckets = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const resp = await fetch(`${SERVER_URL}/api/hubs/buckets`, {
          credentials: "include",
        });

        if (!resp.ok) {
          throw new Error(await resp.text());
        }

        const bucketsData = await resp.json();
        setBuckets(bucketsData);
      } catch (err) {
        console.error("Failed to fetch buckets:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadBuckets();
  }, []); // Only run on mount

  // Auto-select first bucket when buckets are loaded
  useEffect(() => {
    if (buckets.length > 0 && !selectedBucket) {
      setSelectedBucket(buckets[0]);
    }
  }, [buckets, selectedBucket]);

  return {
    buckets,
    selectedBucket,
    setSelectedBucket,
    isLoading,
    error,
    createBucket,
    deleteBucket,
    refreshBuckets: fetchBuckets,
  };
}
