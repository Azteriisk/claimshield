import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.toLowerCase().trim() || "";

  const allBreaches = db.getBreaches();
  const allSettlements = db.getSettlements();

  if (!query) {
    // Default initial feed
    const enriched = allBreaches.map(b => ({
      ...b,
      settlement: allSettlements.find(s => s.id === b.matchingSettlementId) || null
    }));

    return NextResponse.json({
      query: "",
      count: enriched.length,
      isClean: false,
      breaches: enriched,
      totalEstimatedPayout: enriched.reduce((acc, curr) => acc + (curr.settlement?.estimatedBasePayout || 0), 0)
    });
  }

  // Tailored search logic
  let matchedBreaches = allBreaches.filter(b => 
    b.entityName.toLowerCase().includes(query) ||
    b.domain.toLowerCase().includes(query) ||
    b.exposedData.some(d => d.toLowerCase().includes(query))
  );

  // If query is an email address:
  if (query.includes("@")) {
    const domainPart = query.split("@")[1]?.toLowerCase() || "";
    const userPart = query.split("@")[0]?.toLowerCase() || "";

    if (query.includes("clean") || query.includes("safe") || domainPart.includes("secure")) {
      // Explicit test for clean email
      matchedBreaches = [];
    } else if (userPart.includes("att") || domainPart.includes("att")) {
      matchedBreaches = allBreaches.filter(b => b.domain.includes("att.com"));
    } else if (userPart.includes("ticket") || domainPart.includes("ticketmaster")) {
      matchedBreaches = allBreaches.filter(b => b.domain.includes("ticketmaster.com"));
    } else if (userPart.includes("dna") || userPart.includes("23andme") || domainPart.includes("23andme")) {
      matchedBreaches = allBreaches.filter(b => b.domain.includes("23andme.com"));
    } else {
      // For general consumer emails, realistic simulation: return top 2-3 most widespread national breaches
      matchedBreaches = allBreaches.slice(0, 3);
    }
  }

  const enrichedBreaches = matchedBreaches.map(b => {
    const settlement = allSettlements.find(s => s.id === b.matchingSettlementId);
    return {
      ...b,
      settlement: settlement || null
    };
  });

  const totalEstimatedPayout = enrichedBreaches.reduce(
    (acc, curr) => acc + (curr.settlement?.estimatedBasePayout || 0), 
    0
  );

  const hasHighRiskPii = enrichedBreaches.some(b => 
    b.exposedData.some(d => d.includes("SSN") || d.includes("Social Security") || d.includes("Credit Card"))
  );

  return NextResponse.json({
    query,
    count: enrichedBreaches.length,
    isClean: enrichedBreaches.length === 0,
    breaches: enrichedBreaches,
    totalEstimatedPayout,
    hasHighRiskPii,
    scannedAt: new Date().toISOString()
  });
}
