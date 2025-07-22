import { AuthenticationClient, Scopes } from "@aps_sdk/authentication";
import { OssClient, Region, PolicyKey } from "@aps_sdk/oss";
import {
  ModelDerivativeClient,
  View,
  OutputType,
} from "@aps_sdk/model-derivative";
import { APS_CLIENT_ID, APS_CLIENT_SECRET, APS_BUCKET } from "../config.js";

const authenticationClient = new AuthenticationClient();
const ossClient = new OssClient();
const modelDerivativeClient = new ModelDerivativeClient();

async function getInternalToken() {
  const credentials = await authenticationClient.getTwoLeggedToken(
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    [
      Scopes.DataRead,
      Scopes.DataCreate,
      Scopes.DataWrite,
      Scopes.BucketCreate,
      Scopes.BucketRead,
      Scopes.BucketDelete,
    ]
  );
  return credentials.access_token;
}

const getViewerToken = async () => {
  return await authenticationClient.getTwoLeggedToken(
    APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    [Scopes.ViewablesRead]
  );
};

const ensureBucketExists = async (bucketKey) => {
  const accessToken = await getInternalToken();
  try {
    await ossClient.getBucketDetails(bucketKey, { accessToken });
  } catch (error) {
    if (error.axiosError.response.status === 404) {
      await ossClient.createBucket(
        Region.Us,
        { bucketKey: bucketKey, policyKey: PolicyKey.Persistent },
        { accessToken }
      );
    } else {
      throw error;
    }
  }
};

const listObjects = async (bucketName = APS_BUCKET) => {
  await ensureBucketExists(bucketName);
  const accessToken = await getInternalToken();
  let response = await ossClient.getObjects(bucketName, {
    limit: 64,
    accessToken,
  });
  let objects = response.items;
  while (response.next) {
    const startAt = new URL(response.next).searchParams.get("startAt");
    response = await ossClient.getObjects(bucketName, {
      limit: 64,
      startAt,
      accessToken,
    });
    objects = objects.concat(response.items);
  }
  return objects;
};

const uploadObject = async (objectName, filePath, bucketName = APS_BUCKET) => {
  await ensureBucketExists(bucketName);
  const accessToken = await getInternalToken();
  const obj = await ossClient.uploadObject(bucketName, objectName, filePath, {
    accessToken,
  });
  return obj;
};

const translateObject = async (urn, rootFilename) => {
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

const getManifest = async (urn) => {
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

const urnify = (id) => Buffer.from(id).toString("base64").replace(/=/g, "");

const deurnify = (urn) => Buffer.from(urn, "base64").toString();

const listBuckets = async () => {
  const accessToken = await getInternalToken();
  let response = await ossClient.getBuckets({ limit: 64, accessToken });
  let buckets = response.items || [];
  while (response.next) {
    const startAt = new URL(response.next).searchParams.get("startAt");
    response = await ossClient.getBuckets({
      limit: 64,
      startAt,
      accessToken,
    });
    buckets = buckets.concat(response.items || []);
  }
  return buckets;
};

const createBucket = async (bucketKey) => {
  const accessToken = await getInternalToken();
  return await ossClient.createBucket(
    Region.Us,
    { bucketKey: bucketKey, policyKey: PolicyKey.Persistent },
    { accessToken }
  );
};

const deleteBucket = async (bucketKey) => {
  const accessToken = await getInternalToken();
  return await ossClient.deleteBucket(bucketKey, { accessToken });
};

export {
  getInternalToken,
  getViewerToken,
  ensureBucketExists,
  listObjects,
  listBuckets,
  createBucket,
  deleteBucket,
  uploadObject,
  translateObject,
  getManifest,
  urnify,
  deurnify,
};
