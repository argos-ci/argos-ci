import {
  Account,
  Plan,
  Organization,
  User,
  Purchase,
} from "@argos-ci/database/models";

export async function getAccount(payload) {
  const { type, id: githubId } = payload.marketplace_purchase.account;

  if (!type) throw new Error(`can't find account without account type`);
  if (!githubId) throw new Error(`can't find account without githubId`);
  if (type.toLowerCase() === "user") {
    const account = await Account.query()
      .joinRelated("user")
      .findOne("user.githubId", githubId);
    return account || null;
  }
  if (type.toLowerCase() === "organization") {
    const account = await Account.query()
      .joinRelated("organization")
      .findOne("organization.githubId", githubId);
    return account || null;
  }
  throw new Error(`can't find account of type : ${type}`);
}

async function getOrCreateUser(payload) {
  const { email } = payload.sender;
  const { id: githubId, login } = payload.marketplace_purchase.account;
  const user = await User.query().findOne({ githubId });
  if (user) return user;
  return User.query().insertAndFetch({ githubId, login, email });
}

async function getOrCreateOrganization(payload) {
  const { id: githubId, login } = payload.marketplace_purchase.account;
  const organization = await Organization.query().findOne({ githubId });
  if (organization) return organization;
  return Organization.query().insertAndFetch({ githubId, login });
}

export async function getOrCreateAccount(payload) {
  const account = await getAccount(payload);
  if (account) return account;

  if (payload.marketplace_purchase.account.type === "User") {
    const user = await getOrCreateUser(payload);
    return Account.query().insertAndFetch({ userId: user.id });
  }

  const organization = await getOrCreateOrganization(payload);
  return Account.query().insertAndFetch({ organizationId: organization.id });
}

export async function getNewPlanOrThrow(payload) {
  const { id: githubId } = payload.marketplace_purchase.plan;
  const plan = await Plan.query().findOne({ githubId });
  if (!plan) throw new Error(`missing plan with githubId: '${githubId}'`);
  return plan;
}

export function createAccountPayload(data) {
  return { marketplace_purchase: { account: { ...data } } };
}

export async function cancelPurchase(payload) {
  const account = await getOrCreateAccount(payload);
  const activePurchase = await account.getActivePurchase();
  if (activePurchase) {
    await Purchase.query()
      .findById(activePurchase.id)
      .patch({ endDate: payload.effective_date });
  }
}