import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ success: true, content: [] });
        }

        const growwSearchUrl = `https://groww.in/v1/api/search/v1/entity?q=${encodeURIComponent(query)}&size=8`;
        
        const response = await fetch(growwSearchUrl, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Groww API returned status ${response.status}`);
        }

        const data = await response.json();
        
        // Map raw Groww entity content into our clean application format
        const formattedResults = (data.content || []).map((item: any) => {
            let entityType: "Stock" | "Mutual Fund" | "Bond" = "Stock";
            if (item.entity_type === "Scheme") {
                entityType = "Mutual Fund";
            } else if (item.entity_type === "ETF") {
                entityType = "Stock";
            } else if (item.entity_type === "Bond") {
                entityType = "Bond";
            }

            const symbol = item.nse_scrip_code || item.bse_scrip_code || item.scheme_code || item.isin || item.groww_contract_id || item.id;

            return {
                id: item.id || item.search_id,
                name: item.title || item.company_short_name,
                symbol: symbol,
                type: entityType,
                sector: item.matched_brands || item.company_short_name || "Investment Instrument",
            };
        });

        return NextResponse.json({
            success: true,
            content: formattedResults,
        });

    } catch (error: any) {
        console.error("Groww API Search Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to search Groww API" },
            { status: 500 }
        );
    }
}
