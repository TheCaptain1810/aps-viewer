import { AuthenticationClient, ResponseType } from "@aps_sdk/authentication";
import { DataManagementClient } from "@aps_sdk/data-management";
import { OssClient, Region, PolicyKey } from "@aps_sdk/oss";
import {
  ModelDerivativeClient,
  View,
  OutputType,
} from "@aps_sdk/model-derivative";
import {
  APS_CLIENT_ID,
  APS_CLIENT_SECRET,
  APS_CALLBACK_URL,
  INTERNAL_TOKEN_SCOPES,
  PUBLIC_TOKEN_SCOPES,
  APS_BUCKET,
} from "../config.js";

const authenticationClient = new AuthenticationClient();
const dataManagementClient = new DataManagementClient();
const ossClient = new OssClient();
const modelDerivativeClient = new ModelDerivativeClient();

const service = {};

const getInternalToken = async () => {
  const credentials = await authenticationClient.getTwoLeggedToken(
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    INTERNAL_TOKEN_SCOPES
  );
  return credentials.access_token;
};

export const getAuthorizationUrl = () =>
  authenticationClient.authorize(
    APS_CLIENT_ID,
    ResponseType.Code,
    APS_CALLBACK_URL,
    INTERNAL_TOKEN_SCOPES
  );

export const authCallbackMiddleware = async (req, res, next) => {
  const internalCredentials = await authenticationClient.getThreeLeggedToken(
    APS_CLIENT_ID,
    req.query.code,
    APS_CALLBACK_URL,
    {
      clientSecret: APS_CLIENT_SECRET,
    }
  );
  const publicCredentials = await authenticationClient.refreshToken(
    internalCredentials.refresh_token,
    APS_CLIENT_ID,
    {
      clientSecret: APS_CLIENT_SECRET,
      scopes: PUBLIC_TOKEN_SCOPES,
    }
  );
  req.session.public_token = publicCredentials.access_token;
  req.session.internal_token = internalCredentials.access_token;
  req.session.refresh_token = publicCredentials.refresh_token;
  req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;
  next();
};

export const authRefreshMiddleware = async (req, res, next) => {
  const { refresh_token, expires_at } = req.session;
  if (!refresh_token) {
    res.status(401).end();
    return;
  }

  if (expires_at < Date.now()) {
    const internalCredentials = await authenticationClient.refreshToken(
      refresh_token,
      APS_CLIENT_ID,
      {
        clientSecret: APS_CLIENT_SECRET,
        scopes: INTERNAL_TOKEN_SCOPES,
      }
    );
    const publicCredentials = await authenticationClient.refreshToken(
      internalCredentials.refresh_token,
      APS_CLIENT_ID,
      {
        clientSecret: APS_CLIENT_SECRET,
        scopes: PUBLIC_TOKEN_SCOPES,
      }
    );
    req.session.public_token = publicCredentials.access_token;
    req.session.internal_token = internalCredentials.access_token;
    req.session.refresh_token = publicCredentials.refresh_token;
    req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;
  }
  req.internalOAuthToken = {
    access_token: req.session.internal_token,
    expires_in: Math.round((req.session.expires_at - Date.now()) / 1000),
  };
  req.publicOAuthToken = {
    access_token: req.session.public_token,
    expires_in: Math.round((req.session.expires_at - Date.now()) / 1000),
  };
  next();
};

export const getUserProfile = async (accessToken) => {
  const resp = await authenticationClient.getUserInfo(accessToken);
  return resp;
};

export const getHubs = async (accessToken) => {
  const resp = await dataManagementClient.getHubs({ accessToken });
  return resp.data;
};

export const getProjects = async (hubId, accessToken) => {
  const resp = await dataManagementClient.getHubProjects(hubId, {
    accessToken,
  });
  return resp.data;
};

export const getProjectContents = async (
  hubId,
  projectId,
  folderId,
  accessToken
) => {
  if (!folderId) {
    const resp = await dataManagementClient.getProjectTopFolders(
      hubId,
      projectId,
      { accessToken }
    );
    return resp.data;
  } else {
    const resp = await dataManagementClient.getFolderContents(
      projectId,
      folderId,
      { accessToken }
    );
    return resp.data;
  }
};

