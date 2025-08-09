import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchFilters {
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

interface CaseResult {
  tid: string;
  title: string;
  headline: string;
  docsource: string;
  docsize: number;
  year?: string;
  citation?: string;
  url: string;
}

// Function to parse Indian Kanoon HTML and extract case information
const parseIndianKanoonResults = (html: string): CaseResult[] => {
  const results: CaseResult[] = [];
  
  try {
    // Extract result blocks
    const resultDivRegex = /<div[^>]*class="result"[^>]*>([\s\S]*?)<\/div>/g;
    const blocks: string[] = [];
    let dm;
    while ((dm = resultDivRegex.exec(html)) !== null) {
      blocks.push(dm[1]);
    }

    // Process each block
    for (const block of blocks) {
      // Anchor with numeric TID and title in the same element
      const anchorMatch = block.match(/<a[^>]*href="\/doc\/(\d+)\/"[^>]*>([\s\S]*?)<\/a>/);
      if (!anchorMatch) continue;
      const tid = anchorMatch[1];
      const rawTitle = anchorMatch[2].replace(/<[^>]*>/g, "").trim();
      const title = rawTitle || `Case ${tid}`;

      // Headline (if present)
      const headlineMatch = block.match(/<div[^>]*class="result_title"[^>]*>([\s\S]*?)<\/div>/);
      const headline = headlineMatch ? headlineMatch[1].replace(/<[^>]*>/g, "").trim() : "";

      // Try to infer court, year, citation within the block only
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
        docsource: docsource || "",
        docsize,
        year,
        citation,
        url: `https://indiankanoon.org/doc/${tid}/`
      });

      if (results.length >= 15) break;
    }
  } catch (error) {
    console.error('Error parsing Indian Kanoon results:', error);
  }
  
  return results;
};

// Function to fetch from Indian Kanoon
const fetchIndianKanoonHTML = async (searchQuery: string): Promise<string> => {
  try {
    const encodedQuery = encodeURIComponent(searchQuery);
    const searchUrl = `https://indiankanoon.org/search/?formInput=${encodedQuery}&type=phrase`;
    
    console.log('Fetching from Indian Kanoon:', searchUrl);
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error fetching from Indian Kanoon:', error);
    throw new Error('Failed to fetch data from Indian Kanoon');
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filters } = await req.json();
    
    if (!filters || !filters.keyword) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing search criteria',
          message: 'Please provide search filters' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build search query from filters
    let searchQuery = filters.keyword || filters.citation || filters.provision || filters.act;
    
    if (filters.yearFrom && filters.yearTo) {
      searchQuery += ` year:${filters.yearFrom}-${filters.yearTo}`;
    } else if (filters.yearFrom) {
      searchQuery += ` year:${filters.yearFrom}`;
    }

    if (filters.jurisdiction && filters.jurisdiction !== "All High Courts") {
      searchQuery += ` court:${filters.jurisdiction}`;
    }

    if (filters.caseType) {
      searchQuery += ` type:${filters.caseType}`;
    }

    if (filters.judge) {
      searchQuery += ` judge:${filters.judge}`;
    }

    console.log('Searching Indian Kanoon with query:', searchQuery);

    // Make actual HTTP request to Indian Kanoon
    const html = await fetchIndianKanoonHTML(searchQuery);
    
    // Parse the HTML to extract real case data
    const results = parseIndianKanoonResults(html);
    
    console.log(`Found ${results.length} real cases from Indian Kanoon`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        count: results.length,
        results 
      }), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in scrape-indian-kanoon function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to scrape Indian Kanoon',
        message: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 