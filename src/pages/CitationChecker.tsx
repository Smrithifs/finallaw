
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { useGeminiKey } from "@/hooks/useGeminiKey";
import { callGeminiAPI } from "@/utils/geminiApi";
import DocumentUploader from "@/components/legal/DocumentUploader";

const CitationChecker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: geminiKey } = useGeminiKey();
  const [citation, setCitation] = useState("");
  const [checkResult, setCheckResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<string>("");
  const [documentText, setDocumentText] = useState("");

  const handleCheck = async () => {
    if (!citation.trim()) {
      toast({
        title: "Missing Citation",
        description: "Please enter a case citation to check.",
        variant: "destructive"
      });
      return;
    }

    if (!geminiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your Gemini API key to use this feature.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Checking citation:', citation);
      
      const systemInstruction = "You are a legal citation expert. Analyze and validate legal citations for Indian case law.";
      
      const documentContext = documentText ? `\n\nAdditional Document Context:\n${documentText}\n\nPlease analyze this document's citations in relation to the specified citation.` : '';
      
      const prompt = `${systemInstruction}${documentContext}

**Citation to Check:** "${citation}"

Please provide:
1. Validity status of the citation
2. Correct format if invalid
3. Court and year information
4. Any additional relevant details

Structure your response clearly without using markdown asterisks.`;

      const result = await callGeminiAPI(prompt, geminiKey);
      // Clean result: remove asterisks for cleaner formatting
      const cleanedResult = result.replace(/\*/g, "");

      setCheckResult(cleanedResult);
      toast({
        title: "Citation Analysis Complete",
        description: "Citation analysis completed using AI validation"
      });
    } catch (error) {
      console.error('Error checking citation:', error);
      toast({
        title: "Error",
        description: "Failed to check citation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setUploadedDocument(text);
        toast({
          title: "Document Uploaded",
          description: "Document content has been loaded for citation analysis."
        });
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-white flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate("/tools")}>
          ← Back to Tools
        </Button>
        <h1 className="text-2xl font-bold">Citation Checker</h1>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Citation Checker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Upload PDF Document (Optional)</label>
              <DocumentUploader onDocumentProcessed={setDocumentText} onClose={() => setDocumentText("")} />
              {documentText && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">Document uploaded successfully. Content will be used to enhance citation checking.</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Case Citation</label>
              <input
                type="text"
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
                placeholder="e.g., 'AIR 1973 SC 1461', 'Kesavananda Bharati v. State of Kerala', '(2018) 10 SCC 1'"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Upload Document (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="document-upload"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="document-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Click to upload document with citations to check
                  </span>
                  <span className="text-xs text-gray-500">
                    Supports TXT, PDF, DOC, DOCX files
                  </span>
                </label>
              </div>
              {uploadedDocument && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  Document uploaded successfully!
                </div>
              )}
            </div>

            <Button 
              onClick={handleCheck} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking Citation...
                </>
              ) : (
                "Check Citation Format"
              )}
            </Button>
          </CardContent>
        </Card>

        {checkResult && (
          <Card>
            <CardHeader>
              <CardTitle>Citation Analysis Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {checkResult}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CitationChecker;