export const getItemVersions = async (projectId, itemId, accessToken) => {
  const resp = await dataManagementClient.getItemVersions(projectId, itemId, {
    accessToken,
  });
  return resp.data;
};

/**
 * Ensures that a bucket exists, creating it if necessary.
 * Instead of checking existence first, we try to create and handle conflicts.
 *
 * @param {string} bucketKey - The key/name of the bucket
 * @returns {Promise<void>}
 * @throws {Error} If bucket creation fails for reasons other than 409 (conflict)
 */
service.ensureBucketExists = async (bucketKey) => {
  if (!bucketKey) {
    throw new Error("Bucket key is required");
  }
  
  const accessToken = await getInternalToken();
  try {
    // Try to create the bucket directly
    await ossClient.createBucket(
      Region.Us,
      { bucketKey: bucketKey, policyKey: PolicyKey.Persistent },
      { accessToken }
    );
    console.log(`Created new bucket: ${bucketKey}`);
  } catch (error) {
    // If bucket already exists (409), that's fine
    if (error.axiosError?.response?.status === 409) {
      console.log(`Bucket ${bucketKey} already exists, proceeding...`);
      return;
    } else {
      console.error(`Failed to ensure bucket ${bucketKey} exists:`, error.message);
      throw error;
    }
  }
};

/**
 * Lists all buckets accessible to the current application.
 * Handles pagination to retrieve all available buckets.
 *
 * @returns {Promise<Array<Object>>} Array of bucket objects
 */
service.listBuckets = async () => {
  const accessToken = await getInternalToken();
  let response = await ossClient.getBuckets({
    limit: 64,
    accessToken,
  });
  let buckets = response.items;
  while (response.next) {
    const startAt = new URL(response.next).searchParams.get("startAt");
    response = await ossClient.getBuckets({
      limit: 64,
      startAt,
      accessToken,
    });
    buckets = buckets.concat(response.items);
  }
  console.log("Buckets:", buckets);
  return buckets;
};

/**
 * Lists all objects in a specified bucket.
 * Handles pagination to retrieve all objects and ensures bucket exists.
 *
 * @param {string} [bucketKey=APS_BUCKET] - The bucket key to list objects from
 * @returns {Promise<Array<Object>>} Array of object metadata
 */
service.listObjects = async (bucketKey = APS_BUCKET) => {
  await service.ensureBucketExists(bucketKey);
  const accessToken = await getInternalToken();
  let response = await ossClient.getObjects(bucketKey, {
    limit: 64,
    accessToken,
  });
  let objects = response.items;
  while (response.next) {
    const startAt = new URL(response.next).searchParams.get("startAt");
    response = await ossClient.getObjects(bucketKey, {
      limit: 64,
      startAt,
      accessToken,
    });
    objects = objects.concat(response.items);
  }
  return objects;
};

service.createBucket = async (bucketName) => {
  if (!bucketName) {
    throw new Error("Bucket name is required");
  }

  const accessToken = await getInternalToken();

  try {
    const bucket = await ossClient.createBucket(
      Region.Us,
      { bucketKey: bucketName, policyKey: PolicyKey.Persistent },
      { accessToken }
    );
    console.log(`Successfully created bucket: ${bucketName}`);
    return bucket;
  } catch (error) {
    const status = error.axiosError?.response?.status;
    const errorData = error.axiosError?.response?.data;
    
    if (status === 409) {
      // Bucket already exists - provide helpful error message
      const conflictError = new Error(
        `Bucket name '${bucketName}' already exists. Please choose a different name.`
      );
      conflictError.status = 409;
      throw conflictError;
    } else if (status === 400) {
      // Bad request - likely invalid bucket name
      const badRequestError = new Error(
        `Invalid bucket name '${bucketName}'. Bucket names must be 3-128 characters, lowercase, alphanumeric with hyphens allowed.`
      );
      badRequestError.status = 400;
      throw badRequestError;
    } else {
      // Other errors
      console.error(`Failed to create bucket ${bucketName}:`, error.message);
      throw error;
    }
  }
};

