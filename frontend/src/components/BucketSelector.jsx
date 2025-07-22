import { useState, useEffect } from "react";

import { useBuckets } from "../hooks/useAPS";

const BucketSelector = ({
  viewer,
  selectedBucket: propSelectedBucket,
  onBucketSelected,
  onDeleteBucket,
}) => {
  const { buckets, error: bucketsError, refetch } = useBuckets();
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (buckets.length === 0) {
      setSelectedBucket({ name: "No buckets available", urn: null });
      return;
    }

    // Use the bucket passed from parent if available
    if (
      propSelectedBucket &&
      buckets.find((b) => b.urn === propSelectedBucket.urn)
    ) {
      setSelectedBucket(propSelectedBucket);
    } else if (buckets.length > 0 && !selectedBucket) {
      // Only auto-select if no bucket is currently selected
      const firstBucket = buckets[0];
      setSelectedBucket(firstBucket);
      onBucketSelected(viewer, firstBucket);
    } else if (buckets.length === 0) {
      setSelectedBucket({ name: "Select a bucket...", urn: null });
    }
  }, [buckets, propSelectedBucket, viewer, onBucketSelected, selectedBucket]);

  const handleSelect = (bucket) => {
    setSelectedBucket(bucket);
    setIsOpen(false);
    onBucketSelected(viewer, bucket);
  };

  const handleDelete = async (bucketName, event) => {
    event.stopPropagation();
    try {
      await onDeleteBucket(bucketName);
      await refetch(); // Refresh the buckets list
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full relative">
      {bucketsError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm"
          role="alert"
        >
          {bucketsError}
        </div>
      )}
      <div
        id="buckets"
        className="border border-gray-300 rounded p-3 cursor-pointer bg-white flex justify-between items-center hover:border-blue-400 transition-colors"
        onClick={toggleDropdown}
        title={selectedBucket?.name || ""}
      >
        <span className="selected-text truncate">
          {selectedBucket?.name || "Select a bucket..."}
        </span>
        <svg
          className={`w-4 h-4 transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      {isOpen && (
        <div
          id="bucket-options"
          className="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-60 overflow-y-auto shadow-lg"
        >
          {buckets.length === 0 ? (
            <div className="p-2 text-gray-500">No buckets available</div>
          ) : (
            buckets.map((bucket) => (
              <div
                key={bucket.urn}
                className={`flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer ${
                  bucket.urn === selectedBucket?.urn ? "bg-blue-50" : ""
                }`}
                role="option"
                title={bucket.name}
                onClick={() => handleSelect(bucket)}
              >
                <span className="option-name truncate flex-1">
                  {bucket.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(bucket.name, e);
                  }}
                >
                  ❌
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BucketSelector;
