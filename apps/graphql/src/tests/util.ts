import type { ApolloServer } from "apollo-server-express";
import express from "express";

import type { Account, User } from "@argos-ci/database/models";

let started = false;

export const createApolloServerApp = async (
  apolloServer: ApolloServer,
  auth: { user: User; account: Account } | null
) => {
  const app = express();
  app.use(((req, _res, next) => {
    // @ts-ignore
    req.auth = auth;
    next();
  }) as express.RequestHandler);

  if (!started) {
    await apolloServer.start();
  }
  started = true;
  apolloServer.applyMiddleware({ app });

  return app;
};
