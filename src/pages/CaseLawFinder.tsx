import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useGeminiKey } from "@/hooks/useGeminiKey";
import DocumentUploader from "@/components/legal/DocumentUploader";
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

const CaseLawFinder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: geminiKey } = useGeminiKey();
  
  // Form states
  const [caseKeyword, setCaseKeyword] = useState("");
  const [citation, setCitation] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [caseType, setCaseType] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [judge, setJudge] = useState("");
  const [provision, setProvision] = useState("");
  const [documentText, setDocumentText] = useState("");
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);

  const searchFilters = {
    keyword: caseKeyword,
    citation,
    jurisdiction,
    yearFrom,
    yearTo,
    judge,
    provision,
    caseType
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Case Law Finder</h1>
          <p className="text-gray-600">Get AI-recommended cases from Indian Kanoon with detailed analysis and summaries</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Case Keyword</label>
                <input
                  type="text"
                  value={caseKeyword}
                  onChange={(e) => setCaseKeyword(e.target.value)}
                  placeholder="e.g., murder, constitutional rights, property dispute"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Citation</label>
                <input
                  type="text"
                  value={citation}
                  onChange={(e) => setCitation(e.target.value)}
                  placeholder="e.g., AIR 1973 SC 1461, 2023 SCC Online SC 123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Advanced Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-2">Jurisdiction</label>
                  <Select value={jurisdiction} onValueChange={setJurisdiction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Jurisdictions</SelectItem>
                      {jurisdictions.map((jur) => (
                        <SelectItem key={jur} value={jur}>{jur}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Case Type</label>
                  <Select value={caseType} onValueChange={setCaseType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select case type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Case Types</SelectItem>
                      {caseTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Legal Provision</label>
                  <input
                    type="text"
                    value={provision}
                    onChange={(e) => setProvision(e.target.value)}
                    placeholder="e.g., Section 302 IPC, Article 14"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

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
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Upload PDF Document (Optional)</label>
              <DocumentUploader onDocumentProcessed={setDocumentText} onClose={() => setDocumentText("")} />
              {documentText && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">Document uploaded successfully. Content will be used to enhance case law analysis.</p>
                </div>
              )}
            </div>

            {/* Database Search */}
            <div className="mt-4">
              <SearchCase searchFilters={searchFilters} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CaseLawFinder;
