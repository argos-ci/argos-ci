exports.seed = (knex, Promise) => {
  return knex('builds').delete()
    .then(() => {
      return Promise.all([
        knex('builds').insert({
          id: 1,
          baseScreenshotBucketId: 1,
          compareScreenshotBucketId: 1,
          repositoryId: 1,
          createdAt: '2016-12-08T22:59:55Z',
          updatedAt: '2016-12-08T22:59:55Z',
        }),
        knex('builds').insert({
          id: 2,
          baseScreenshotBucketId: 1,
          compareScreenshotBucketId: 2,
          repositoryId: 1,
          createdAt: '2016-12-12T17:44:29Z',
          updatedAt: '2016-12-12T17:44:29Z',
        }),
        knex('builds').insert({
          id: 3,
          baseScreenshotBucketId: 2,
          compareScreenshotBucketId: 3,
          repositoryId: 1,
          createdAt: '2017-02-02T19:55:09Z',
          updatedAt: '2017-02-02T19:55:09Z',
        }),
        knex('builds').insert({
          id: 4,
          baseScreenshotBucketId: 3,
          compareScreenshotBucketId: 4,
          repositoryId: 1,
          createdAt: '2017-02-05T23:46:59Z',
          updatedAt: '2017-02-05T23:46:59Z',
        }),
        knex('builds').insert({
          id: 5,
          baseScreenshotBucketId: 4,
          compareScreenshotBucketId: 5,
          repositoryId: 1,
          createdAt: '2017-02-06T01:27:34Z',
          updatedAt: '2017-02-06T01:27:34Z',
        }),
        knex('builds').insert({
          id: 6,
          baseScreenshotBucketId: 5,
          compareScreenshotBucketId: 6,
          repositoryId: 1,
          createdAt: '2017-02-06T01:41:35Z',
          updatedAt: '2017-02-06T01:41:35Z',
        }),
      ])
    })
}
