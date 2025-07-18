import express from "express";
import multer from "multer";
import {
  authRefreshMiddleware,
  listBuckets,
  createBucket,
  deleteBucket,
  listObjects,
  uploadObject,
  translateObject,
  getManifest,
  urnify,
} from "../services/aps.js";

let router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

// Add auth middleware for all bucket routes
router.use("/api/hubs/buckets", authRefreshMiddleware);

router.get("/api/hubs/buckets", async (req, res, next) => {
  try {
    const buckets = await listBuckets();
    res.json(
      buckets.map((bucket) => ({
        id: bucket.bucketKey,
        name: bucket.bucketKey,
        createdDate: bucket.createdDate,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.post("/api/hubs/buckets", async (req, res, next) => {
  try {
    const { bucketName } = req.body;
    if (!bucketName) {
      res.status(400).json({ error: "Bucket name is required." });
      return;
    }

    let sanitizedBucketName = bucketName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^[^a-z0-9]+/, "")
      .replace(/[^a-z0-9]+$/, "");

    if (sanitizedBucketName.length < 3) {
      res.status(400).json({
        error:
          "Bucket name must be at least 3 characters long after sanitization.",
      });
      return;
    }

    if (sanitizedBucketName.length > 128) {
      sanitizedBucketName = sanitizedBucketName.substring(0, 128);
    }

    const bucket = await createBucket(sanitizedBucketName);

    res.status(201).json({
      id: sanitizedBucketName,
      name: sanitizedBucketName,
      createdDate: bucket.createdDate,
    });
  } catch (error) {
    if (error.status === 409) {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
});

router.delete("/api/hubs/buckets/:bucketKey", async (req, res, next) => {
  try {
    const { bucketKey } = req.params;
    if (!bucketKey) {
      res.status(400).json({ error: "Bucket name is required." });
      return;
    }

    let sanitizedBucketName = bucketKey
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^[^a-z0-9]+/, "")
      .replace(/[^a-z0-9]+$/, "");

    const result = await deleteBucket(sanitizedBucketName);

    res.json(result);
  } catch (error) {
    if (error.status === 409) {
      res.status(409).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message });
    next(error);
  }
});

// Object management routes
router.get("/api/hubs/buckets/:bucketKey/objects", async (req, res, next) => {
  try {
    const { bucketKey } = req.params;
    const objects = await listObjects(bucketKey);
    res.json(
      objects.map((obj) => ({
        id: obj.objectKey,
        name: obj.objectKey,
        urn: urnify(obj.objectId),
        size: obj.size,
        lastModified: obj.lastModified,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.post(
  "/api/hubs/buckets/:bucketKey/objects",
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { bucketKey } = req.params;
      const file = req.file;

      console.log("=== BUCKET UPLOAD DEBUG ===");
      console.log("URL params:", req.params);
      console.log("Bucket key:", bucketKey);
      console.log("File:", file ? file.originalname : "No file");
      console.log("=========================");

      if (!bucketKey || bucketKey === "undefined") {
        return res.status(400).json({
          error: "Invalid bucket key provided",
          received: bucketKey,
        });
      }

      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Upload the object
      const obj = await uploadObject(file.originalname, file.path, bucketKey);

      // Start translation
      const urn = urnify(obj.objectId);
      await translateObject(urn, file.originalname);

      res.status(201).json({
        id: obj.objectKey,
        name: obj.objectKey,
        urn: urn,
        size: obj.size,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/api/hubs/buckets/:bucketKey/objects/:objectName/status",
  async (req, res, next) => {
    try {
      const { bucketKey, objectName } = req.params;
      const urn = urnify(
        `urn:adsk.objects:os.object:${bucketKey}/${objectName}`
      );

      const manifest = await getManifest(urn);
      if (!manifest) {
        return res.json({ status: "pending" });
      }

      const status = manifest.status;
      res.json({
        status: status,
        progress: manifest.progress || "0% complete",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
