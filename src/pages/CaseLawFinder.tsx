import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Filter, ChevronDown, ChevronUp, Database, Brain, ExternalLink, Calendar, Building, FileText, Copy, Check, Globe, AlertCircle, TestTube } from "lucide-react";
import { useGeminiKey } from "@/hooks/useGeminiKey";
import { callGeminiAPI } from "@/utils/geminiApi";
// Removed client-side API import for case fetching; we'll call the server function directly
import SearchCase from "@/components/SearchCase";

const jurisdictions = [
  "Supreme Court",
  "All High Courts",
  "Allahabad High Court",
  "Andhra Pradesh High Court",
  "Bombay High Court",
  "Calcutta High Court",
  "Delhi High Court",
  "Gujarat High Court",
  "Karnataka High Court",
  "Kerala High Court",
  "Madras High Court",
  "Madhya Pradesh High Court",
  "Orissa High Court",
  "Patna High Court",
  "Punjab & Haryana High Court",
  "Rajasthan High Court",
];

const caseTypes = [
  "Civil Appeal",
  "Criminal Appeal", 
  "Writ Petition",
  "Special Leave Petition",
  "Review Petition",
  "Contempt Petition",
  "Bail Application",
  "Habeas Corpus",
  "Mandamus",
  "Certiorari",
  "Prohibition",
  "Quo Warranto",
  "Public Interest Litigation",
  "Transfer Petition",
  "Interlocutory Application",
  "Miscellaneous Petition",
  "Company Petition",
  "Arbitration Petition",
  "Election Petition",
  "Matrimonial Cases",
  "Land Acquisition Cases",
  "Service Matter",
  "Constitutional Petition",
  "Tax Appeal",
  "Commercial Dispute",
  "Consumer Complaint",
  "Trademark Opposition",
  "Patent Dispute",
  "Copyright Infringement",
  "Environmental Petition",
];

const acts = [
  "Indian Penal Code (IPC)",
  "Code of Criminal Procedure (CrPC)",
  "Code of Civil Procedure (CPC)",
  "Constitution of India",
  "Indian Evidence Act",
  "Transfer of Property Act",
  "Contract Act",
  "Specific Relief Act",
  "Limitation Act",
  "Arbitration and Conciliation Act",
  "Companies Act",
  "Income Tax Act",
  "GST Act",
  "Consumer Protection Act",
  "Right to Information Act",
  "Right to Education Act",
  "Protection of Children from Sexual Offences Act (POCSO)",
  "Domestic Violence Act",
  "Motor Vehicles Act",
  "Land Acquisition Act",
  "Real Estate (Regulation and Development) Act",
  "Insolvency and Bankruptcy Code",
  "Competition Act",
  "Trademark Act",
  "Patent Act",
  "Copyright Act",
  "Environmental Protection Act",
  "Forest Conservation Act",
  "Wildlife Protection Act",
  "Water (Prevention and Control of Pollution) Act",
  "Air (Prevention and Control of Pollution) Act",
];

interface CaseResult {
  tid: string;
  title: string;
  headline: string;
  docsource: string;
  docsize: number;
  year?: string;
  citation?: string;
  aiSummary?: string;
  aiSummaryType?: 'brief' | 'detailed';
  originalContent?: string;
  url: string; // Added url for direct linking
}

