exports.seed = (knex) =>
  knex("screenshots")
    .delete()
    .then(() =>
      Promise.all([
        knex("screenshots").insert([
          {
            id: "1",
            screenshotBucketId: "1",
            name: "ListItem_IconListItem.png",
            s3Id: "1.png",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            screenshotBucketId: "2",
            name: "ListItem_IconListItem.png",
            s3Id: "2.png",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "3",
            screenshotBucketId: "3",
            name: "ListItem_IconListItem.png",
            s3Id: "3.png",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "4",
            screenshotBucketId: "4",
            name: "ListItem_IconListItem.png",
            s3Id: "4.png",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "5",
            screenshotBucketId: "5",
            name: "ListItem_IconListItem.png",
            s3Id: "5.png",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "6",
            screenshotBucketId: "6",
            name: "ListItem_IconListItem.png",
            s3Id: "6.png",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "7",
            screenshotBucketId: "6",
            name: "ListItem_PrimaryActionCheckboxListItem.png",
            s3Id: "05a852863ea417e63f0d8455c16f2add",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "8",
            screenshotBucketId: "6",
            name: "ListItem_PrimaryActionCheckboxListItem.png",
            s3Id: "e533d40fea973a0e9a4d191073128118",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "9",
            screenshotBucketId: "6",
            name: "ListItem_AvatarListItem.png",
            s3Id: "9.png",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      ])
    );
