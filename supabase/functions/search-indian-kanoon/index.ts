import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Helper to build Indian Kanoon search query from filters
function buildFormInput(filters: any) {
  let parts: string[] = [];
  if (filters.query) parts.push(filters.query);
  if (filters.act) parts.push(`${filters.act}`);
  if (filters.section) parts.push(`section:${filters.section}`);
  if (filters.yearFrom) parts.push(`fromdate:${filters.yearFrom}-01-01`);
  if (filters.yearTo) parts.push(`todate:${filters.yearTo}-12-31`);
  if (filters.caseType) parts.push(`${filters.caseType}`);
  return parts.join(" ").trim();
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const formInput = buildFormInput(body);
    const maxResults = Math.min(body.maxResults ?? 10, 10);

    // Call Indian Kanoon public search page and scrape links
    const searchUrl = `https://indiankanoon.org/search/?formInput=${encodeURIComponent(formInput)}&pagenum=0&num=${maxResults}`;
    const res = await fetch(searchUrl);
    if (!res.ok) {
      throw new Error("Failed to fetch search results from Indian Kanoon");
    }
    const html = await res.text();

    // Very naive parsing just to extract /doc/<tid>/ links and titles
    const regex = /<a href="\\/doc\\/([0-9]+)\\/">([\s\S]*?)<\\/a>/g;
    const results: any[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      const tid = match[1];
      const rawTitle = match[2];
      const title = rawTitle.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      const link = `https://indiankanoon.org/doc/${tid}/`;
      results.push({ tid, title, link });
      if (results.length >= maxResults) break;
    }

    return new Response(JSON.stringify({ query: formInput, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("search-indian-kanoon error", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});