const CaseLawFinder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: geminiKey } = useGeminiKey();
  
  // IK credentials are now handled automatically by the proxy server
  // No need to expose them to the user interface

  // Form states
  const [caseKeyword, setCaseKeyword] = useState("");
  const [citation, setCitation] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [caseType, setCaseType] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [judge, setJudge] = useState("");
  const [provision, setProvision] = useState("");
  const [selectedAct, setSelectedAct] = useState("");
  
  // UI states
  const [searchResults, setSearchResults] = useState<CaseResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("database");
  const [copiedCaseId, setCopiedCaseId] = useState<string | null>(null);
  const [searchSource, setSearchSource] = useState<"all" | "indiankanoon" | "scc" | "manupatra">("all");
  const [searchStatus, setSearchStatus] = useState<string>("");

  const searchFilters = {
    keyword: caseKeyword,
    citation,
    jurisdiction,
    yearFrom,
    yearTo,
    judge,
    provision,
    caseType,
    act: selectedAct
  };

  const handleSearch = async () => {
    if (!caseKeyword.trim() && !citation.trim() && !provision.trim() && !selectedAct.trim()) {
      toast({
        title: "Missing Search Criteria",
        description: "Please enter at least a case keyword, citation, legal provision, or select an act.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setSearchStatus("Fetching real cases from Indian Kanoon...");

    try {
      const resp = await fetch('http://localhost:8787/ik/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: searchFilters, pagenum: 0 })
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      if (!data?.success || !Array.isArray(data?.results)) throw new Error('Unexpected proxy response');

      setSearchResults(data.results as CaseResult[]);
      setSearchStatus("");
      toast({ title: "Real Cases Found", description: `Found ${data.results.length} real cases from Indian Kanoon.` });
    } catch (error: any) {
      console.error('Search error:', error);
      setSearchStatus("");
      toast({ title: "Search Error", description: error?.message || "Failed to fetch real cases.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Completely rewritten test function
  const handleTest = () => {
    toast({
      title: "Test Function",
      description: "This is a test function for development.",
      variant: "destructive"
    });
    // No try/finally block to avoid syntax issues
  };

  const handleAISummarize = async (caseItem: CaseResult, summaryType: 'brief' | 'detailed') => {
    if (!geminiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your Gemini API key to use AI summarization.",
        variant: "destructive",
      });
      return;
    }

    try {
      const isBrief = summaryType === 'brief';
      const wordLimit = isBrief ? '150-200 words' : '800-1000 words';
      
      const prompt = `Please provide a ${isBrief ? 'brief' : 'detailed'} summary of the following Indian case law:

Case: ${caseItem.title}
Citation: ${caseItem.citation}
Year: ${caseItem.year}
Court: ${caseItem.docsource}
Headline: ${caseItem.headline}

${isBrief ? 
  `Please provide a concise summary (${wordLimit}) including:
  1. Key facts of the case
  2. Main legal issue
  3. Court's decision
  4. Key legal principle established` 
  : 
  `Please provide a comprehensive summary (${wordLimit}) including:
  1. Detailed facts of the case
  2. All legal issues involved
  3. Court's detailed reasoning and analysis
  4. Key legal principles established
  5. Significance and impact on Indian jurisprudence
  6. Relevant precedents and citations
  7. Practical implications for future cases`

}

Format the response in a clear, structured manner suitable for legal professionals.`;

      const summary = await callGeminiAPI(prompt, geminiKey);
      
      // Update the case with AI summary
      setSearchResults(prev => prev.map(item => 
        item.tid === caseItem.tid 
          ? { 
              ...item, 
              aiSummary: summary.replace(/\*/g, ""),
              aiSummaryType: summaryType
            }
          : item
      ));

      toast({
        title: `${isBrief ? 'Brief' : 'Detailed'} AI Summary Generated`,
        description: `Case has been summarized using AI (${wordLimit}).`
      });

    } catch (error) {
      console.error('AI summarization error:', error);
      toast({
        title: "AI Summarization Error",
        description: "Failed to generate AI summary. Please check your API key and try again.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string, caseId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCaseId(caseId);
      setTimeout(() => setCopiedCaseId(null), 2000);
      toast({
        title: "Copied to Clipboard",
        description: "Case information has been copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const openCase = (url: string) => {
    // Ensure URL is properly formatted
    let formattedUrl = url;
    
    // If it's a relative URL, make it absolute
    if (url.startsWith('/doc/')) {
      formattedUrl = `https://indiankanoon.org${url}`;
    }
    
    // If it's already a full URL, use it as is
    if (url.startsWith('http')) {
      formattedUrl = url;
    }
    
    // Show a toast notification
    toast({
      title: "Opening Indian Kanoon Case",
      description: "Opening the actual case page on Indian Kanoon. This will show the real case details.",
    });
    
    // Open in new tab
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-6 min-h-screen bg-white flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate("/")}>
          ← Back to Home
        </Button>
        <h1 className="text-3xl font-bold text-blue-900">Real Indian Kanoon Legal Research Assistant</h1>
      </div>

      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Main Search Card */}
        <Card className="border-2 border-blue-100">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-blue-900">
                <Globe className="w-6 h-6" />
                Real Indian Kanoon API Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Primary Search Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Case Name / Keyword *</label>
                <input
                  type="text"
                  value={caseKeyword}
                  onChange={(e) => setCaseKeyword(e.target.value)}
                  placeholder="e.g., 'Section 302 IPC', 'Article 21', 'murder', 'Contract Act'"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Citation (Optional)</label>
                <input
                  type="text"
                  value={citation}
                  onChange={(e) => setCitation(e.target.value)}
                  placeholder="e.g., 'AIR 1978 SC 597', '1993 AIR'"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Toggle Filters Button */}
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="w-full md:w-auto"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Advanced Filters
              {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </Button>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="border-t pt-6 space-y-4">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Case Type</label>
                    <Select value={caseType} onValueChange={setCaseType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Case Type" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {caseTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Jurisdiction</label>
                    <Select value={jurisdiction} onValueChange={setJurisdiction}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Court" />
                      </SelectTrigger>
                      <SelectContent>
                        {jurisdictions.map(j => (
                          <SelectItem key={j} value={j}>{j}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Legal Provision / Section</label>
                    <input
                      type="text"
                      value={provision}
                      onChange={(e) => setProvision(e.target.value)}
                      placeholder="e.g., Article 21, Section 438 CrPC"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Year From</label>
                    <input
                      type="number"
                      value={yearFrom}
                      onChange={(e) => setYearFrom(e.target.value)}
                      placeholder="1950"
                      min="1950"
                      max="2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Year To</label>
                    <input
                      type="number"
                      value={yearTo}
                      onChange={(e) => setYearTo(e.target.value)}
                      placeholder="2024"
                      min="1950"
                      max="2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Judge(s)</label>
                    <input
                      type="text"
                      value={judge}
                      onChange={(e) => setJudge(e.target.value)}
                      placeholder="e.g., Justice Khanna, Arijit Pasayat"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Row 3 - Act Selection */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Relevant Act</label>
                    <Select value={selectedAct} onValueChange={setSelectedAct}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relevant Act" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {acts.map(act => (
                          <SelectItem key={act} value={act}>{act}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 4 - Data Source Selection */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Data Sources</label>
                    <Select value={searchSource} onValueChange={(value: any) => setSearchSource(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources (Indian Kanoon + SCC + Manupatra)</SelectItem>
                        <SelectItem value="indiankanoon">Indian Kanoon Only</SelectItem>
                        <SelectItem value="scc">SCC Only</SelectItem>
                        <SelectItem value="manupatra">Manupatra Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Credentials are now handled automatically by the server */}
              </div>
            )}

            {/* Search Button */}
            <div className="flex gap-4">
                <Button 
                onClick={handleSearch} 
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {searchStatus || "Searching Authentic Cases..."}
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Search Authentic Cases
                    </>
                  )}
                </Button>
            </div>

            {/* Status Message */}
            {searchStatus && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">{searchStatus}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card>
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-900">
                  <Database className="w-6 h-6" />
                  Real Indian Kanoon Cases Found ({searchResults.length} actual cases)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {searchResults.map((caseItem) => (
                  <Card key={caseItem.tid} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900 text-lg leading-tight mb-2">
                            {caseItem.title}
                          </h3>
                          <div className="text-sm text-gray-700 mb-3 leading-relaxed">
                            {caseItem.headline}
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {caseItem.docsource}
                            </div>
                            {caseItem.year && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {caseItem.year}
                              </div>
                            )}
                            {caseItem.citation && (
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {caseItem.citation}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {Math.round(caseItem.docsize / 1024)} KB
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-blue-600 font-mono">ID: {caseItem.tid}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCase(caseItem.url)}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(`${caseItem.title}\n${caseItem.citation}\n${caseItem.headline}`, caseItem.tid)}
                          >
                            {copiedCaseId === caseItem.tid ? (
                              <Check className="w-4 h-4 mr-1" />
                            ) : (
                              <Copy className="w-4 h-4 mr-1" />
                            )}
                            Copy
                          </Button>
                        </div>
                      </div>

                      {/* AI Summary Section */}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-900">AI Summary</h4>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAISummarize(caseItem, 'brief')}
                              disabled={!geminiKey}
                            >
                              <Brain className="w-4 h-4 mr-1" />
                              {caseItem.aiSummary && caseItem.aiSummaryType === 'brief' ? 'Regenerate' : 'Generate'} Brief
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAISummarize(caseItem, 'detailed')}
                              disabled={!geminiKey}
                            >
                              <Brain className="w-4 h-4 mr-1" />
                              {caseItem.aiSummary && caseItem.aiSummaryType === 'detailed' ? 'Regenerate' : 'Generate'} Detailed
                            </Button>
                    </div>
                  </div>
                  
                        {caseItem.aiSummary ? (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-blue-700">
                                {caseItem.aiSummaryType === 'brief' ? '📝 Brief Summary' : '📋 Detailed Summary'}
                              </span>
                              <span className="text-xs text-blue-600">
                                {caseItem.aiSummaryType === 'brief' ? '150-200 words' : '800-1000 words'}
                              </span>
                            </div>
                            <div className="prose max-w-none text-sm">
                              <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                                {caseItem.aiSummary}
                    </pre>
                  </div>
                </div>
                        ) : (
                          <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                            {geminiKey ? 
                              "Click 'Generate Brief' or 'Generate Detailed' to get an AI-powered analysis of this case." :
                              "Set your Gemini API key to generate AI summaries."
                            }
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CaseLawFinder;
