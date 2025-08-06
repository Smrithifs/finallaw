
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink } from "lucide-react";
import { searchIndianKanoonCases, fetchIndianKanoonCaseText, summarizeCase, IndianKanoonCase } from "@/utils/indianKanoonApi";
import { useGeminiKey } from "@/hooks/useGeminiKey";

interface SearchCaseProps {
  searchFilters: {
    keyword: string;
    citation: string;
    jurisdiction: string;
    yearFrom: string;
    yearTo: string;
    judge: string;
    provision: string;
    caseType: string;
  };
}

interface CaseResult extends IndianKanoonCase {}

const SearchCase: React.FC<SearchCaseProps> = ({ searchFilters }) => {
  const [searchResults, setSearchResults] = useState<CaseResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalFound, setTotalFound] = useState(0);
  const { toast } = useToast();
  const { data: geminiKey } = useGeminiKey();

  const handleSearch = async (pageNum = 0) => {
    if (!searchFilters.keyword.trim() && !searchFilters.citation.trim() && !searchFilters.provision.trim()) {
      toast({
        title: "Missing Search Criteria",
        description: "Please enter at least a case keyword, citation, or legal provision.",
        variant: "destructive"
      });
      return;
    }

    if (!geminiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your Gemini API key to get AI summaries.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting Indian Kanoon search with filters:', searchFilters);

      const filters = {
        query: searchFilters.keyword || searchFilters.citation || searchFilters.provision,
        act: searchFilters.provision,
        section: searchFilters.provision,
        yearFrom: searchFilters.yearFrom,
        yearTo: searchFilters.yearTo,
        caseType: searchFilters.caseType,
        maxResults: 10,
      };

      const kanoonResults = await searchIndianKanoonCases(filters);

      if (kanoonResults.length === 0) {
        setSearchResults([]);
        toast({
          title: "No Results",
          description: "No cases found on Indian Kanoon for the given query.",
          variant: "destructive"
        });
        return;
      }

      // Rotate results on every refresh by shuffling
      const shuffled = kanoonResults.sort(() => 0.5 - Math.random()).slice(0, 5);

      // Fetch full text and summarise
      const enriched: CaseResult[] = [];
      for (const caseItem of shuffled) {
        try {
          const fullText = await fetchIndianKanoonCaseText(caseItem.tid);
          const { summary, ratioDecidendi, keywords } = await summarizeCase(fullText, geminiKey, caseItem.title);
          enriched.push({ ...caseItem, aiSummary: summary, ratioDecidendi, keywords });
        } catch (e) {
          console.error('Error enriching case', caseItem.tid, e);
          enriched.push({ ...caseItem });
        }
      }

      setSearchResults(enriched);
      setTotalFound(enriched.length);
      setCurrentPage(0);

      toast({
        title: "Search Completed",
        description: `Fetched ${enriched.length} cases and generated AI summaries.`
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setTotalFound(0);
      
      let errorMessage = "An error occurred while searching. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('backend server')) {
          errorMessage = "Backend server is not available. Please ensure the backend is running.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Search Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextPage = () => {
    if (searchResults.length === 10) { // Assuming 10 results per page
      handleSearch(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      handleSearch(currentPage - 1);
    }
  };

  // size formatting removed as not used anymore

  const openCase = (tid: string) => {
    const url = `https://indiankanoon.org/doc/${tid}/`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button 
          onClick={() => handleSearch(0)} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching Cases...
            </>
          ) : (
            'Search Indian Kanoon Database'
          )}
        </Button>
        
        {totalFound > 0 && (
          <div className="text-sm text-gray-600">
            Found {totalFound} cases • Page {currentPage + 1}
          </div>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {searchResults.map((result) => (
              <Card key={result.tid} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-blue-900 text-lg leading-tight">
                      {result.title}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCase(result.tid)}
                      className="ml-4 flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                  
                  {result.aiSummary ? (
                    <div className="prose max-w-none text-sm mb-3">
                      <h4 className="font-semibold mb-1">AI Generated Summary</h4>
                      <p className="whitespace-pre-wrap">{result.aiSummary}</p>
                      {result.ratioDecidendi && (
                        <p className="mt-2"><strong>Ratio Decidendi:</strong> {result.ratioDecidendi}</p>
                      )}
                      {result.keywords && result.keywords.length > 0 && (
                        <p className="mt-2 text-xs text-gray-600"><strong>Keywords:</strong> {result.keywords.join(', ')}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Summary not available.</p>
                  )}
                  <div className="text-xs text-gray-500 mt-2">ID: {result.tid}</div>
                   </div>
                 </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handlePrevPage}
              disabled={currentPage === 0 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={searchResults.length < 10 || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchCase;
