import express from "express";
import {
  authRefreshMiddleware,
  getHubs,
  getProjects,
  getProjectContents,
  getItemVersions,
} from "../services/aps.js";

let router = express.Router();

router.use("/api/hubs", authRefreshMiddleware);

router.get("/api/hubs", async function (req, res, next) {
  try {
    const hubs = await getHubs(req.internalOAuthToken.access_token);
    res.json(hubs.map((hub) => ({ id: hub.id, name: hub.attributes.name })));
  } catch (err) {
    next(err);
  }
});

router.get("/api/hubs/:hub_id/projects", async function (req, res, next) {
  try {
    const projects = await getProjects(
      req.params.hub_id,
      req.internalOAuthToken.access_token
    );
    res.json(
      projects.map((project) => ({
        id: project.id,
        name: project.attributes.name,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get(
  "/api/hubs/:hub_id/projects/:project_id/contents",
  async function (req, res, next) {
    try {
      const entries = await getProjectContents(
        req.params.hub_id,
        req.params.project_id,
        req.query.folder_id,
        req.internalOAuthToken.access_token
      );
      res.json(
        entries.map((entry) => ({
          id: entry.id,
          name: entry.attributes.displayName,
          folder: entry.type === "folders",
        }))
      );
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/api/hubs/:hub_id/projects/:project_id/contents/:item_id/versions",
  async function (req, res, next) {
    try {
      const versions = await getItemVersions(
        req.params.project_id,
        req.params.item_id,
        req.internalOAuthToken.access_token
      );
      res.json(
        versions.map((version) => {
          // For APS viewer, we need the base64-encoded URN
          // The version.id is in format like "urn:adsk.wipprod:fs.file:vf.xyz123?version=1"
          // We need to extract and encode this properly
          const versionUrn = version.id;
          const base64Urn = Buffer.from(versionUrn)
            .toString("base64")
            .replace(/=/g, "");

          return {
            id: version.id,
            urn: base64Urn, // Add the encoded URN for viewing
            name: version.attributes.createTime,
          };
        })
      );
    } catch (err) {
      next(err);
    }
  }
);

export default router;
