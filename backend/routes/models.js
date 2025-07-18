import express from "express";
import formidable from "express-formidable";
import {
  authRefreshMiddleware,
  listObjects,
  uploadObject,
  translateObject,
  getManifest,
  urnify,
  deurnify,
} from "../services/aps.js";

let router = express.Router();

router.use("/api/models", authRefreshMiddleware);

router.get("/api/models", async (req, res, next) => {
  try {
    const bucketUrn = req.query.bucket;

    if (!bucketUrn) {
      return res.status(400).json({
        error: "Bucket parameter is required. Provide ?bucket=<bucketKey>",
      });
    }

    const bucketName = deurnify(bucketUrn);
    const objects = await listObjects(bucketName);

    res.json(
      objects.map((obj) => ({
        name: obj.objectKey,
        urn: urnify(obj.objectId),
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.get("/api/models/:urn/status", async (req, res, next) => {
  try {
    const manifest = await getManifest(req.params.urn);
    if (manifest) {
      let messages = [];
      if (manifest.derivatives) {
        for (const derivative of manifest.derivatives) {
          messages = messages.concat(derivative.messages || []);
          if (derivative.children) {
            for (const child of derivative.children) {
              messages = messages.concat(child.messages || []);
            }
          }
        }
      }

      // Log detailed information for failed translations
      if (manifest.status === "failed") {
        console.error(`Translation failed for URN: ${req.params.urn}`);
        console.error("Failure messages:", messages);
      }

      res.json({
        status: manifest.status,
        progress: manifest.progress,
        messages,
        // Add additional debugging info for failed translations
        ...(manifest.status === "failed" && {
          errorDetails: {
            derivatives:
              manifest.derivatives?.map((d) => ({
                status: d.status,
                progress: d.progress,
                messages: d.messages,
                outputType: d.outputType,
              })) || [],
          },
        }),
      });
    } else {
      res.json({ status: "n/a" });
    }
  } catch (error) {
    next(error);
  }
});

router.post(
  "/api/models",
  formidable({ maxFileSize: Infinity }),
  async (req, res, next) => {
    const file = req.files["model-file"];
    if (!file) {
      res.status(400).send("The required field 'model-file' is missing.");
      return;
    }

    // Validate file type
    const supportedExtensions = [
      ".dwg",
      ".dwf",
      ".dwfx",
      ".ifc",
      ".rvt",
      ".nwd",
      ".nwc",
      ".nwf",
      ".3dm",
      ".3ds",
      ".asm",
      ".catpart",
      ".catproduct",
      ".cgr",
      ".collaboration",
      ".dae",
      ".dgn",
      ".dlv3",
      ".exp",
      ".f3d",
      ".fbx",
      ".g",
      ".gbxml",
      ".iam",
      ".idw",
      ".ifc",
      ".ige",
      ".iges",
      ".igs",
      ".ipt",
      ".jt",
      ".max",
      ".model",
      ".neu",
      ".nwc",
      ".nwd",
      ".nwf",
      ".obj",
      ".prt",
      ".psm",
      ".rcp",
      ".rvt",
      ".sab",
      ".sat",
      ".session",
      ".skp",
      ".sldasm",
      ".sldprt",
      ".smb",
      ".smt",
      ".ste",
      ".step",
      ".stl",
      ".stp",
      ".wire",
      ".x_b",
      ".x_t",
      ".xas",
      ".xpr",
      ".zip",
    ];

    const fileExt = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));
    if (!supportedExtensions.includes(fileExt)) {
      res.status(400).json({
        error: `Unsupported file type: ${fileExt}. Supported types: ${supportedExtensions.join(
          ", "
        )}`,
      });
      return;
    }

    console.log(`Processing file: ${file.name} (${fileExt})`);

    // Special handling for ZIP files
    if (fileExt === ".zip" && !req.fields["model-zip-entrypoint"]) {
      res.status(400).json({
        error:
          "ZIP files require a model-zip-entrypoint field specifying the main file within the archive",
      });
      return;
    }

    try {
      let bucketName;

      if (req.fields["bucket-urn"]) {
        bucketName = deurnify(req.fields["bucket-urn"]);
        console.log(`Uploading to bucket: ${bucketName}`);
      } else {
        res.status(400).json({ error: "bucket-urn field is required" });
        return;
      }

      const obj = await uploadObject(file.name, file.path, bucketName);
      console.log("File uploaded successfully:", obj.objectKey);

      console.log("Starting translation process...");
      await translateObject(
        urnify(obj.objectId),
        req.fields["model-zip-entrypoint"]
      );
      console.log("Translation started successfully");

      res.json({
        name: obj.objectKey,
        urn: urnify(obj.objectId),
      });
    } catch (error) {
      console.error("Model upload/translation error:", error);
      res.status(500).json({
        error: error.message,
        details: error.axiosError?.response?.data || "Unknown error",
      });
      return;
    }
  }
);

// Debug endpoint to get full manifest details
router.get("/api/models/:urn/manifest", async (req, res, next) => {
  try {
    const manifest = await getManifest(req.params.urn);
    if (manifest) {
      res.json(manifest);
    } else {
      res.status(404).json({ error: "Manifest not found" });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
