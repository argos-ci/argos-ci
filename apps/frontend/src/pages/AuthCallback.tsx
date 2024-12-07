import { useEffect, useState } from "react";
import * as Sentry from "@sentry/react";
import axios, { isAxiosError } from "axios";
import { Helmet } from "react-helmet";
import { Navigate, useParams, useSearchParams } from "react-router-dom";

import config from "@/config";
import { useAuth, useIsLoggedIn } from "@/containers/Auth";
import { Layout } from "@/containers/Layout";
import { UniversalNavigate } from "@/containers/Redirect";
import { Alert, AlertActions, AlertText, AlertTitle } from "@/ui/Alert";
import { LinkButton } from "@/ui/Button";
import { Container } from "@/ui/Container";
import {
  AuthProvider,
  checkIsAuthProvider,
  getRedirectFromState,
} from "@/util/oauth";

import { NotFound } from "./NotFound";

const api = axios.create({
  baseURL: config.get("api.baseUrl"),
});

function extractErrorMessage(error: unknown) {
  if (isAxiosError(error) && error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return null;
}

function getLoginUrl(error: unknown) {
  const errorMessage = extractErrorMessage(error);
  if (errorMessage) {
    return `/login?error=${encodeURIComponent(errorMessage)}`;
  }
  return "/login";
}

function AuthCallback(props: { provider: AuthProvider }) {
  const { provider } = props;
  const [params] = useSearchParams();
  const code = params.get("code");
  const state = params.get("state");
  const errorParam = params.get("error");
  const redirectUri = state ? getRedirectFromState({ state, provider }) : null;
  const { setToken, token } = useAuth();
  const [initialToken] = useState(token);
  const [authError, setAuthError] = useState<Error | null>(null);
  useEffect(() => {
    if (!code) {
      return;
    }

    api
      .post(
        `/auth/${provider}`,
        { code },
        {
          headers: {
            Authorization: initialToken ? `Bearer ${initialToken}` : undefined,
          },
        },
      )
      .then((result) => {
        setToken(result.data.jwt);
      })
      .catch((error) => {
        setAuthError(error);
      });
  }, [code, setToken, initialToken, provider]);

  // If a authError is thrown, it will be caught by the ErrorBoundary.
  if (authError) {
    throw authError;
  }

  if (!code || !redirectUri) {
    throw <UniversalNavigate to={redirectUri ?? "/login"} replace />;
  }

  // If there is an error param, redirect to the login page.
  if (errorParam) {
    return <UniversalNavigate to="/login" replace />;
  }

  // If the token changes, redirect to the original page.
  if (token && initialToken !== token) {
    return <UniversalNavigate to={redirectUri} replace />;
  }

  return null;
}

function ErrorFallback(props: { error: unknown; provider: AuthProvider }) {
  const { error, provider } = props;
  const isLoggedIn = useIsLoggedIn();
  const [params] = useSearchParams();

  if (isLoggedIn) {
    const state = params.get("state");
    const redirectUri = state
      ? getRedirectFromState({ state, provider })
      : null;
    const errorMessage = extractErrorMessage(error);
    if (errorMessage) {
      return (
        <Layout>
          <Container>
            <Helmet>
              <title>Authentication error</title>
            </Helmet>
            <Alert>
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertText>{errorMessage}</AlertText>
              <AlertActions>
                <LinkButton href={redirectUri ?? "/"}>Back</LinkButton>
              </AlertActions>
            </Alert>
          </Container>
        </Layout>
      );
    }
    return <Navigate to={redirectUri ?? "/"} replace />;
  }

  return <UniversalNavigate to={getLoginUrl(error)} replace />;
}

/** @route */
export function Component() {
  const params = useParams();
  const { provider } = params;
  if (!provider || !checkIsAuthProvider(provider)) {
    return <NotFound />;
  }

  return (
    <Sentry.ErrorBoundary
      fallback={({ error }) => (
        <ErrorFallback error={error} provider={provider} />
      )}
    >
      <AuthCallback provider={provider} />
    </Sentry.ErrorBoundary>
  );
}
