
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit, FileText } from "lucide-react";
import { useGeminiKey } from "@/hooks/useGeminiKey";
import { callGeminiAPI } from "@/utils/geminiApi";
import DocumentUploader from "@/components/legal/DocumentUploader";

interface DocumentFormatterProps {
  transcription: string;
  setTranscription: (transcription: string) => void;
  onDocumentFormatted: (document: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const DocumentFormatter: React.FC<DocumentFormatterProps> = ({
  transcription,
  setTranscription,
  onDocumentFormatted,
  isLoading,
  setIsLoading
}) => {
  const { toast } = useToast();
  const { data: geminiKey } = useGeminiKey();
  const [isEditingTranscription, setIsEditingTranscription] = useState(false);
  const [documentText, setDocumentText] = useState("");

  const formatDocument = async () => {
    if (!transcription.trim()) {
      toast({
        title: "No Transcription",
        description: "Please record audio first.",
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
      const systemInstruction = "You are a legal document formatter specializing in Indian legal documents. Convert voice transcriptions into properly structured legal documents with correct formatting, language, and legal provisions.";
      
      const documentContext = documentText ? `\n\nAdditional Document Context:\n${documentText}\n\nPlease incorporate this document content into the legal document as appropriate.` : '';
    
      const prompt = `You are an expert legal document formatter. Convert the following voice transcription into a properly formatted legal document. Ensure the document follows Indian legal writing standards with appropriate headings, subheadings, paragraphs, and legal terminology.${documentContext}\n\nVoice Transcription:\n${transcription}\n\nPlease format this into a professional legal document. Format it as a complete, professional legal petition/application.`;

      const result = await callGeminiAPI(prompt, geminiKey);
      // Clean result: remove asterisks for cleaner formatting
      const cleanedResult = result.replace(/\*/g, "");

      onDocumentFormatted(cleanedResult);
      toast({
        title: "Document Formatted",
        description: "Your voice input has been converted to a legal document."
      });
    } catch (error) {
      console.error('Error formatting document:', error);
      toast({
        title: "Error",
        description: "Failed to format document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!transcription) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Format to Legal Document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Upload PDF Document (Optional)</label>
          <DocumentUploader onDocumentProcessed={setDocumentText} onClose={() => setDocumentText("")} />
          {documentText && (
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Document uploaded successfully. Content will be used to enhance legal document formatting.</p>
            </div>
          )}
        </div>
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium">Transcribed Text</label>
          <Button
            onClick={() => setIsEditingTranscription(!isEditingTranscription)}
            variant="outline"
            size="sm"
          >
            <Edit className="w-4 h-4 mr-2" />
            {isEditingTranscription ? "Save" : "Edit"}
          </Button>
        </div>
        <Textarea
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
          readOnly={!isEditingTranscription}
          rows={6}
          className={`w-full ${!isEditingTranscription ? 'bg-gray-50' : ''}`}
          placeholder="Your transcribed text will appear here..."
        />
        <Button 
          onClick={formatDocument} 
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Formatting Document...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Convert to Legal Document
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DocumentFormatter;
