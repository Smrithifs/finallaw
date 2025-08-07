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
    // Extract case links and titles using regex patterns
    const caseLinkRegex = /<a[^>]*href="\/doc\/([^"]+)\/"[^>]*>([^<]+)<\/a>/g;
    const resultDivRegex = /<div[^>]*class="result"[^>]*>([\s\S]*?)<\/div>/g;
    const citationRegex = /(AIR\s+\d+\s+\w+\s+\d+)|((\d{4})\s+\d+\s+\w+\s+\d+)/g;
    const yearRegex = /(\d{4})/g;
    
    let match;
    let caseCount = 0;
    const maxCases = 15;
    
    // Extract all result divs first
    const resultDivs: string[] = [];
    while ((match = resultDivRegex.exec(html)) !== null) {
      resultDivs.push(match[1]);
    }
    
    // Process each result div
    for (const div of resultDivs) {
      if (caseCount >= maxCases) break;
      
      // Extract case link and title
      const linkMatch = div.match(/<a[^>]*href="\/doc\/([^"]+)\/"[^>]*>([^<]+)<\/a>/);
      if (!linkMatch) continue;
      
      const tid = linkMatch[1];
      const title = linkMatch[2].trim();
      
      // Extract headline/summary
      const headlineMatch = div.match(/<div[^>]*class="result_title"[^>]*>([^<]+)<\/div>/);
      const headline = headlineMatch ? headlineMatch[1].trim() : "Case details available";
      
      // Extract citation
      const citationMatch = div.match(citationRegex);
      const citation = citationMatch ? citationMatch[0] : "";
      
      // Extract year from title or citation
      const yearMatch = (title + " " + citation).match(yearRegex);
      const year = yearMatch ? yearMatch[0] : "";
      
      // Determine court source
      let docsource = "Supreme Court";
      if (title.toLowerCase().includes("high court") || citation.toLowerCase().includes("hc")) {
        docsource = "High Court";
      } else if (title.toLowerCase().includes("supreme court") || citation.toLowerCase().includes("sc")) {
        docsource = "Supreme Court";
      }
      
      // Calculate mock docsize based on title length
      const docsize = Math.floor(title.length * 1000) + 100000;
      
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
      
      caseCount++;
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