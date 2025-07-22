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

const listObjects = async () => {
  await ensureBucketExists(APS_BUCKET);
  const accessToken = await getInternalToken();
  let response = await ossClient.getObjects(APS_BUCKET, {
    limit: 64,
    accessToken,
  });
  let objects = response.items;
  while (response.next) {
    const startAt = new URL(response.next).searchParams.get("startAt");
    response = await ossClient.getObjects(APS_BUCKET, {
      limit: 64,
      startAt,
      accessToken,
    });
    objects = objects.concat(response.items);
  }
  return objects;
};

const uploadObject = async (objectName, filePath) => {
  await ensureBucketExists(APS_BUCKET);
  const accessToken = await getInternalToken();
  const obj = await ossClient.uploadObject(APS_BUCKET, objectName, filePath, {
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

export {
  getInternalToken,
  getViewerToken,
  ensureBucketExists,
  listObjects,
  uploadObject,
  translateObject,
  getManifest,
  urnify,
};
