import express, { Router } from "express";

import { job as crawlJob } from "@argos-ci/crawl";
import { transaction } from "@argos-ci/database";
import { Crawl, Repository } from "@argos-ci/database/models";

import { SHA1_REGEX_STR } from "../../../constants.js";
import { repoAuth } from "../../../middlewares/repoAuth.js";
import { validate } from "../../../middlewares/validate.js";
import { asyncHandler } from "../../../util.js";
import { createBuild } from "../util.js";

const router = Router();
export default router;

const validateRoute = validate({
  body: {
    type: "object",
    required: ["commit", "branch", "baseUrl"],
    properties: {
      commit: {
        type: "string",
        pattern: SHA1_REGEX_STR,
      },
      branch: {
        type: "string",
      },
      baseUrl: {
        type: "string",
      },
    },
  },
});

type CreateRequest = express.Request<
  Record<string, never>,
  Record<string, never>,
  {
    commit: string;
    branch: string;
    baseUrl: string;
  }
> & { authRepository: Repository };

router.post(
  "/crawls",
  repoAuth,
  express.json(),
  validateRoute,
  asyncHandler(async (req, res) => {
    const ctx = { req } as { req: CreateRequest };

    const { build, crawl } = await transaction(async (trx) => {
      const { req } = ctx;
      const build = await createBuild({ req, trx });

      const crawl = await Crawl.query(trx).insertAndFetch({
        buildId: build.id,
        jobStatus: "pending",
        baseUrl: req.body.baseUrl,
      });

      crawlJob.push(crawl.id);

      return { build, crawl };
    });

    const buildUrl = await build.getUrl();

    res.status(201).send({
      build: { id: build.id, url: buildUrl },
      crawl: { id: crawl.id, baseUrl: crawl.baseUrl },
    });
  })
);