import express from "express";
import {
  listBuckets,
  createBucket,
  deleteBucket,
  urnify,
} from "../services/aps.js";

let router = express.Router();

router.get("/api/buckets", async (req, res, next) => {
  try {
    const buckets = await listBuckets();
    res.json(
      buckets.map((bucket) => ({
        name: bucket.bucketKey,
        urn: urnify(bucket.bucketKey),
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.post("/api/buckets/create", async (req, res, next) => {
  try {
    const { bucketName } = req.body;
    if (!bucketName) {
      res.status(400).send("Bucket name is required.");
      return;
    }

    let sanitizedBucketName = bucketName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^[^a-z0-9]+/, "")
      .replace(/[^a-z0-9]+$/, "");

    if (sanitizedBucketName.length < 3) {
      res
        .status(400)
        .send(
          "Bucket name must be at least 3 characters long after sanitization."
        );
      return;
    }

    if (sanitizedBucketName.length > 128) {
      sanitizedBucketName = sanitizedBucketName.substring(0, 128);
    }

    await createBucket(sanitizedBucketName);

    res.json({
      name: sanitizedBucketName,
      urn: urnify(sanitizedBucketName),
    });
  } catch (error) {
    if (error.status === 409) {
      res.status(409).send(error.message);
      return;
    }
    next(error);
  }
});

router.delete("/api/buckets/:bucketName", async (req, res, next) => {
  try {
    const { bucketName } = req.params;
    if (!bucketName) {
      res.status(400).json({ error: "Bucket name is required." });
      return;
    }

    let sanitizedBucketName = bucketName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^[^a-z0-9]+/, "")
      .replace(/[^a-z0-9]+$/, "");

    const result = await deleteBucket(sanitizedBucketName);

    res.json({
      success: true,
      message: `Bucket "${sanitizedBucketName}" deleted successfully.`,
      result,
    });
  } catch (error) {
    console.error("Delete bucket error:", error);

    // Handle specific APS API errors
    if (error.axiosError && error.axiosError.response) {
      const status = error.axiosError.response.status;
      const errorData = error.axiosError.response.data;

      if (status === 403) {
        res.status(403).json({
          error:
            "Access denied. You can only delete buckets that you created. Buckets created by other applications or users cannot be deleted.",
          details: errorData,
        });
        return;
      }

      if (status === 404) {
        res.status(404).json({
          error: "Bucket not found or already deleted.",
          details: errorData,
        });
        return;
      }
    }

    res.status(500).json({
      error: error.message || "Failed to delete bucket",
      details: error.axiosError ? error.axiosError.response?.data : undefined,
    });
  }
});

// Keep the original route for backward compatibility
router.delete("/api/buckets", async (req, res, next) => {
  try {
    const { bucketName } = req.body;
    if (!bucketName) {
      res.status(400).send("Bucket name is required.");
      return;
    }

    let sanitizedBucketName = bucketName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^[^a-z0-9]+/, "")
      .replace(/[^a-z0-9]+$/, "");

    const result = await deleteBucket(sanitizedBucketName);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
    next(error);
  }
});

export default router;
