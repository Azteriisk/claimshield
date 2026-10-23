import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toLowerCase().trim() || "";

  const allBreaches = db.getBreaches();
  const allSettlements = db.getSettlements();

  if (!query) {
    return NextResponse.json({
      breaches: allBreaches,
      settlements: allSettlements
    });
  }

  // Filter or match breaches based on query
  // For demonstration, if user searches an email, we match breaches where domain matches
  // or return realistic sample breach hits for popular services (Ticketmaster, AT&T, etc.)
  let matchedBreaches = allBreaches.filter(b => 
    b.entityName.toLowerCase().includes(query) ||
    b.domain.toLowerCase().includes(query)
  );

  // If query is an email address (e.g. user@gmail.com), show breaches that commonly hit consumer emails
  if (query.includes("@")) {
    matchedBreaches = allBreaches; // Display all active breaches in demo so user can test settlements
  }

  const enrichedBreaches = matchedBreaches.map(b => {
    const settlement = allSettlements.find(s => s.id === b.matchingSettlementId);
    return {
      ...b,
      settlement: settlement || null
    };
  });

  return NextResponse.json({
    query,
    count: enrichedBreaches.length,
    breaches: enrichedBreaches
  });
}
