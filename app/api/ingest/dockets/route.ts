import { NextResponse } from "next/server";
import { db, Settlement, BreachRecord } from "@/lib/db";
import { courtListenerClient } from "@/lib/ingestion/courtListener";
import { scrapeStateAgBreaches } from "@/lib/ingestion/stateAgScraper";

interface IngestionRequestParams {
  source?: "courtlistener" | "state_ag" | "all";
  query?: string;
  forceSync?: boolean;
}

async function performDocketIngestion(params: IngestionRequestParams) {
  const source = params.source || "all";
  let scannedSettlements: Settlement[] = [];
  let scannedBreaches: BreachRecord[] = [];

  let newSettlementsDiscovered = 0;
  let updatedDeadlines = 0;
  let newBreachesDiscovered = 0;

  // 1. Ingest Federal Court Dockets (CourtListener / RECAP)
  if (source === "courtlistener" || source === "all") {
    scannedSettlements = await courtListenerClient.fetchSettlementOrders({
      query: params.query
    });

    for (const settlement of scannedSettlements) {
      const result = db.upsertSettlement(settlement);
      if (result.isNew) {
        newSettlementsDiscovered++;
      } else if (result.updatedDeadline) {
        updatedDeadlines++;
      }
    }
  }

  // 2. Ingest State AG Breach Portals (CA, ME, TX)
  if (source === "state_ag" || source === "all") {
    scannedBreaches = await scrapeStateAgBreaches();

    for (const breach of scannedBreaches) {
      const result = db.upsertBreach(breach);
      if (result.isNew) {
        newBreachesDiscovered++;
      }
    }
  }

  const allSettlements = db.getSettlements();
  const allBreaches = db.getBreaches();

  return {
    success: true,
    timestamp: new Date().toISOString(),
    mode: courtListenerClient.isOffline() ? "offline_fixture" : "live",
    source,
    metrics: {
      scannedDockets: scannedSettlements.length,
      newSettlementsDiscovered,
      updatedDeadlines,
      totalActiveSettlements: allSettlements.length,
      scannedBreaches: scannedBreaches.length,
      newBreachesDiscovered,
      totalActiveBreaches: allBreaches.length
    },
    ingestedSettlements: scannedSettlements,
    ingestedBreaches: scannedBreaches
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceParam = searchParams.get("source") as "courtlistener" | "state_ag" | "all" | null;
    const query = searchParams.get("query") || undefined;
    const forceSync = searchParams.get("forceSync") === "true";

    const result = await performDocketIngestion({
      source: sourceParam || "all",
      query,
      forceSync
    });

    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (err: any) {
    console.error("Docket ingestion GET error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Docket ingestion failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let body: IngestionRequestParams = {};
    try {
      body = await request.json();
    } catch {
      // Empty or non-JSON body is acceptable; fallback to defaults
    }

    const result = await performDocketIngestion(body);

    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (err: any) {
    console.error("Docket ingestion POST error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Docket ingestion failed" },
      { status: 500 }
    );
  }
}
