
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, Calendar, Building, User, FileText } from "lucide-react";

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

interface CaseResult {
  tid: string;
  title: string;
  headline: string;
  docsource: string;
  docsize: number;
}

const SearchCase: React.FC<SearchCaseProps> = ({ searchFilters }) => {
  const [searchResults, setSearchResults] = useState<CaseResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalFound, setTotalFound] = useState(0);
  const { toast } = useToast();

  const handleSearch = async (pageNum = 0) => {
    if (!searchFilters.keyword.trim() && !searchFilters.citation.trim() && !searchFilters.provision.trim()) {
      toast({
        title: "Missing Search Criteria",
        description: "Please enter at least a case keyword, citation, or legal provision.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting case search with filters:', searchFilters);
      
      // The following lines were removed as per the edit hint:
      // const searchParams = mapSearchFilters(searchFilters);
      // searchParams.pagenum = pageNum;
      
      // const response = await searchCases(searchParams);
      
      // if (response.docs && response.docs.length > 0) {
      //   setSearchResults(response.docs);
      //   setTotalFound(response.found);
      //   setCurrentPage(pageNum);
        
      //   toast({
      //     title: "Search Completed",
      //     description: `Found ${response.found} cases matching your criteria.`
      //   });
      // } else {
      //   setSearchResults([]);
      //   setTotalFound(0);
      //   toast({
      //     title: "No Results",
      //     description: "No cases found matching your search criteria. Try different keywords or filters.",
      //     variant: "destructive"
      //   });
      // }
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

  const formatDocSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

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
                  
                  <div className="text-sm text-gray-700 mb-3 leading-relaxed">
                    {result.headline}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {result.docsource}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {formatDocSize(result.docsize)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-blue-600 font-mono">ID: {result.tid}</span>
                    </div>
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
