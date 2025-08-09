export interface CaseResult {
  tid: string;
  title: string;
  headline: string;
  docsource: string;
  docsize: number;
  year?: string;
  citation?: string;
  url: string;
}

export interface SearchFilters {
  keyword: string;
  citation: string;
  jurisdiction: string;
  yearFrom: string;
  yearTo: string;
  judge: string;
  provision: string;
  caseType: string;
  act: string;
}

// Build query string similar to server-side logic
function buildQuery(filters: SearchFilters): string {
  let q = filters.keyword || filters.citation || filters.provision || filters.act || "";
  if (filters.yearFrom && filters.yearTo) q += ` year:${filters.yearFrom}-${filters.yearTo}`;
  else if (filters.yearFrom) q += ` year:${filters.yearFrom}`;
  if (filters.jurisdiction && filters.jurisdiction !== "All High Courts") q += ` court:${filters.jurisdiction}`;
  if (filters.caseType) q += ` type:${filters.caseType}`;
  if (filters.judge) q += ` judge:${filters.judge}`;
  return q.trim();
}

// Parse search HTML into case results (numeric TIDs only)
function parseResults(html: string): CaseResult[] {
  const results: CaseResult[] = [];
  // Split into result blocks (best-effort)
  const blockRegex = /<div[^>]*class="result"[^>]*>([\s\S]*?)<\/div>/g;
  let m: RegExpExecArray | null;
  while ((m = blockRegex.exec(html)) !== null) {
    const block = m[1];
    const anchor = block.match(/<a[^>]*href="\/doc\/(\d+)\/"[^>]*>([\s\S]*?)<\/a>/);
    if (!anchor) continue;
    const tid = anchor[1];
    const rawTitle = anchor[2].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    const title = rawTitle || `Case ${tid}`;
    const headlineMatch = block.match(/<div[^>]*class="result_title"[^>]*>([\s\S]*?)<\/div>/);
    const headline = headlineMatch ? headlineMatch[1].replace(/<[^>]*>/g, "").trim() : "";
    const citationMatch = block.match(/(AIR\s+\d+\s+\w+\s+\d+)/);
    const citation = citationMatch ? citationMatch[1] : "";
    const yearMatch = block.match(/\b(19\d{2}|20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : "";
    let docsource = "";
    if (/Supreme Court/i.test(block)) docsource = "Supreme Court";
    else if (/High Court/i.test(block)) docsource = "High Court";
    const docsize = Math.max(100000, title.length * 800);
    results.push({
      tid,
      title,
      headline,
      docsource,
      docsize,
      year,
      citation,
      url: `https://indiankanoon.org/doc/${tid}/`
    });
    if (results.length >= 10) break;
  }
  return results;
}

// Client-side fetch using r.jina.ai to bypass CORS (GET only)
export async function fetchRealCasesClient(filters: SearchFilters): Promise<CaseResult[]> {
  const query = buildQuery(filters);
  if (!query) return [];
  const base = "https://r.jina.ai/http://indiankanoon.org/search/?";
  const url = `${base}formInput=${encodeURIComponent(query)}&type=phrase`;
  const resp = await fetch(url, { method: 'GET' });
  if (!resp.ok) throw new Error(`Failed to fetch search page: ${resp.status}`);
  const html = await resp.text();
  const results = parseResults(html);
  return results;
}
