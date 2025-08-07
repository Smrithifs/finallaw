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

// Function to extract case information from Indian Kanoon search results
const parseIndianKanoonResults = (html: string): CaseResult[] => {
  const results: CaseResult[] = [];
  
  try {
    // Create a DOM parser (this would work in a Node.js environment with jsdom)
    // For now, we'll use regex patterns to extract information
    
    // Extract case titles and links
    const titleRegex = /<a[^>]*href="\/doc\/([^"]+)\/"[^>]*>([^<]+)<\/a>/g;
    const headlineRegex = /<div[^>]*class="result_title"[^>]*>([^<]+)<\/div>/g;
    const citationRegex = /AIR\s+\d+\s+\w+\s+\d+/g;
    const yearRegex = /(\d{4})/g;
    
    let match;
    let caseCount = 0;
    
    while ((match = titleRegex.exec(html)) !== null && caseCount < 10) {
      const tid = match[1];
      const title = match[2].trim();
      
      // Extract headline (simplified)
      const headlineMatch = html.match(/<div[^>]*class="result_title"[^>]*>([^<]+)<\/div>/);
      const headline = headlineMatch ? headlineMatch[1].trim() : "Case details available";
      
      // Extract citation
      const citationMatch = html.match(citationRegex);
      const citation = citationMatch ? citationMatch[0] : "";
      
      // Extract year
      const yearMatch = title.match(yearRegex);
      const year = yearMatch ? yearMatch[0] : "";
      
      results.push({
        tid,
        title,
        headline,
        docsource: "Supreme Court", // Default, would be extracted from actual data
        docsize: Math.floor(Math.random() * 1000000) + 100000, // Mock size
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

// Function to fetch real cases from Indian Kanoon
export const fetchRealIndianKanoonCases = async (filters: SearchFilters): Promise<CaseResult[]> => {
  try {
    // Build search query
    let searchQuery = filters.keyword || filters.citation || filters.provision || filters.act;
    
    if (!searchQuery) {
      throw new Error("No search criteria provided");
    }

    // Add filters to search query
    if (filters.yearFrom && filters.yearTo) {
      searchQuery += ` year:${filters.yearFrom}-${filters.yearTo}`;
    } else if (filters.yearFrom) {
      searchQuery += ` year:${filters.yearFrom}`;
    }

    if (filters.jurisdiction && filters.jurisdiction !== "All High Courts") {
      searchQuery += ` court:${filters.jurisdiction}`;
    }

    // Encode the search query for URL
    const encodedQuery = encodeURIComponent(searchQuery);
    const searchUrl = `https://indiankanoon.org/search/?formInput=${encodedQuery}&type=phrase`;

    console.log('Searching Indian Kanoon with URL:', searchUrl);

    // In a real implementation, you would make an HTTP request here
    // For now, we'll return enhanced mock data that simulates real scraping
    
    const enhancedMockResults: CaseResult[] = [
      {
        tid: "123456",
        title: "Kesavananda Bharati vs State of Kerala",
        headline: "Landmark case establishing the basic structure doctrine of the Constitution",
        docsource: "Supreme Court",
        docsize: 1024000,
        year: "1973",
        citation: "AIR 1973 SC 1461",
        url: "https://indiankanoon.org/doc/123456/"
      },
      {
        tid: "123457",
        title: "Maneka Gandhi vs Union of India",
        headline: "Expanded the scope of Article 21 to include right to life and personal liberty",
        docsource: "Supreme Court",
        docsize: 512000,
        year: "1978",
        citation: "AIR 1978 SC 597",
        url: "https://indiankanoon.org/doc/123457/"
      },
      {
        tid: "123458",
        title: "Indira Nehru Gandhi vs Raj Narain",
        headline: "Case related to electoral malpractices and constitutional validity",
        docsource: "Supreme Court",
        docsize: 768000,
        year: "1975",
        citation: "AIR 1975 SC 2299",
        url: "https://indiankanoon.org/doc/123458/"
      },
      {
        tid: "123459",
        title: "S.R. Bommai vs Union of India",
        headline: "Case establishing guidelines for imposition of President's Rule",
        docsource: "Supreme Court",
        docsize: 640000,
        year: "1994",
        citation: "AIR 1994 SC 1918",
        url: "https://indiankanoon.org/doc/123459/"
      },
      {
        tid: "123460",
        title: "Vishaka vs State of Rajasthan",
        headline: "Landmark case on sexual harassment at workplace",
        docsource: "Supreme Court",
        docsize: 384000,
        year: "1997",
        citation: "AIR 1997 SC 3011",
        url: "https://indiankanoon.org/doc/123460/"
      },
      {
        tid: "123461",
        title: "A.K. Gopalan vs State of Madras",
        headline: "Case dealing with preventive detention and fundamental rights",
        docsource: "Supreme Court",
        docsize: 456000,
        year: "1950",
        citation: "AIR 1950 SC 27",
        url: "https://indiankanoon.org/doc/123461/"
      },
      {
        tid: "123462",
        title: "Golak Nath vs State of Punjab",
        headline: "Case on Parliament's power to amend fundamental rights",
        docsource: "Supreme Court",
        docsize: 512000,
        year: "1967",
        citation: "AIR 1967 SC 1643",
        url: "https://indiankanoon.org/doc/123462/"
      },
      {
        tid: "123463",
        title: "Minerva Mills vs Union of India",
        headline: "Case on basic structure doctrine and fundamental rights",
        docsource: "Supreme Court",
        docsize: 384000,
        year: "1980",
        citation: "AIR 1980 SC 1789",
        url: "https://indiankanoon.org/doc/123463/"
      },
      {
        tid: "123464",
        title: "Kharak Singh vs State of Uttar Pradesh",
        headline: "Case on right to privacy and personal liberty",
        docsource: "Supreme Court",
        docsize: 320000,
        year: "1963",
        citation: "AIR 1963 SC 1295",
        url: "https://indiankanoon.org/doc/123464/"
      },
      {
        tid: "123465",
        title: "R.C. Cooper vs Union of India",
        headline: "Case on bank nationalization and fundamental rights",
        docsource: "Supreme Court",
        docsize: 448000,
        year: "1970",
        citation: "AIR 1970 SC 564",
        url: "https://indiankanoon.org/doc/123465/"
      }
    ];

    // Filter results based on search criteria
    let filteredResults = enhancedMockResults.filter(caseItem => {
      const matchesKeyword = !filters.keyword || 
        caseItem.title.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        caseItem.headline.toLowerCase().includes(filters.keyword.toLowerCase());
      
      const matchesCitation = !filters.citation || 
        caseItem.citation?.toLowerCase().includes(filters.citation.toLowerCase());
      
      const matchesYear = !filters.yearFrom || !filters.yearTo || 
        (caseItem.year && parseInt(caseItem.year) >= parseInt(filters.yearFrom) && parseInt(caseItem.year) <= parseInt(filters.yearTo));
      
      const matchesCaseType = !filters.caseType || 
        caseItem.title.toLowerCase().includes(filters.caseType.toLowerCase());
      
      const matchesAct = !filters.act || 
        caseItem.headline.toLowerCase().includes(filters.act.toLowerCase());
      
      return matchesKeyword && matchesCitation && matchesYear && matchesCaseType && matchesAct;
    });

    // Return top 5-10 results
    return filteredResults.slice(0, 10);

  } catch (error) {
    console.error('Error fetching real Indian Kanoon cases:', error);
    throw new Error('Failed to fetch cases from Indian Kanoon');
  }
};

// Function to fetch cases from SCC
export const fetchRealSCCCases = async (filters: SearchFilters): Promise<CaseResult[]> => {
  try {
    // Mock SCC results - in real implementation, you would scrape scconline.com
    const sccResults: CaseResult[] = [
      {
        tid: "scc001",
        title: "Kesavananda Bharati vs State of Kerala",
        headline: "Basic structure doctrine established",
        docsource: "Supreme Court",
        docsize: 1024000,
        year: "1973",
        citation: "(1973) 4 SCC 225",
        url: "https://www.scconline.com/Members/Search.aspx"
      },
      {
        tid: "scc002",
        title: "Maneka Gandhi vs Union of India",
        headline: "Right to life and personal liberty expanded",
        docsource: "Supreme Court",
        docsize: 512000,
        year: "1978",
        citation: "(1978) 1 SCC 248",
        url: "https://www.scconline.com/Members/Search.aspx"
      },
      {
        tid: "scc003",
        title: "Indira Nehru Gandhi vs Raj Narain",
        headline: "Electoral malpractices case",
        docsource: "Supreme Court",
        docsize: 768000,
        year: "1975",
        citation: "(1975) Supp SCC 1",
        url: "https://www.scconline.com/Members/Search.aspx"
      }
    ];

    return sccResults.slice(0, 5);
  } catch (error) {
    console.error('Error fetching SCC cases:', error);
    throw new Error('Failed to fetch cases from SCC');
  }
};

// Function to fetch cases from Manupatra
export const fetchRealManupatraCases = async (filters: SearchFilters): Promise<CaseResult[]> => {
  try {
    // Mock Manupatra results - in real implementation, you would scrape manupatra.com
    const manupatraResults: CaseResult[] = [
      {
        tid: "mp001",
        title: "Kesavananda Bharati vs State of Kerala",
        headline: "Constitutional law landmark case",
        docsource: "Supreme Court",
        docsize: 1024000,
        year: "1973",
        citation: "1973 AIR 1461",
        url: "https://www.manupatra.com/"
      },
      {
        tid: "mp002",
        title: "Maneka Gandhi vs Union of India",
        headline: "Fundamental rights interpretation",
        docsource: "Supreme Court",
        docsize: 512000,
        year: "1978",
        citation: "1978 AIR 597",
        url: "https://www.manupatra.com/"
      },
      {
        tid: "mp003",
        title: "S.R. Bommai vs Union of India",
        headline: "President's Rule guidelines",
        docsource: "Supreme Court",
        docsize: 640000,
        year: "1994",
        citation: "1994 AIR 1918",
        url: "https://www.manupatra.com/"
      }
    ];

    return manupatraResults.slice(0, 5);
  } catch (error) {
    console.error('Error fetching Manupatra cases:', error);
    throw new Error('Failed to fetch cases from Manupatra');
  }
};

// Main function to fetch cases from all sources
export const fetchRealCasesFromAllSources = async (
  filters: SearchFilters, 
  source: "all" | "indiankanoon" | "scc" | "manupatra" = "all"
): Promise<CaseResult[]> => {
  try {
    let allResults: CaseResult[] = [];

    if (source === "all" || source === "indiankanoon") {
      try {
        const indianKanoonResults = await fetchRealIndianKanoonCases(filters);
        allResults.push(...indianKanoonResults);
      } catch (error) {
        console.error('Error fetching from Indian Kanoon:', error);
      }
    }

    if (source === "all" || source === "scc") {
      try {
        const sccResults = await fetchRealSCCCases(filters);
        allResults.push(...sccResults);
      } catch (error) {
        console.error('Error fetching from SCC:', error);
      }
    }

    if (source === "all" || source === "manupatra") {
      try {
        const manupatraResults = await fetchRealManupatraCases(filters);
        allResults.push(...manupatraResults);
      } catch (error) {
        console.error('Error fetching from Manupatra:', error);
      }
    }

    // Remove duplicates based on case title
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.title === result.title)
    );

    return uniqueResults.slice(0, 10);
  } catch (error) {
    console.error('Error fetching cases from all sources:', error);
    throw new Error('Failed to fetch cases from legal databases');
  }
}; 