import { graphql } from "@/gql";
import { Button } from "@/ui/Button";
import { List, ListRow } from "@/ui/List";
import { Loader } from "@/ui/Loader";
import { Time } from "@/ui/Time";

import { Query } from "./Apollo";

const InstallationQuery = graphql(`
  query RepositoryList_repository($installationId: ID!, $page: Int!) {
    ghApiInstallationRepositories(
      installationId: $installationId
      page: $page
    ) {
      edges {
        id
        name
        updated_at
        owner_login
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`);

export const RepositoryList = (props: {
  installationId: string;
  importRepo: (repo: { id: string; name: string; owner_login: string }) => void;
  disabled?: boolean;
}) => {
  return (
    <Query
      fallback={<Loader />}
      query={InstallationQuery}
      variables={{ installationId: props.installationId, page: 1 }}
    >
      {({ ghApiInstallationRepositories }) => {
        return (
          <List className="overflow-auto">
            {ghApiInstallationRepositories.edges.map((repo) => (
              <ListRow key={repo.id} className="justify-between p-4">
                <div>
                  {repo.name} •{" "}
                  <Time date={repo.updated_at} className="text-on-light" />
                </div>
                <Button
                  onClick={() => {
                    props.importRepo(repo);
                  }}
                  disabled={props.disabled}
                >
                  Import
                </Button>
              </ListRow>
            ))}
          </List>
        );
      }}
    </Query>
  );
};