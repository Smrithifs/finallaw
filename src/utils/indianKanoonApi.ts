import { callGeminiAPI } from "./geminiApi";

export interface SearchFilters {
  query?: string;
  act?: string;
  section?: string;
  yearFrom?: string;
  yearTo?: string;
  caseType?: string;
  maxResults?: number;
}

export interface IndianKanoonCase {
  tid: string;
  title: string;
  link: string;
  aiSummary?: string;
  ratioDecidendi?: string;
  keywords?: string[];
}

// Helper to call Supabase edge function for search
export async function searchIndianKanoonCases(filters: SearchFilters): Promise<IndianKanoonCase[]> {
  const res = await fetch("/functions/v1/search-indian-kanoon", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters),
  });
  if (!res.ok) {
    throw new Error("Indian Kanoon search failed");
  }
  const data = await res.json();
  return data.results as IndianKanoonCase[];
}

export async function fetchIndianKanoonCaseText(tid: string): Promise<string> {
  const res = await fetch("/functions/v1/get-indian-kanoon-case", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tid }),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch case text");
  }
  const data = await res.json();
  return data.text as string;
}

// Summarize a case using Gemini, ensuring >1000 words and ratio decidendi
export async function summarizeCase(
  caseText: string,
  geminiKey: string,
  caseTitle: string,
  citation?: string
): Promise<{ summary: string; ratioDecidendi: string; keywords: string[] }> {
  const prompt = `You are a senior law clerk. Study the following Indian judgment and prepare a comprehensive case note of at least 1000 words. Your output must contain:\n\n1. Citation (if provided).\n2. Detailed procedural and factual background.\n3. The court's reasoning broken down thematically.\n4. RATIO DECIDENDI (mark this section clearly).\n5. Key precedents relied upon.\n6. Impact and relevance.\n7. 15 important KEYWORDS drawn verbatim from the judgment (bullet list).\n\nJudgment to analyse:\n\n=====\n${caseText.slice(0, 12000)}\n=====`;
  const full = await callGeminiAPI(prompt, geminiKey);
  // crude parsing for ratio and keywords
  const ratioMatch = full.match(/RATIO DECIDENDI[\s:\-]*([\s\S]*?)(?:\n\n|$)/i);
  const ratio = ratioMatch ? ratioMatch[1].trim() : "";
  const keywordsMatch = full.match(/KEYWORDS[\s:\-]*([\s\S]*?)(?:\n\n|$)/i);
  let keywords: string[] = [];
  if (keywordsMatch) {
    keywords = keywordsMatch[1]
      .split(/[,\n\-•]+/)
      .map((k) => k.trim())
      .filter(Boolean);
  }
  return { summary: full, ratioDecidendi: ratio, keywords };
}