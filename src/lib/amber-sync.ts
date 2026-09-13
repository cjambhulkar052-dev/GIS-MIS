import "server-only";
import type { AmberApiInventory, AmberApiResponse } from "./amber-api-types";

const AMBER_BASE_URL = process.env.AMBER_API_BASE_URL ?? "https://base.amberstudent.com";
const PAGE_LIMIT = 50;
// Amber allows 10 requests/minute before a 5-minute lockout — 7s between
// requests keeps us comfortably under that even across many pages.
export const DELAY_BETWEEN_PAGES_MS = 7000;
// Pages fetched per cron tick. At 7s/page this is ~42s of delay plus network
// time, safely under Vercel's 60s hard timeout on the Hobby plan.
export const PAGES_PER_TICK = 6;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface AmberPageResult {
  inventories: AmberApiInventory[];
  totalPages: number;
  nextPage: number | null;
}

/** Fetches a single page of this partner's Amber inventory. */
export async function fetchAmberInventoryPage(page: number): Promise<AmberPageResult> {
  const partnerUuid = process.env.AMBER_PARTNER_UUID;
  if (!partnerUuid) {
    throw new Error("AMBER_PARTNER_UUID is not configured.");
  }

  const url = new URL(`${AMBER_BASE_URL}/api/v0/leads/partners/${partnerUuid}/inventories`);
  url.searchParams.set("p", String(page));
  url.searchParams.set("limit", String(PAGE_LIMIT));

  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    throw new Error(`Amber API returned ${response.status} on page ${page}`);
  }

  const json = (await response.json()) as AmberApiResponse;
  const totalPages = json.data.meta.pages?.length
    ? Math.max(...json.data.meta.pages)
    : (json.data.meta.next ?? page);

  return {
    inventories: json.data.result,
    totalPages,
    nextPage: json.data.meta.next,
  };
}

/**
 * Fetches up to `PAGES_PER_TICK` consecutive pages starting at `startPage`,
 * waiting between requests to respect Amber's rate limit. Returns where it
 * left off so the caller can persist progress and resume on the next tick.
 */
export async function fetchAmberInventoryBatch(startPage: number): Promise<{
  inventories: AmberApiInventory[];
  nextPage: number | null;
  totalPages: number;
}> {
  const inventories: AmberApiInventory[] = [];
  let page = startPage;
  let totalPages = page;
  let nextPage: number | null = null;

  for (let i = 0; i < PAGES_PER_TICK; i++) {
    const result = await fetchAmberInventoryPage(page);
    inventories.push(...result.inventories);
    totalPages = result.totalPages;
    nextPage = result.nextPage;

    if (!nextPage) break;
    page = nextPage;
    if (i < PAGES_PER_TICK - 1) await sleep(DELAY_BETWEEN_PAGES_MS);
  }

  return { inventories, nextPage, totalPages };
}
