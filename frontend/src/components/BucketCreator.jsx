import { useState } from "react";

import { showNotification, clearNotification } from "../utils/notifications";

const BucketCreator = ({ viewer, onBucketCreated }) => {
  const [bucketName, setBucketName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleCreate = async () => {
    if (!bucketName.trim()) {
      setError("Please enter a bucket name.");
      return;
    }

    setIsCreating(true);
    setError(null);
    showNotification(`Creating bucket <em>${bucketName}</em>. Please wait...`);

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

      const bucket = await resp.json();
      onBucketCreated(viewer, bucket);

      setBucketName("");
    } catch (err) {
      setError("Bucket creation failed. See console for details.");
      console.error("Bucket creation error:", err);
    } finally {
      clearNotification();
      setIsCreating(false);
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
          id="bucket"
          type="text"
          value={bucketName}
          onChange={(e) => setBucketName(e.target.value)}
          placeholder="Enter bucket name"
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 hover:border-blue-400 transition-colors"
          disabled={isCreating}
        />
        <button
          id="create"
          onClick={handleCreate}
          disabled={isCreating}
          className="w-full px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isCreating ? "Creating..." : "Create Bucket"}
        </button>
      </div>
    </div>
  );
};

export default BucketCreator;