service.uploadObject = async (objectName, filePath, bucketKey = APS_BUCKET) => {
  await service.ensureBucketExists(bucketKey);
  const accessToken = await getInternalToken();
  const obj = await ossClient.uploadObject(bucketKey, objectName, filePath, {
    accessToken,
  });
  return obj;
};

service.translateObject = async (urn, rootFilename) => {
  const accessToken = await getInternalToken();
  const job = await modelDerivativeClient.startJob(
    {
      input: {
        urn,
        compressedUrn: !!rootFilename,
        rootFilename,
      },
      output: {
        formats: [
          {
            views: [View._2d, View._3d],
            type: OutputType.Svf2,
          },
        ],
      },
    },
    { accessToken }
  );
  return job.result;
};

service.getManifest = async (urn) => {
  const accessToken = await getInternalToken();
  try {
    const manifest = await modelDerivativeClient.getManifest(urn, {
      accessToken,
    });
    return manifest;
  } catch (err) {
    if (err.axiosError.response.status === 404) {
      return null;
    } else {
      throw err;
    }
  }
};

service.urnify = (id) => Buffer.from(id).toString("base64").replace(/=/g, "");

service.deurnify = (urn) => {
  const paddedUrn = urn + "=".repeat((4 - (urn.length % 4)) % 4);
  return Buffer.from(paddedUrn, "base64").toString();
};

service.deleteBucket = async (bucketName) => {
  const accessToken = await getInternalToken();

  try {
    await clearBucketObjects(bucketName, accessToken);

    console.log(`Attempting to delete bucket: ${bucketName}`);
    await ossClient.deleteBucket(bucketName, { accessToken });
    return {
      success: true,
      message: `Bucket '${bucketName}' deleted successfully.`,
    };
  } catch (error) {
    console.error("Bucket deletion error:", {
      status: error.axiosError?.response?.status,
      statusText: error.axiosError?.response?.statusText,
      data: error.axiosError?.response?.data,
    });

    return handleDeletionError(error, bucketName);
  }
};

async function clearBucketObjects(bucketName, accessToken) {
  try {
    const objects = await ossClient.getObjects(bucketName, { accessToken });

    if (objects.body?.items?.length > 0) {
      console.log(
        `Found ${objects.body.items.length} objects in bucket ${bucketName}`
      );

      for (const object of objects.body.items) {
        try {
          console.log(`Deleting object: ${object.objectKey}`);
          await ossClient.deleteObject(bucketName, object.objectKey, {
            accessToken,
          });
        } catch (objError) {
          console.error(
            `Failed to delete object ${object.objectKey}:`,
            objError.message
          );
        }
      }
    } else {
      console.log(`Bucket ${bucketName} appears to be empty`);
    }
  } catch (listError) {
    console.warn("Could not list bucket objects:", listError.message);
  }
}

function handleDeletionError(error, bucketName) {
  const status = error.axiosError?.response?.status;

  if (status === 404) {
    const notFoundError = new Error(`Bucket '${bucketName}' not found.`);
    notFoundError.status = 404;
    throw notFoundError;
  }

  if (status === 403) {
    let message = `Permission denied. Cannot delete bucket '${bucketName}'. `;
    const errorData = error.axiosError?.response?.data;

    if (errorData?.reason === "Bucket owner mismatch") {
      message += "This bucket was created by a different application or user.";
    } else if (errorData?.errorCode === "AUTH-003") {
      message += "Your access token doesn't have sufficient permissions.";
    } else {
      message +=
        "Common causes: 1) Bucket created by another app, 2) Missing delete permissions, 3) Hidden objects exist.";
    }

    const forbiddenError = new Error(message);
    forbiddenError.status = 403;
    throw forbiddenError;
  }

  if (status === 409) {
    const conflictError = new Error(
      `Bucket '${bucketName}' is not empty or has active operations.`
    );
    conflictError.status = 409;
    throw conflictError;
  }

  const genericError = new Error(
    `Failed to delete bucket '${bucketName}': ${error.message}`
  );
  genericError.status = status || 500;
  throw genericError;
}

// Export service functions
export const {
  ensureBucketExists,
  listBuckets,
  listObjects,
  createBucket,
  uploadObject,
  translateObject,
  getManifest,
  urnify,
  deurnify,
  deleteBucket,
} = service;
