
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import QABot from "./pages/QABot";
import Summarizer from "./pages/Summarizer";
import ToolsAndFeatures from "./pages/ToolsAndFeatures";
import CaseLawFinder from "./pages/CaseLawFinder";
import SectionExplainer from "./pages/SectionExplainer";
import BareActNavigator from "./pages/BareActNavigator";
import LegalDraftTemplates from "./pages/LegalDraftTemplates";
import LegalDraftGenerator from "./pages/LegalDraftGenerator";

import MultiLanguageSupport from "./pages/MultiLanguageSupport";
import CitationChecker from "./pages/CitationChecker";
import Notebook from "./pages/Notebook";

const queryClient = new QueryClient();

const App: React.FC = () => {
  console.log("App component is rendering");
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/legal-qna" element={<QABot />} />
            <Route path="/summarizer" element={<Summarizer />} />
            <Route path="/tools" element={<ToolsAndFeatures />} />
            <Route path="/case-law-finder" element={<CaseLawFinder />} />
            <Route path="/section-explainer" element={<SectionExplainer />} />
            <Route path="/bare-act-navigator" element={<BareActNavigator />} />
            <Route path="/legal-draft-templates" element={<LegalDraftTemplates />} />
            <Route path="/legal-draft-generator" element={<LegalDraftGenerator />} />
            
            <Route path="/multi-language-support" element={<MultiLanguageSupport />} />
            <Route path="/notebook" element={<Notebook />} />
            <Route path="/citation-checker" element={<CitationChecker />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
