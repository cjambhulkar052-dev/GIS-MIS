import { NextRequest, NextResponse } from "next/server";
import { mapAmberInventories } from "@/lib/amber-map";
import { MOCK_LISTINGS } from "@/lib/amber-mock";
import type { AmberApiResponse } from "@/lib/amber-api-types";
import type { AmberSearchResult } from "@/lib/types";

const AMBER_BASE_URL = process.env.AMBER_API_BASE_URL ?? "https://base.amberstudent.com";

/**
 * In-memory cache to help stay under Amber's published rate limit
 * (10 requests/minute, then a 5 minute lockout). Keyed by the exact query
 * we send to Amber. Cleared on server restart — good enough for a single
 * Next.js instance; move to a shared cache (Redis) behind multiple instances.
 */
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { expires: number; body: AmberSearchResult }>();

function mockResult(error?: string): AmberSearchResult {
  return { listings: MOCK_LISTINGS, source: "mock", error };
}

export async function GET(request: NextRequest) {
  const partnerUuid = process.env.AMBER_PARTNER_UUID;
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("p") ?? "1";
  const limit = searchParams.get("limit") ?? "50";
  const locationPlaceName = searchParams.get("location_place_name") ?? undefined;

  if (!partnerUuid) {
    // No credentials configured yet — serve the mock catalog so the UI keeps working.
    return NextResponse.json(mockResult());
  }

  const cacheKey = `${page}:${limit}:${locationPlaceName ?? ""}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.body);
  }

  const amberUrl = new URL(
    `${AMBER_BASE_URL}/api/v0/leads/partners/${partnerUuid}/inventories`,
  );
  amberUrl.searchParams.set("p", page);
  amberUrl.searchParams.set("limit", limit);
  if (locationPlaceName) {
    amberUrl.searchParams.set("location_place_name", locationPlaceName);
  }

  let response: Response;
  try {
    response = await fetch(amberUrl, { signal: AbortSignal.timeout(10_000) });
  } catch {
    return NextResponse.json(mockResult("Amber API is unreachable right now."));
  }

  if (response.status === 404) {
    return NextResponse.json(
      mockResult("Amber partner UUID is invalid — check AMBER_PARTNER_UUID."),
    );
  }

  if (!response.ok) {
    return NextResponse.json(mockResult(`Amber API returned ${response.status}.`));
  }

  const json = (await response.json()) as AmberApiResponse;
  const listings = mapAmberInventories(json.data.result);
  const body: AmberSearchResult = { listings, source: "amber" };

  cache.set(cacheKey, { expires: Date.now() + CACHE_TTL_MS, body });

  return NextResponse.json(body);
}
