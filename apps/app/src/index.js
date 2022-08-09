import "core-js";
import React from "react";
import { render } from "react-dom";
import { init as initSentry } from "@sentry/browser";
import config from "./config";
import { App } from "./App";

if (process.env.NODE_ENV === "production") {
  initSentry({
    dsn: config.get("sentry.clientDsn"),
    environment: config.get("sentry.environment"),
    release: config.get("releaseVersion"),
  });
}

const renderRoot = () => {
  render(<App />, document.querySelector("#root"));
};

renderRoot();
