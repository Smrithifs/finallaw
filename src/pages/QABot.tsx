
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useGeminiKey } from "@/hooks/useGeminiKey";
import { callGeminiAPI } from "@/utils/geminiApi";

const QABot = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: geminiKey } = useGeminiKey();
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; }[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load chat history from local storage on component mount
    const storedMessages = localStorage.getItem('chatHistory');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, []);

  useEffect(() => {
    // Save chat history to local storage whenever messages change
    localStorage.setItem('chatHistory', JSON.stringify(messages));
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (!geminiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your Gemini API key to use this feature.",
        variant: "destructive",
      });
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      console.log('Processing Legal Q&A for:', userMessage);
      
      const systemInstruction = "You are an expert Indian legal assistant. Provide comprehensive legal answers for Indian law, including relevant sections, case law, and practical guidance where applicable.";
      
      const prompt = `${systemInstruction}

**User Question:** ${userMessage}

Please provide a comprehensive legal answer for Indian law, including relevant sections, case law, and practical guidance where applicable.

Format your response as:
1. 📜 **Legal Answer**
2. ✨ **Simplified Explanation**`;

      const result = await callGeminiAPI(prompt, geminiKey);
      // Clean result: remove asterisks and add the mandatory greeting
      const cleaned = result.replace(/\*/g, "");
      const finalResponse = `Welcome to LegalOps, ask any question my lord!\n\n${cleaned}`;

      setMessages(prev => [...prev, { role: "assistant", content: finalResponse }]);
      
      toast({
        title: "Response Generated",
        description: "Legal response generated using AI analysis"
      });
    } catch (error) {
      console.error('Error generating response:', error);
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <div className="flex items-center gap-4 mb-8 p-6">
        <Button variant="ghost" onClick={() => navigate("/tools")} className="hover:bg-white/70">
          ← Back to Tools
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">AI</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Legal AI Chatbot</h1>
        </div>
      </div>

      <div className="flex-grow flex flex-col max-w-6xl mx-auto w-full px-6">
        <Card className="flex-grow flex flex-col bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-xs">💬</span>
              </div>
              Chat History
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <ScrollArea className="flex-grow">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 ${message.role === "user" ? "justify-end" : ""
                      }`}
                  >
                    {message.role === "assistant" && (
                      <Avatar>
                        <AvatarImage src="/bot.png" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    )}
                     <div
                      className={`rounded-lg p-4 text-sm max-w-[75%] shadow-md ${message.role === "user"
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                          : "bg-white text-gray-800 border border-gray-200"
                        }`}
                    >
                      <pre className="whitespace-pre-wrap font-sans">
                        {message.content}
                      </pre>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-2">
                    <Avatar>
                      <AvatarImage src="/bot.png" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="rounded-md p-3 text-sm max-w-[75%] bg-gray-100 text-gray-800">
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="mt-4">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="flex items-center space-x-4 p-4">
              <Input
                type="text"
                placeholder="Ask me anything about Indian law..."
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6"
              >
                Send
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QABot;
