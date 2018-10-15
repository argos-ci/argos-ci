import { transaction } from 'objection'
import { HttpError, formatters } from 'express-err'
import express from 'express'
import multer from 'multer'
import S3 from 'aws-sdk/clients/s3'
import multerS3 from 'multer-s3'
import config from 'config'
import { formatUrlFromBuild } from 'modules/urls/buildUrl'
import Build from 'server/models/Build'
import Repository from 'server/models/Repository'
import ScreenshotBucket from 'server/models/ScreenshotBucket'
import ScreenshotBatch from 'server/models/ScreenshotBatch'
import buildJob from 'server/jobs/build'
import errorHandler from 'server/middlewares/errorHandler'

const router = new express.Router()
const s3 = new S3({
  signatureVersion: 'v4',
})
const upload = multer({
  storage: multerS3({
    s3,
    bucket: config.get('s3.screenshotsBucket'),
    contentType: multerS3.AUTO_CONTENT_TYPE,
  }),
})

/**
 * Takes a route handling function and returns
 * a function that wraps it in a `try/catch`. Caught
 * exceptions are forwarded to the `next` handler.
 */
export function errorChecking(routeHandler) {
  return async (req, res, next) => {
    try {
      await routeHandler(req, res, next)
    } catch (err) {
      // Handle objection errors
      const candidates = [err.status, err.statusCode, err.code, 500]
      err.status = candidates.find(Number.isInteger)
      next(err)
    }
  }
}

router.post(
  '/builds',
  upload.array('screenshots[]', 500),
  errorChecking(async (req, res) => {
    const data = JSON.parse(req.body.data)

    if (!data.token) {
      throw new HttpError(401, 'Missing token')
    }

    if (!data.commit) {
      throw new HttpError(401, 'Missing commit')
    }

    const repository = await Repository.query().findOne({ token: data.token })

    if (!repository) {
      throw new HttpError(400, `Repository not found (token: "${data.token}")`)
    }

    if (!repository.enabled) {
      throw new HttpError(400, `Repository not enabled (name: "${repository.name}")`)
    }

    const batchTotal = data.batchTotal ? Number(data.batchTotal) : null

    let build = await transaction(
      Build,
      ScreenshotBucket,
      ScreenshotBatch,
      async (Build, ScreenshotBucket, ScreenshotBatch) => {
        const build = data.buildId
          ? await Build.query()
              .eager('compareScreenshotBucket')
              .findOne({ externalId: data.buildId })
          : null

        const bucket = build
          ? build.compareScreenshotBucket
          : await ScreenshotBucket.query().insert({
              name: 'default',
              commit: data.commit,
              branch: data.branch,
              repositoryId: repository.id,
              batchTotal,
            })

        const batchId =
          data.batchId !== undefined
            ? (await ScreenshotBatch.query().insert({
                screenshotBucketId: bucket.id,
                externalId: data.batchId,
              })).id
            : null

        await bucket.$relatedQuery('screenshots').insert(
          req.files.map((file, index) => ({
            screenshotBucketId: bucket.id,
            name: data.names[index],
            s3Id: file.key,
            screenshotBatchId: batchId,
          }))
        )

        if (build) return build

        return Build.query().insert({
          baseScreenshotBucketId: null,
          compareScreenshotBucketId: bucket.id,
          repositoryId: repository.id,
          jobStatus: 'pending',
          externalId: data.buildId,
        })
      }
    )

    // So we don't reuse the previous transaction
<<<<<<< HEAD
    build = await Build.query()
      .where({ id: build.id })
      .limit(1)
      .first()
=======
    build = await Build.query().findById(build.id)
>>>>>>> feat: add support for batched uploads

    const buildUrl = await formatUrlFromBuild(build)

    if (batchTotal) {
      const screenshotBatchesCount = Number(
        (await ScreenshotBatch.query()
          .where({ screenshotBucketId: build.compareScreenshotBucketId })
          .countDistinct('externalId'))[0].count
      )

      if (screenshotBatchesCount >= batchTotal) {
        await buildJob.push(build.id)
      }
    } else {
      await buildJob.push(build.id)
    }

    res.send({ build: { ...build, repository: undefined, buildUrl } })
  })
)

router.get(
  '/buckets',
  errorChecking(async (req, res) => {
    let query = ScreenshotBucket.query()

    if (req.query.branch) {
      query = query.where({ branch: req.query.branch })
    }

    res.send(await query)
  })
)

router.use(
  errorHandler({
    formatters: {
      json: formatters.json,
      default: formatters.json,
    },
  })
)

export default router
