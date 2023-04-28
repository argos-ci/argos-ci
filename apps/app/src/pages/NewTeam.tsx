import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";

import { useAuthTokenPayload } from "@/containers/Auth";
import { TeamNewForm } from "@/containers/Team/NewForm";
import { Container } from "@/ui/Container";
import { Heading, Headline } from "@/ui/Typography";

export const NewTeam = () => {
  const navigate = useNavigate();
  const auth = useAuthTokenPayload();
  return (
    <>
      <Helmet>
        <title>New Team</title>
      </Helmet>
      <Container>
        <Heading>Create a Team</Heading>
        <Headline>
          A team alllows you to collaborate on one or several projects.
        </Headline>
        {auth && (
          <div className="mt-4 max-w-2xl">
            <TeamNewForm
              onCreate={(team) => {
                navigate(`/${team.slug}`);
              }}
              defaultTeamName={`${
                auth.account.name || auth.account.slug
              }'s Team`}
            />
          </div>
        )}
      </Container>
    </>
  );
};
