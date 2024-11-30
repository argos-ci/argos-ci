import { assertNever } from "@argos/util/assertNever";
import { MarkGithubIcon } from "@primer/octicons-react";

import config from "@/config";
import { ButtonIcon, LinkButton, LinkButtonProps } from "@/ui/Button";
import { useOAuthURL } from "@/util/oauth";

/**
 * Get the URL to install the GitHub app.
 */
export function getGitHubAppManageURL(app: "main" | "light") {
  const baseURL = (() => {
    switch (app) {
      case "main":
        return new URL(config.get("github.appUrl"));
      case "light":
        return new URL(config.get("githubLight.appUrl"));
      default:
        assertNever(app);
    }
  })();
  // /installations/new let you manage the installed app
  // that's why we use it here
  return new URL(
    `${baseURL.pathname}/installations/new`,
    baseURL.origin,
  ).toString();
}

export function getGitHubMainAppInstallUrl(input: { pathname: string }) {
  const url = new URL(getGitHubAppManageURL("main"));
  url.searchParams.set("state", input.pathname);
  return url.toString();
}

export function getGitHubLightAppInstallUrl(input: { accountId: string }) {
  const url = new URL(getGitHubAppManageURL("light"));
  url.searchParams.set("state", JSON.stringify({ accountId: input.accountId }));
  return url.toString();
}

export function GitHubLoginButton({
  children,
  redirect,
  ...props
}: Omit<LinkButtonProps, "children"> & {
  children?: React.ReactNode;
  redirect?: string | null;
}) {
  const url = useOAuthURL({
    provider: "github",
    redirect: redirect ?? null,
  });
  return (
    <LinkButton variant="github" href={url} {...props}>
      <ButtonIcon>
        <MarkGithubIcon />
      </ButtonIcon>
      {children ?? "Login with GitHub"}
    </LinkButton>
  );
}
