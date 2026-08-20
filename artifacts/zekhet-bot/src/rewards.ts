import {
  addCurrency,
  addItem,
  claimReward,
  getItem,
  getItemQuantity,
  getProgression,
  getTitle,
  grantExperience,
  grantTitle,
  releaseRewardClaim,
  type ExperienceResult,
  type InventoryEntry,
  type Progression,
} from "./database.js";

export type RewardItem = {
  id: string;
  quantity: number;
};

export type RewardUnlock =
  | { type: "title"; id: string }
  | { type: "future"; id: string };

export type Rewards = {
  xp?: number;
  currency?: number;
  items?: RewardItem[];
  unlocks?: RewardUnlock[];
};

export type RewardSource = string | { type: string; id?: string };

export type RewardResult =
  | {
      ok: true;
      source: string;
      xp: ExperienceResult & { ok: true } | null;
      currency: number;
      items: InventoryEntry[];
      unlocks: string[];
      alreadyClaimed: false;
    }
  | {
      ok: false;
      reason: "already-claimed" | "invalid-reward" | "invalid-item" | "invalid-quantity" | "invalid-currency" | "invalid-xp" | "database-failure";
    };

function sourceLabel(source: RewardSource): string {
  return typeof source === "string" ? source : `${source.type}${source.id ? `:${source.id}` : ""}`;
}

function validPositiveInteger(value: number | undefined): boolean {
  return value === undefined || (Number.isSafeInteger(value) && value > 0);
}

function validateItems(userId: string, items: RewardItem[]): "invalid-item" | "invalid-quantity" | undefined {
  const totals = new Map<string, number>();
  for (const itemReward of items) {
    if (!Number.isSafeInteger(itemReward.quantity) || itemReward.quantity <= 0) return "invalid-quantity";
    const item = getItem(itemReward.id);
    if (!item) return "invalid-item";
    totals.set(itemReward.id, (totals.get(itemReward.id) ?? 0) + itemReward.quantity);
  }
  for (const [itemId, quantity] of totals) {
    const item = getItem(itemId)!;
    const existing = getItemQuantity(userId, itemId);
    if (!item.stackable && existing + quantity > 1) return "invalid-quantity";
    if (existing + quantity > item.maxStack) return "invalid-quantity";
  }
  return undefined;
}

export function grantRewards(
  userId: string,
  rewards: Rewards,
  source: RewardSource,
  options: {
    username?: string;
    avatarUrl?: string | null;
    oneTimeKey?: string;
  } = {},
): RewardResult {
  const sourceName = sourceLabel(source);
  const username = options.username ?? "Unknown Record";
  const avatarUrl = options.avatarUrl ?? null;
  const items = rewards.items ?? [];
  const unlocks = rewards.unlocks ?? [];
  if (!rewards.xp && !rewards.currency && !items.length && !unlocks.length) return { ok: false, reason: "invalid-reward" };
  if (!validPositiveInteger(rewards.xp)) return { ok: false, reason: "invalid-xp" };
  if (!validPositiveInteger(rewards.currency)) return { ok: false, reason: "invalid-currency" };
  const itemError = validateItems(userId, items);
  if (itemError) return { ok: false, reason: itemError };
  for (const unlock of unlocks) {
    if (unlock.type === "title" && !getTitle(unlock.id)) return { ok: false, reason: "invalid-reward" };
  }

  getProgression(userId, username, avatarUrl);
  if (options.oneTimeKey && !claimReward(options.oneTimeKey, userId, sourceName)) {
    return { ok: false, reason: "already-claimed" };
  }

  try {
    const xpResult = rewards.xp
      ? grantExperience(userId, rewards.xp, username, avatarUrl)
      : null;
    if (xpResult && !xpResult.ok) return { ok: false, reason: xpResult.reason === "invalid-amount" ? "invalid-xp" : "invalid-xp" };

    let currency = 0;
    if (rewards.currency) {
      const currencyResult = addCurrency(
        userId,
        rewards.currency,
        username,
        avatarUrl,
        options.oneTimeKey ? `reward:${options.oneTimeKey}:currency` : undefined,
      );
      if (!currencyResult.ok) return { ok: false, reason: currencyResult.reason === "invalid-amount" ? "invalid-currency" : "database-failure" };
      currency = rewards.currency;
    }

    const grantedItems: InventoryEntry[] = [];
    for (const itemReward of items) {
      const granted = addItem(userId, itemReward.id, itemReward.quantity, username, avatarUrl);
      if (!granted) return { ok: false, reason: "database-failure" };
      grantedItems.push(granted);
    }

    const grantedUnlocks: string[] = [];
    for (const unlock of unlocks) {
      if (unlock.type !== "title") continue;
      if (grantTitle(userId, unlock.id, username, avatarUrl)) grantedUnlocks.push(unlock.id);
    }

    return {
      ok: true,
      source: sourceName,
      xp: xpResult as (ExperienceResult & { ok: true }) | null,
      currency,
      items: grantedItems,
      unlocks: grantedUnlocks,
      alreadyClaimed: false,
    };
  } catch {
    if (options.oneTimeKey) releaseRewardClaim(options.oneTimeKey);
    return { ok: false, reason: "database-failure" };
  }
}

export function formatRewards(rewards: Rewards): string {
  const lines: string[] = [];
  if (rewards.xp) lines.push(`✦ +${rewards.xp.toLocaleString("en-US")} XP`);
  if (rewards.currency) lines.push(`𓏏 +${rewards.currency.toLocaleString("en-US")} Deben`);
  for (const item of rewards.items ?? []) {
    const definition = getItem(item.id);
    lines.push(`${definition?.icon ?? "𓂀"} ${definition?.name ?? item.id} ×${item.quantity}`);
  }
  for (const unlock of rewards.unlocks ?? []) {
    if (unlock.type === "title") lines.push(`📜 Title unlocked: **${getTitle(unlock.id)?.name ?? unlock.id}**`);
  }
  return lines.join("\n") || "No rewards recorded.";
}

export function progressionSummary(progression: Progression): string {
  return `Level **${progression.level}** · **${progression.rank}**\n${progression.currentLevelXp.toLocaleString("en-US")} / ${progression.nextLevelXp.toLocaleString("en-US")} XP to next level`;
}