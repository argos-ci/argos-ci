import { useApolloClient } from "@apollo/client";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";

import { DocumentType, graphql } from "@/gql";
import { TeamDefaultUserLevel } from "@/gql/graphql";
import { Card, CardBody, CardParagraph, CardTitle } from "@/ui/Card";
import { Form } from "@/ui/Form";
import { FormCardFooter } from "@/ui/FormCardFooter";
import { FormRadio, FormRadioGroup } from "@/ui/FormRadio";
import { Link } from "@/ui/Link";

const _TeamFragment = graphql(`
  fragment TeamAccessRole_Team on Team {
    id
    defaultUserLevel
  }
`);

const SetTeamDefaultUserLevelMutation = graphql(`
  mutation TeamAccessUserLevel_setTeamDefaultUserLevel(
    $teamAccountId: ID!
    $level: TeamDefaultUserLevel!
  ) {
    setTeamDefaultUserLevel(
      input: { teamAccountId: $teamAccountId, level: $level }
    ) {
      ...TeamAccessRole_Team
    }
  }
`);

type Inputs = {
  level: TeamDefaultUserLevel;
};

export function TeamAccessRole(props: {
  team: DocumentType<typeof _TeamFragment>;
}) {
  const { team } = props;
  const form = useForm<Inputs>({
    defaultValues: {
      level: team.defaultUserLevel,
    },
  });

  const client = useApolloClient();

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    await client.mutate({
      mutation: SetTeamDefaultUserLevelMutation,
      variables: {
        teamAccountId: team.id,
        level: data.level,
      },
    });
    form.reset(data);
  };

  return (
    <Card>
      <FormProvider {...form}>
        <Form onSubmit={onSubmit}>
          <CardBody>
            <CardTitle>Default access role</CardTitle>
            <CardParagraph>
              Choose the role assigned to members who are either invited to the
              Team or synchronized from Single Sign-On (SSO).
            </CardParagraph>
            <FormRadioGroup>
              <FormRadio
                {...form.register("level")}
                value="member"
                label={
                  <div className="ml-2">
                    Member
                    <p className="text-low text-sm font-normal">
                      New members will have access to all projects.
                    </p>
                  </div>
                }
              />
              <FormRadio
                {...form.register("level")}
                value="contributor"
                label={
                  <div className="ml-2">
                    Contributor
                    <p className="text-low text-sm font-normal">
                      New members will not have access to any projects until you
                      add them to a project.
                    </p>
                  </div>
                }
              />
            </FormRadioGroup>
          </CardBody>
          <FormCardFooter>
            Learn more about{" "}
            <Link
              href="https://argos-ci.com/docs/team-members-and-roles"
              target="_blank"
            >
              access roles
            </Link>
            .
          </FormCardFooter>
        </Form>
      </FormProvider>
    </Card>
  );
}
