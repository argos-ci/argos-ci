import * as React from "react";
import { MarkGithubIcon } from "@primer/octicons-react";

import config from "@/config";
import { FragmentType, graphql, useFragment } from "@/gql";
import { LinkButton } from "@/ui/Button";
import {
  Card,
  CardBody,
  CardFooter,
  CardParagraph,
  CardTitle,
} from "@/ui/Card";
import { Link } from "@/ui/Link";

import { AccountLink } from "../GithubAccountLink";

const TeamFragment = graphql(`
  fragment TeamGitHubLight_Team on Team {
    id
    githubLightInstallation {
      id
      ghAccount {
        id
        login
        name
        url
      }
    }
  }
`);

export const TeamGitHubLight = (props: {
  team: FragmentType<typeof TeamFragment>;
}) => {
  const team = useFragment(TeamFragment, props.team);

  return (
    <Card>
      <CardBody>
        <CardTitle id="github-light">GitHub witout content access</CardTitle>
        <CardParagraph>
          Setup a GitHub app without content read permissions to use Argos
          without giving access to your code.
        </CardParagraph>
        {team.githubLightInstallation && (
          <div>
            <div className="flex items-center gap-2 rounded border p-4">
              <MarkGithubIcon className="size-6 shrink-0" />
              <div className="flex-1 font-semibold">
                {team.githubLightInstallation.ghAccount ? (
                  <AccountLink
                    login={team.githubLightInstallation.ghAccount.login}
                    name={team.githubLightInstallation.ghAccount.name}
                    url={team.githubLightInstallation.ghAccount.url}
                  />
                ) : (
                  "Unknown"
                )}
              </div>
            </div>
          </div>
        )}
      </CardBody>
      <CardFooter className="flex items-center justify-between">
        <p>
          Learn more about{" "}
          <Link href="https://argos-ci.com/docs/gitlab" target="_blank">
            using GitHub without content read permissions
          </Link>
          .
        </p>
        {team.githubLightInstallation ? (
          <LinkButton
            variant="secondary"
            href={`${config.get("githubLight.appUrl")}/installations/new`}
          >
            Uninstall
          </LinkButton>
        ) : (
          <LinkButton
            href={`${config.get(
              "githubLight.appUrl",
            )}/installations/new?state=${encodeURIComponent(JSON.stringify({ accountId: team.id }))}`}
          >
            Install GitHub App
          </LinkButton>
        )}
      </CardFooter>
    </Card>
  );
};