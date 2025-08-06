import { callGeminiAPI } from "./geminiApi";

export interface SearchFilters {
  query?: string;
  keyword?: string;
  citation?: string;
  jurisdiction?: string;
  act?: string;
  section?: string;
  provision?: string;
  judge?: string;
  yearFrom?: string;
  yearTo?: string;
  caseType?: string;
  maxResults?: number;
}

export interface IndianKanoonCase {
  tid: string;
  title: string;
  link: string;
  court?: string;
  date?: string;
  citation?: string;
  aiSummary?: string;
  ratioDecidendi?: string;
  keywords?: string[];
}

export interface SearchResponse {
  query: string;
  results: IndianKanoonCase[];
  totalFound: number;
  authenticated?: boolean;
  fallback?: boolean;
}

export interface CaseResponse {
  tid: string;
  text: string;
  citation?: string;
  court?: string;
  date?: string;
  authenticated?: boolean;
  fallback?: boolean;
}

// Scrape a specific case from Indian Kanoon
async function scrapeCaseText(tid: string): Promise<CaseResponse> {
  try {
    const url = `https://indiankanoon.org/doc/${tid}/`;
    console.log('Scraping case:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch case: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract case text from HTML
    const textRegex = /<div class="judgments"[^>]*>([\s\S]*?)<\/div>/i;
    const match = html.match(textRegex);
    
    let text = "Case text not available";
    if (match) {
      text = match[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    }
    
    // Extract citation
    const citationRegex = /<title>(.*?)<\/title>/i;
    const citationMatch = html.match(citationRegex);
    const citation = citationMatch ? citationMatch[1].replace(/\s+/g, " ").trim() : "";
    
    return {
      tid,
      text,
      citation,
      court: "Indian Kanoon",
      date: new Date().toISOString().split('T')[0],
      authenticated: false,
      fallback: false
    };
  } catch (error) {
    console.error("Error scraping case:", error);
    throw new Error("Failed to scrape case text");
  }
}

// Generate relevant case links using AI
export async function generateRelevantCaseLinks(
  searchFilters: SearchFilters, 
  geminiKey: string
): Promise<string[]> {
  try {
    const prompt = `You are an expert legal researcher. Based on the following search criteria, generate 5-10 relevant Indian case law links from Indian Kanoon.

Search Criteria:
- Keyword: ${searchFilters.keyword || 'Not specified'}
- Citation: ${searchFilters.citation || 'Not specified'}
- Jurisdiction: ${searchFilters.jurisdiction || 'Not specified'}
- Case Type: ${searchFilters.caseType || 'Not specified'}
- Legal Provision: ${searchFilters.provision || 'Not specified'}
- Judge: ${searchFilters.judge || 'Not specified'}
- Year Range: ${searchFilters.yearFrom ? `${searchFilters.yearFrom}-${searchFilters.yearTo || 'present'}` : 'All years'}

Please provide ONLY the case IDs (numbers) from Indian Kanoon URLs like "https://indiankanoon.org/doc/123456/".
Return ONLY the numbers, one per line, like:
123456
789012
345678

Focus on the most relevant and landmark cases that match the search criteria.`;

    const response = await callGeminiAPI(prompt, geminiKey);

    // Parse the response to extract case IDs
    const lines = response.split('\n').filter(line => line.trim().match(/^\d+$/));
    return lines.slice(0, 10); // Return up to 10 case IDs
  } catch (error) {
    console.error("Error generating case links:", error);
    throw new Error("Failed to generate relevant case links");
  }
}

// Scrape and summarize a specific case
export async function scrapeAndSummarizeCase(
  tid: string, 
  geminiKey: string
): Promise<{
  tid: string;
  title: string;
  link: string;
  aiSummary: string;
  aiDetailedExplainer: string;
  ratioDecidendi: string;
  citation: string;
  court: string;
  date: string;
}> {
  try {
    // First scrape the case text
    const caseData = await scrapeCaseText(tid);
    
    // Generate AI summary
    const summaryPrompt = `Analyze this Indian case law judgment and provide:

1. A comprehensive summary (500-800 words)
2. The ratio decidendi (legal principle established)
3. Key citations and references
4. Court and date information

Case Text:
${caseData.text.substring(0, 8000)}${caseData.text.length > 8000 ? '...' : ''}

Please format your response as:
SUMMARY: [comprehensive summary]
RATIO DECIDENDI: [legal principle]
CITATION: [case citation]
COURT: [court name]
DATE: [date]`;

    const summaryResponse = await callGeminiAPI(summaryPrompt, geminiKey);

    // Generate detailed explainer
    const explainerPrompt = `Provide a detailed legal analysis of this Indian case law judgment (1000+ words):

Case Text:
${caseData.text.substring(0, 8000)}${caseData.text.length > 8000 ? '...' : ''}

Please include:
1. Background and facts of the case
2. Legal issues involved
3. Arguments presented by both parties
4. Court's reasoning and analysis
5. Legal principles established
6. Impact and significance of the judgment
7. Relevant precedents and citations

Format as a comprehensive legal analysis.`;

    const explainerResponse = await callGeminiAPI(explainerPrompt, geminiKey);

    // Parse the summary response
    const summaryMatch = summaryResponse.match(/SUMMARY:\s*([\s\S]*?)(?=RATIO DECIDENDI:|$)/i);
    const ratioMatch = summaryResponse.match(/RATIO DECIDENDI:\s*([\s\S]*?)(?=CITATION:|$)/i);
    const citationMatch = summaryResponse.match(/CITATION:\s*([\s\S]*?)(?=COURT:|$)/i);
    const courtMatch = summaryResponse.match(/COURT:\s*([\s\S]*?)(?=DATE:|$)/i);
    const dateMatch = summaryResponse.match(/DATE:\s*([\s\S]*?)$/i);

    return {
      tid,
      title: caseData.text.substring(0, 100).replace(/\s+/g, ' ').trim() + '...',
      link: `https://indiankanoon.org/doc/${tid}/`,
      aiSummary: summaryMatch ? summaryMatch[1].trim() : summaryResponse,
      aiDetailedExplainer: explainerResponse,
      ratioDecidendi: ratioMatch ? ratioMatch[1].trim() : 'Not specified',
      citation: citationMatch ? citationMatch[1].trim() : caseData.citation,
      court: courtMatch ? courtMatch[1].trim() : caseData.court,
      date: dateMatch ? dateMatch[1].trim() : caseData.date
    };
  } catch (error) {
    console.error("Error scraping and summarizing case:", error);
    throw new Error("Failed to process case");
  }
}

// Main function to get AI-generated case links and summarize them
export async function getAIRecommendedCases(
  searchFilters: SearchFilters,
  geminiKey: string
): Promise<{
  query: string;
  results: Array<{
    tid: string;
    title: string;
    link: string;
    aiSummary: string;
    aiDetailedExplainer: string;
    ratioDecidendi: string;
    citation: string;
    court: string;
    date: string;
  }>;
  totalFound: number;
  authenticated: boolean;
  fallback: boolean;
}> {
  try {
    // Generate relevant case links using AI
    const caseIds = await generateRelevantCaseLinks(searchFilters, geminiKey);
    
    if (caseIds.length === 0) {
      throw new Error("No relevant cases found");
    }

    // Scrape and summarize each case
    const results = await Promise.all(
      caseIds.map(tid => scrapeAndSummarizeCase(tid, geminiKey))
    );

    return {
      query: `AI Recommended Cases for: ${searchFilters.keyword || 'General Search'}`,
      results,
      totalFound: results.length,
      authenticated: false,
      fallback: false
    };
  } catch (error) {
    console.error("Error getting AI recommended cases:", error);
    throw error;
  }
}