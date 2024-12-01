import { invariant } from "@argos/util/invariant";
import { omitUndefinedValues } from "@argos/util/omitUndefinedValues";
import slugify from "@sindresorhus/slugify";
import type { PartialModelObject } from "objection";

import { sendWelcomeEmail } from "@/email/send.js";
import type { RestEndpointMethodTypes } from "@/github/index.js";
import { GoogleUserProfile } from "@/google/index.js";
import logger from "@/logger/index.js";

import { Account } from "../models/Account.js";
import { GithubAccount } from "../models/GithubAccount.js";
import { GithubAccountMember } from "../models/GithubAccountMember.js";
import type { GitlabUser } from "../models/GitlabUser.js";
import { Team } from "../models/Team.js";
import { TeamUser } from "../models/TeamUser.js";
import { User } from "../models/User.js";
import { transaction } from "../transaction.js";
import { getPartialModelUpdate } from "../util/update.js";

const RESERVED_SLUGS = [
  "auth",
  "checkout-success",
  "login",
  "vercel",
  "invite",
  "teams",
];

/**
 * Get or create a GitHub account member.
 */
export async function getOrCreateGithubAccountMember(input: {
  githubAccountId: string;
  githubMemberId: string;
}) {
  const existing = await GithubAccountMember.query().findOne(input);
  if (existing) {
    return existing;
  }
  return GithubAccountMember.query().insertAndFetch(input);
}

/**
 * Join SSO teams if needed.
 */
export async function joinSSOTeams(input: {
  githubAccountId: string;
  userId: string;
}) {
  // Find teams that have SSO enabled
  // with the given GitHub account as a member
  // and where the user is not already a member
  const teams = await Team.query()
    .select("teams.id", "teams.defaultUserLevel")
    .joinRelated("ssoGithubAccount.members")
    .where("ssoGithubAccount:members.githubMemberId", input.githubAccountId)
    .whereNotExists(
      TeamUser.query()
        .where("userId", input.userId)
        .whereRaw('team_users."teamId" = teams.id'),
    );

  // If we found teams, we join the user to them
  if (teams.length > 0) {
    await TeamUser.query().insert(
      teams.map((team) => ({
        teamId: team.id,
        userId: input.userId,
        userLevel: team.defaultUserLevel,
      })),
    );
  }
}

export const checkAccountSlug = async (slug: string) => {
  if (RESERVED_SLUGS.includes(slug)) {
    throw new Error("Slug is reserved for internal usage");
  }
  const slugExists = await Account.query().findOne({ slug });
  if (slugExists) {
    throw new Error("Slug is already used by another account");
  }
};

async function resolveAccountSlug(
  slug: string,
  index: number = 0,
): Promise<string> {
  const nextSlug = index ? `${slug}-${index}` : slug;
  try {
    await checkAccountSlug(nextSlug);
  } catch {
    return resolveAccountSlug(slug, index + 1);
  }

  return nextSlug;
}

export const getGhAccountType = (strType: string) => {
  const type = strType.toLowerCase();
  if (type !== "user" && type !== "organization" && type !== "bot") {
    throw new Error(`Account of "${type}" is not supported`);
  }
  return type;
};

type GetOrCreateGhAccountProps = {
  githubId: number;
  login: string;
  type: GithubAccount["type"];
  email?: string | null | undefined;
  name?: string | null | undefined;
  accessToken?: GithubAccount["accessToken"] | undefined;
  scope?: GithubAccount["scope"] | undefined;
  lastLoggedAt?: GithubAccount["lastLoggedAt"] | undefined;
};

export async function getOrCreateGhAccount(props: GetOrCreateGhAccountProps) {
  const { githubId, type, ...rest } = props;
  const existing = await GithubAccount.query().findOne({ githubId });
  if (existing) {
    const toUpdate = getPartialModelUpdate(existing, rest);
    if (toUpdate) {
      return existing.$query().patchAndFetch(toUpdate);
    }
    return existing;
  }

  return GithubAccount.query().insertAndFetch({
    githubId,
    type,
    ...omitUndefinedValues(rest),
  });
}

