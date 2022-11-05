import gqlTag from "graphql-tag";

import config from "@argos-ci/config";
import type { ScreenshotDiff } from "@argos-ci/database/models";
import { s3 as getS3, getSignedGetObjectUrl } from "@argos-ci/storage";

import { ScreenshotLoader } from "../loaders.js";

const { gql } = gqlTag;

export const typeDefs = gql`
  enum ScreenshotDiffStatus {
    added
    stable
    updated
    failed
    removed
  }

  type ScreenshotDiff {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    buildId: ID!
    baseScreenshotId: ID
    baseScreenshot: Screenshot
    compareScreenshotId: ID
    compareScreenshot: Screenshot
    score: Float
    url: String
    "Represent the state of the job generating the diffs"
    jobStatus: JobStatus
    "Represent the status given by the user"
    validationStatus: ValidationStatus!
    status: ScreenshotDiffStatus!
    rank: Int
  }

  type ScreenshotDiffResult {
    pageInfo: PageInfo!
    edges: [ScreenshotDiff!]!
  }
`;

export const resolvers = {
  ScreenshotDiff: {
    baseScreenshot: async (screenshotDiff: ScreenshotDiff) => {
      if (!screenshotDiff.baseScreenshotId) return null;
      return ScreenshotLoader.load(screenshotDiff.baseScreenshotId);
    },
    compareScreenshot: async (screenshotDiff: ScreenshotDiff) => {
      if (!screenshotDiff.compareScreenshotId) return null;
      return ScreenshotLoader.load(screenshotDiff.compareScreenshotId);
    },
    url: (screenshotDiff: ScreenshotDiff) => {
      if (!screenshotDiff.s3Id) return null;
      const s3 = getS3();
      return getSignedGetObjectUrl({
        s3,
        Bucket: config.get("s3.screenshotsBucket"),
        Key: screenshotDiff.s3Id,
        expiresIn: 7200,
      });
    },
    status: async (screenshotDiff: ScreenshotDiff) => {
      if (!screenshotDiff.compareScreenshotId) return "removed";

      if (screenshotDiff.score === null) {
        const { name } = await ScreenshotLoader.load(
          screenshotDiff.compareScreenshotId
        );
        return name.match("(failed)") ? "failed" : "added";
      }

      return screenshotDiff.score > 0 ? "updated" : "stable";
    },
  },
};