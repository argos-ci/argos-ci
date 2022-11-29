import { Link as RouterLink, useNavigate } from "react-router-dom";
import { graphql, FragmentType, useFragment, DocumentType } from "@/gql";
import { OwnerAvatar } from "@/modern/containers/OwnerAvatar";
import { Badge } from "@/modern/ui/Badge";
import { HTMLProps } from "react";
import { Anchor } from "@/modern/ui/Link";
import config from "@/config";

const RepositoryFragment = graphql(`
  fragment RepositoryList_repository on Repository {
    id
    name
    enabled
    owner {
      id
      login
      name
    }
    builds(first: 0, after: 0) {
      pageInfo {
        totalCount
      }
    }
  }
`);

type Repository = DocumentType<typeof RepositoryFragment>;
type RepositoryFragmentType = FragmentType<typeof RepositoryFragment>;

const FakeRouterLink = ({
  to,
  ...props
}: HTMLProps<HTMLDivElement> & { to: string }) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={(event) => {
        event.preventDefault();
        navigate(to);
      }}
      {...props}
    />
  );
};

const RepositoryRow = ({ repository }: { repository: Repository }) => {
  return (
    <RouterLink
      key={repository.id}
      to={`/${repository.owner.login}/${repository.name}`}
      className="flex items-center justify-between rounded bg-slate-900/70 p-3 font-medium text-on-light transition hover:bg-slate-900"
    >
      <div className="flex-shink-0 flex gap-1">
        <FakeRouterLink
          to={`/${repository.owner.login}`}
          className="transition hover:text-on hover:brightness-125"
        >
          <span className="flex gap-2">
            <OwnerAvatar
              owner={repository.owner}
              size={24}
              className="flex-shrink-0"
            />
            {repository.owner.login}
          </span>
        </FakeRouterLink>
        <span className="text-on-light">/</span>
        <FakeRouterLink
          to={`/${repository.owner.login}/${repository.name}`}
          className="transition hover:text-on"
        >
          {repository.name}
        </FakeRouterLink>
      </div>
      <div className="">
        <Badge>
          {repository.builds.pageInfo.totalCount}{" "}
          {repository.builds.pageInfo.totalCount > 1 ? "builds" : "build"}
        </Badge>
      </div>
    </RouterLink>
  );
};

const Group = (props: { label: string; children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium text-on-light">{props.label}</div>
      <div className="flex flex-col gap-1">{props.children}</div>
    </div>
  );
};

export const RepositoryList = (props: {
  repositories: RepositoryFragmentType[];
}) => {
  const repositories = useFragment(RepositoryFragment, props.repositories);

  const [enabledRepos, disabledRepos] = repositories.reduce(
    ([enabled, disabled], repo) => {
      if (repo.enabled) {
        enabled.push(repo);
      } else {
        disabled.push(repo);
      }
      return [enabled, disabled];
    },
    [[], []] as [Repository[], Repository[]]
  );

  return (
    <div className="flex flex-col gap-4">
      {enabledRepos.length > 0 && (
        <Group label="Active repositories">
          {enabledRepos.map((repository) => (
            <RepositoryRow key={repository.id} repository={repository} />
          ))}
        </Group>
      )}
      {disabledRepos.length > 0 && (
        <Group label="Inactive repositories">
          {disabledRepos.map((repository) => (
            <RepositoryRow key={repository.id} repository={repository} />
          ))}
        </Group>
      )}
      <div className="text-center text-xs text-on-light">
        Don&apos;t see your repo?{" "}
        <Anchor href={config.get("github.appUrl")} external>
          Manage access restrictions
        </Anchor>{" "}
        or <Anchor href="">reload the page</Anchor>.
      </div>
    </div>
  );
};