export async function getOrCreateGhAccountFromGhProfile(
  profile: RestEndpointMethodTypes["users"]["getAuthenticated"]["response"]["data"],
  emails: RestEndpointMethodTypes["users"]["listEmailsForAuthenticatedUser"]["response"]["data"],
  options?: { accessToken?: string; lastLoggedAt?: string; scope?: string },
) {
  const email =
    emails.find((e) => e.primary && e.verified)?.email ??
    emails.find((e) => e.verified)?.email ??
    emails[0]?.email ??
    profile.email;

  return getOrCreateGhAccount({
    githubId: profile.id,
    login: profile.login,
    email,
    name: profile.name,
    type: getGhAccountType(profile.type),
    accessToken: options?.accessToken,
    lastLoggedAt: options?.lastLoggedAt,
    scope: options?.scope,
  });
}

export async function getOrCreateUserAccountFromGhAccount(
  ghAccount: GithubAccount,
  options?: { account?: Account | null },
): Promise<Account> {
  const email = ghAccount.email?.toLowerCase() ?? null;
  const attachToAccount = options?.account;

  const existingAccount = await Account.query()
    .withGraphFetched("user")
    .findOne({ githubAccountId: ghAccount.id });

  if (attachToAccount) {
    if (existingAccount && existingAccount.id !== attachToAccount.id) {
      throw new Error("GitHub account is already attached to another account");
    }

    if (
      attachToAccount.githubAccountId &&
      attachToAccount.githubAccountId !== ghAccount.id
    ) {
      throw new Error("Account is already attached to another GitHub account");
    }

    if (attachToAccount.githubAccountId !== ghAccount.id) {
      return attachToAccount
        .$query()
        .patchAndFetch({ githubAccountId: ghAccount.id });
    }

    return attachToAccount;
  }

  if (existingAccount) {
    const { user } = existingAccount;
    invariant(user, "user not fetched");

    const updateData: PartialModelObject<User> = {};

    if (user.email !== email) {
      const existingEmailUser = await User.query().findOne("email", email);
      if (!existingEmailUser) {
        updateData.email = email;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await user.$query().patchAndFetch(updateData);
    }

    return existingAccount;
  }

  if (email) {
    const existingEmailUser = await User.query()
      .findOne({ email })
      .withGraphFetched("account");

    if (existingEmailUser) {
      invariant(existingEmailUser.account, "account not fetched");

      return existingEmailUser.account.$query().patchAndFetch({
        githubAccountId: ghAccount.id,
      });
    }
  }

  const slug = await resolveAccountSlug(ghAccount.login.toLowerCase());

  const account = await transaction(async (trx) => {
    const user = await User.query(trx).insertAndFetch({ email });
    return Account.query(trx).insertAndFetch({
      userId: user.id,
      githubAccountId: ghAccount.id,
      name: ghAccount.name,
      slug,
    });
  });

  if (email) {
    await sendWelcomeEmail({ to: email });
  }

  return account;
}

export const getOrCreateUserAccountFromGitlabUser = async (
  gitlabUser: GitlabUser,
  options?: { account?: Account | null },
): Promise<Account> => {
  const email = gitlabUser.email.trim().toLowerCase();
  const attachToAccount = options?.account;

  if (attachToAccount) {
    const [user, existingUser] = await Promise.all([
      attachToAccount.$relatedQuery("user"),
      User.query().findOne({ gitlabUserId: gitlabUser.id }),
    ]);

    if (existingUser) {
      invariant(existingUser.account, "account not fetched");
      if (user.id !== existingUser.id) {
        throw new Error(
          "GitLab account is already attached to another account",
        );
      }
    }

    if (user.gitlabUserId && user.gitlabUserId !== gitlabUser.id) {
      throw new Error(
        "Account account is already attached to another GitLab account",
      );
    }

    if (user.gitlabUserId !== gitlabUser.id) {
      await user.$query().patch({ gitlabUserId: gitlabUser.id });
    }

    return attachToAccount;
  }

  const existingUsers = await User.query()
    .withGraphFetched("account")
    .where("gitlabUserId", gitlabUser.id)
    .orWhere("email", email);

  // If we match multiple accounts, it means that another
  // user has the same email or gitlabUserId
  // In this case we don't update anything and choose the one with gitLabUserId
  if (existingUsers.length > 1) {
    const userWithId = existingUsers.find(
      (u) => u.gitlabUserId === gitlabUser.id,
    );
    invariant(userWithId?.account, "account not fetched");
    return userWithId.account;
  }

  const existingUser = existingUsers[0];

  if (existingUser) {
    invariant(existingUser.account, "account not fetched");

    // Either update the gitlabUserId or the email if needed
    const data: PartialModelObject<User> = {};
    if (existingUser.gitlabUserId !== gitlabUser.id) {
      data.gitlabUserId = gitlabUser.id;
    }
    if (email && existingUser.email !== email) {
      data.email = email;
    }

    if (Object.keys(data).length > 0) {
      await existingUser.$clone().$query().patch(data);
    }

    return existingUser.account;
  }

  const slug = await resolveAccountSlug(gitlabUser.username.toLowerCase());

  const account = await transaction(async (trx) => {
    const user = await User.query(trx).insertAndFetch({
      email: gitlabUser.email,
      gitlabUserId: gitlabUser.id,
    });
    return Account.query(trx).insertAndFetch({
      userId: user.id,
      name: gitlabUser.name,
      slug,
    });
  });

  await sendWelcomeEmail({ to: gitlabUser.email });

  return account;
};

export async function getOrCreateAccountFromGoogleUserProfile(
  profile: GoogleUserProfile,
  options?: { account?: Account | null },
) {
  const attachToAccount = options?.account;

  if (attachToAccount) {
    const [user, existingUser] = await Promise.all([
      attachToAccount.$relatedQuery("user"),
      User.query().findOne({ googleUserId: profile.id }),
    ]);

    if (existingUser) {
      invariant(existingUser.account, "account not fetched");
      if (user.id !== existingUser.id) {
        throw new Error(
          "Google account is already attached to another account",
        );
      }
    }

    if (user.googleUserId && user.googleUserId !== profile.id) {
      throw new Error(
        "Account account is already attached to another Google account",
      );
    }

    if (user.googleUserId !== profile.id) {
      await user.$query().patch({ googleUserId: profile.id });
    }

    return attachToAccount;
  }

  const existingUsers = await User.query()
    .withGraphFetched("account")
    .whereIn("email", profile.emails)
    .orWhere("googleUserId", profile.id);

  // If we match multiple accounts we have to handle the case
  if (existingUsers.length > 1) {
    // First we try to find a user with the same googleUserId
    // If we find one, we return its account
    const userWithId = existingUsers.find((u) => u.googleUserId === profile.id);
    if (userWithId) {
      invariant(userWithId.account, "account not fetched");
      return userWithId.account;
    }

    // Then we try to find a user with the same email, starting with the primary
    // we mark it by updating the googleUserId
    const userWithEmail =
      existingUsers.find((u) => u.email === profile.primaryEmail) ??
      existingUsers[0];

    invariant(userWithEmail?.account, "account not fetched");
    await userWithEmail.$clone().$query().patch({
      googleUserId: profile.id,
    });
    return userWithEmail.account;
  }

  const existingUser = existingUsers[0];

  if (existingUser) {
    invariant(existingUser.account, "account not fetched");

    // If needed, update the googleUserId
    if (existingUser.googleUserId !== profile.id) {
      await existingUser.$clone().$query().patch({
        googleUserId: profile.id,
      });
    }

    return existingUser.account;
  }

  const emailIdentifier = profile.primaryEmail.split("@")[0];
  invariant(
    emailIdentifier,
    `Invalid email identifier: ${profile.primaryEmail}`,
  );
  const emailSlug = slugify(emailIdentifier.toLowerCase());
  invariant(
    emailSlug,
    `Invalid email slug: (slug: ${emailSlug}, email: ${profile.primaryEmail})`,
  );
  const accountSlug = await resolveAccountSlug(emailSlug);

  logger.info(`Creating account with slug: ${accountSlug}`);
  const account = await transaction(async (trx) => {
    const user = await User.query(trx).insertAndFetch({
      email: profile.primaryEmail,
      googleUserId: profile.id,
    });
    return Account.query(trx).insertAndFetch({
      userId: user.id,
      name: profile.name,
      slug: accountSlug,
    });
  });

  await sendWelcomeEmail({ to: profile.primaryEmail });

  return account;
}
