import type { Rewards } from "./rewards.js";

export type VentureRarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY" | "MYTHIC";

export type VentureEncounter = {
  id: string;
  name: string;
  descriptions: string[];
  rarity: VentureRarity;
  outcome: string;
  reward?: Rewards;
  location?: string;
  successful: boolean;
};

const rarityWeights: Array<{ rarity: VentureRarity; weight: number }> = [
  { rarity: "COMMON", weight: 60 },
  { rarity: "UNCOMMON", weight: 25 },
  { rarity: "RARE", weight: 10 },
  { rarity: "EPIC", weight: 4 },
  { rarity: "LEGENDARY", weight: 0.9 },
  { rarity: "MYTHIC", weight: 0.1 },
];

export const ventureCooldownSeconds = 15 * 60;

export const ventureEncounters: VentureEncounter[] = [
  {
    id: "salt-worn-shrine",
    name: "The Salt-Worn Shrine",
    descriptions: [
      "A small shrine leans beneath a veil of white dust. Inside, someone has left a careful offering for the next traveler.",
      "The shrine's guardian is long gone, but its offering bowl is not empty.",
    ],
    rarity: "COMMON",
    outcome: "You recover a few coins and leave the shrine undisturbed. Beneath the offering bowl, a fragment of papyrus has survived the dust.",
    reward: { currency: 18, xp: 8, items: [{ id: "papyrus-fragment", quantity: 1 }] },
    location: "🏺 Sunken Temple",
    successful: true,
  },
  {
    id: "couriers-last-map",
    name: "The Courier's Last Map",
    descriptions: [
      "A rolled map is caught beneath a stone. Its final route ends at a place the Archives have not yet named.",
      "The wind reveals a courier's map, carefully weighted against the desert.",
    ],
    rarity: "COMMON",
    outcome: "The map is yours. Its ink may be more useful than its missing courier. A shard of desert glass weighs down one corner.",
    reward: { currency: 27, xp: 12, items: [{ id: "desert-glass", quantity: 1 }] },
    location: "🏜️ Glass Desert",
    successful: true,
  },
  {
    id: "oasis-that-waits",
    name: "The Oasis That Waits",
    descriptions: [
      "Palm shadows appear ahead. They do not move when the sun does.",
      "You find an oasis marked on no map. The water is clear, cold, and politely unavailable.",
    ],
    rarity: "COMMON",
    outcome: "Nothing is gained, though the silence feels briefly less empty.",
    location: "🌴 Golden Oasis",
    successful: false,
  },
  {
    id: "scribe-in-the-courtyard",
    name: "The Scribe in the Courtyard",
    descriptions: [
      "A silent scribe gestures toward a loose tile, then vanishes before you can ask a useful question.",
      "Someone has been writing in the dust. The final line points beneath the courtyard.",
    ],
    rarity: "UNCOMMON",
    outcome: "You uncover a modest purse and a note that reads: 'Acceptable handwriting.' The scribe leaves behind a vial of archival ink.",
    reward: { currency: 48, xp: 22, items: [{ id: "scribes-ink", quantity: 1 }] },
    location: "🏛️ Hall of the Court",
    successful: true,
  },
  {
    id: "lantern-under-the-archive",
    name: "The Lantern Under the Archive",
    descriptions: [
      "A blue lantern burns beneath the Grand Archives, though no stairway leads to it.",
      "The Archives cast a light downward. Zekhet declines to explain the architecture.",
    ],
    rarity: "UNCOMMON",
    outcome: "The lantern gutters out, leaving behind a small cache of Deben.",
    reward: { currency: 34, xp: 28 },
    location: "📜 Grand Archives",
    successful: true,
  },
  {
    id: "footsteps-without-owner",
    name: "Footsteps Without an Owner",
    descriptions: [
      "Footsteps follow yours across the sand. When you stop, they continue for three more paces.",
      "A second set of tracks joins your path, then remembers it has somewhere else to be.",
    ],
    rarity: "UNCOMMON",
    outcome: "The trail disappears. Zekhet records the incident as 'probably nothing.'",
    location: "🌑 Unknown",
    successful: false,
  },
  {
    id: "sealed-merchants-chest",
    name: "The Sealed Merchant's Chest",
    descriptions: [
      "Beneath a collapsed awning, a merchant's chest waits with its lock already broken.",
      "The ruins reveal a chest bearing three merchant seals and one very recent scratch.",
    ],
    rarity: "RARE",
    outcome: "The chest contains a careful reserve of Deben, a receipt for goods never delivered, and a violet shard sealed beneath the lining.",
    reward: { currency: 112, xp: 58, items: [{ id: "archive-shard", quantity: 1 }] },
    location: "🏜️ Glass Desert",
    successful: true,
  },
  {
    id: "courtyard-behind-the-wall",
    name: "The Courtyard Behind the Wall",
    descriptions: [
      "A wall opens onto a courtyard that could not fit behind it. The fountain is dry, but its basin is warm.",
      "You discover a courtyard hidden behind a wall too narrow to contain it.",
    ],
    rarity: "RARE",
    outcome: "A forgotten court left a generous offering and a pale Nile pearl for whoever noticed the impossible door.",
    reward: { currency: 86, xp: 72, items: [{ id: "nile-pearl", quantity: 1 }] },
    location: "🏛️ Hall of the Court",
    successful: true,
  },
  {
    id: "the-archive-beneath",
    name: "The Archive Beneath",
    descriptions: [
      "A stairwell descends beneath the Grand Archives. Every step is numbered, except the last one.",
      "The floor gives way to a staircase and a draft carrying the scent of old ink.",
    ],
    rarity: "EPIC",
    outcome: "You return with a purse from a forgotten archivist, a memory that is not entirely yours, and a violet seal from the lowest shelf.",
    reward: { currency: 214, xp: 118, items: [{ id: "violet-seal", quantity: 1 }] },
    location: "📜 Grand Archives",
    successful: true,
  },
  {
    id: "the-court-without-a-king",
    name: "The Court Without a King",
    descriptions: [
      "A complete court sits in darkness, waiting for a ruler who has been absent for centuries.",
      "The empty throne turns toward you. It appears to have already made a decision.",
    ],
    rarity: "EPIC",
    outcome: "You find a royal reserve beneath the throne. The throne keeps the crown.",
    reward: { currency: 168, xp: 142 },
    location: "🏛️ Hall of the Court",
    successful: true,
  },
  {
    id: "the-name-in-gold",
    name: "The Name in Gold",
    descriptions: [
      "A golden inscription appears on a sealed gate. It is not your name, but the final stroke resembles your handwriting.",
      "The gate bears a name written in gold. Zekhet pauses before confirming that it is not yours.",
    ],
    rarity: "LEGENDARY",
    outcome: "The gate opens long enough to release a forgotten treasury, then forgets you were there.",
    reward: { currency: 492, xp: 246 },
    location: "🕯️ Silent Sanctuary",
    successful: true,
  },
  {
    id: "the-first-dawn",
    name: "The First Dawn",
    descriptions: [
      "Beyond the dunes, dawn rises in the wrong direction. Something ancient has noticed your arrival.",
      "The horizon opens like a page. For one breath, the first light of Zekhet's world is visible.",
    ],
    rarity: "MYTHIC",
    outcome: "A mythic reserve is placed in your hands. The Archives record no explanation.",
    reward: { currency: 777, xp: 333 },
    location: "🌑 Unknown",
    successful: true,
  },
];

export function rarityLabel(rarity: VentureRarity): string {
  return rarity[0] + rarity.slice(1).toLowerCase();
}

export function rarityWeight(rarity: VentureRarity): number {
  return rarityWeights.find((entry) => entry.rarity === rarity)?.weight ?? 0;
}

function pick<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function rollRarity(): VentureRarity {
  const roll = Math.random() * 100;
  let cursor = 0;
  for (const entry of rarityWeights) {
    cursor += entry.weight;
    if (roll < cursor) return entry.rarity;
  }
  return "COMMON";
}

export function chooseVentureEncounter(forcedRarity?: VentureRarity): VentureEncounter {
  const rarity = forcedRarity ?? rollRarity();
  const available = ventureEncounters.filter((encounter) => encounter.rarity === rarity);
  return pick(available.length ? available : ventureEncounters);
}

export function renderVentureDescription(encounter: VentureEncounter): string {
  return pick(encounter.descriptions);
}