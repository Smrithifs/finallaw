
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Gavel, BookOpen, Layers, FileEdit, Search, Landmark, Wand2,
  AudioLines, Brain, Users, Languages, Scale, Shield, CheckCircle, ArrowRight
} from "lucide-react";

const lawyerTools = [
  { name: "Contract Generator", icon: <FileEdit className="w-7 h-7 text-blue-600" /> },
  { name: "Case Law Finder", icon: <Search className="w-7 h-7 text-green-600" /> },
  { name: "Section Explainer", icon: <Landmark className="w-7 h-7 text-gray-600" /> },
  { name: "Bare Act Navigator", icon: <BookOpen className="w-7 h-7 text-amber-700" /> },
  { name: "Legal Draft Templates", icon: <Layers className="w-7 h-7 text-purple-600" /> },

  { name: "Multi-Language Support", icon: <Languages className="w-7 h-7 text-blue-700" /> },
  { name: "Citation Checker", icon: <Wand2 className="w-7 h-7 text-lime-700" /> },
  { name: "Client Brief Summary Tool", icon: <Brain className="w-7 h-7 text-indigo-700" /> },

  { name: "Legal Q&A (NyayaBot)", icon: <Gavel className="w-7 h-7 text-yellow-700" /> }
];

const studentTools = [
  { name: "Notes Taker", icon: <FileEdit className="w-7 h-7 text-purple-600" /> },
  { name: "Legal Q&A (NyayaBot)", icon: <Gavel className="w-7 h-7 text-yellow-700" /> }
];

const whyLegalOpsItems = [
  { bold: "Craft impeccable contracts:", text: " Generate NDAs, Service Agreements, Leases, and more—meticulously customized, flawlessly executed, within minutes." },
  { bold: "Instantaneous law-based responses:", text: " NyayaBot references IPC, CrPC, and statutes with unwavering precision. Never offers unsupported speculation or precarious counsel." },
  { bold: "Transform complex legalese eloquently:", text: " Converts intricate documents to actionable insights—eliminating confusion and empowering clarity." },
  { bold: "Fortress-level security & privacy:", text: " Your sensitive data remains confidential. Experience every feature freely—no registration barriers." },
  { bold: "Engineered for contemporary practice:", text: " Minimize administrative burden, maximize strategic legal work that truly transforms outcomes." }
];

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen about-page-bg">
      {/* Navigation */}
      <nav className="ivo-nav">
        <div className="ivo-container">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, var(--ivo-secondary), #0099cc)'
              }}>
                <Scale className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--ivo-primary)' }}>LegalOps</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => navigate("/")} className="ivo-nav-link">Home</button>
              <a href="/#tools-section" className="ivo-nav-link">Tools</a>
              <a href="#about" className="ivo-nav-link">About</a>
              <a href="#contact" className="ivo-nav-link">Contact</a>
            </div>

            <Button onClick={() => navigate("/")} className="ivo-btn-primary">
              Launch LegalOps
            </Button>
          </div>
        </div>
      </nav>

      <main className="relative">
        {/* Hero Section */}
        <section className="ivo-hero ivo-section relative about-hero-bg">
          <div className="ivo-container">
            <div className="text-center mb-16 ivo-fade-in">
              <h1 className="ivo-text-hero mb-6">
                About LegalOps
              </h1>
              <p className="ivo-text-body max-w-4xl mx-auto text-gray-700">
                Elevate your legal practice with sophisticated, intelligent automation—meticulously crafted by distinguished legal professionals, exclusively for the legal community.
              </p>
            </div>
          </div>
        </section>

        {/* Mission/Vision Section */}
        <section className="ivo-section about-mission-bg">
          <div className="ivo-container">
            <div className="ivo-card max-w-4xl mx-auto p-8 md:p-12 mission-card">
              <h2 className="ivo-text-heading text-center mb-6 text-gray-800">Our Distinguished Mission</h2>
              <p className="ivo-text-body text-center text-gray-700 leading-relaxed">
                LegalOps represents the pinnacle of legal technology innovation, meticulously designed for discerning Indian legal professionals, prestigious law firms, and forward-thinking enterprises who demand <span className="font-semibold text-blue-900">exceptional velocity, uncompromising precision, and absolute control</span>. 
                <br/><br/>
                We harmoniously blend profound legal scholarship with revolutionary artificial intelligence, empowering you to conceive, refine, and comprehend legal documents with <strong className="text-blue-900">unprecedented efficiency and intellectual sophistication.</strong> 
                <br/><br/>
                Our paramount objective transcends mere automation—we eliminate the mundane and repetitive, liberating your expertise to focus on high-value legal strategizing that genuinely transforms client outcomes and shapes legal precedent.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="ivo-section about-features-bg">
          <div className="ivo-container">
            <Card className="ivo-card max-w-4xl mx-auto features-card">
              <CardHeader>
                <CardTitle className="ivo-text-heading text-center mb-4 text-gray-800">Why Distinguished Legal Professionals Choose LegalOps</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-6">
                  {whyLegalOpsItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-emerald-500 mt-1 flex-shrink-0" />
                      <span className="ivo-text-body text-gray-700">
                        <strong className="text-blue-900">{item.bold}</strong>{item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section className="ivo-section about-tools-bg">
          <div className="ivo-container">
            <div className="text-center mb-16">
              <h2 className="ivo-text-heading mb-6 text-gray-800">Explore Our Distinguished Features</h2>
            </div>

            {/* Role Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
              <div className="ivo-card-feature text-center role-card">
                <div className="ivo-icon mx-auto">
                  <Gavel className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Distinguished Legal Practitioner</h3>
                <p className="ivo-text-small text-gray-600">Access premium tools designed for professionals—sophisticated contracts, advanced legal consultation, citation verification, and comprehensive case analysis.</p>
              </div>
              <div className="ivo-card-feature text-center role-card">
                <div className="ivo-icon mx-auto">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Aspiring Legal Scholar</h3>
                <p className="ivo-text-small text-gray-600">Enhance your academic journey with intelligent learning aids—advanced note-taking systems and comprehensive legal Q&A resources.</p>
              </div>
            </div>

            {/* Tool Categories */}
            <div className="space-y-16">
              <div>
                <h3 className="ivo-text-subheading text-center mb-8 text-gray-800">Professional Legal Instruments</h3>
                <div className="ivo-grid-features">
                  {lawyerTools.map((tool) => (
                    <Card key={tool.name} className="ivo-card-feature tool-card">
                      <CardHeader className="items-center text-center">
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full mb-4 shadow-sm">
                          {tool.icon}
                        </div>
                        <CardTitle className="text-lg font-bold text-gray-800">{tool.name}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="ivo-text-subheading text-center mb-8 text-gray-800">Academic Excellence Tools</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                  {studentTools.map((tool) => (
                    <Card key={tool.name} className="ivo-card-feature tool-card">
                      <CardHeader className="items-center text-center">
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-100 rounded-full mb-4 shadow-sm">
                          {tool.icon}
                        </div>
                        <CardTitle className="text-lg font-bold text-gray-800">{tool.name}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center mt-16">
              <Button 
                onClick={() => navigate("/")}
                className="ivo-btn-primary text-lg px-8 py-4"
              >
                Experience These Features <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="ivo-text-small mt-6 italic text-gray-600">
                This platform complements but does not substitute professional legal counsel.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-20 footer-bg" style={{ borderColor: 'var(--ivo-gray-200)' }}>
        <div className="ivo-container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, var(--ivo-secondary), #0099cc)'
                }}>
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold" style={{ color: 'var(--ivo-primary)' }}>LegalOps</span>
              </div>
              <p className="ivo-text-small leading-relaxed text-gray-600">
                AI-powered legal assistance for the modern legal professional.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-gray-800">Product</h3>
              <ul className="space-y-4">
                <li><a href="#tools-section" className="ivo-text-small hover:text-blue-600 ivo-transition text-gray-600">All Tools</a></li>
                <li><button onClick={() => navigate("/about")} className="ivo-text-small hover:text-blue-600 ivo-transition text-gray-600">About</button></li>
                <li><a href="#" className="ivo-text-small hover:text-blue-600 ivo-transition text-gray-600">Pricing</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-gray-800">Support</h3>
              <ul className="space-y-4">
                <li><a href="#" className="ivo-text-small hover:text-blue-600 ivo-transition text-gray-600">Help Center</a></li>
                <li><a href="#" className="ivo-text-small hover:text-blue-600 ivo-transition text-gray-600">Feedback</a></li>
                <li><a href="#" className="ivo-text-small hover:text-blue-600 ivo-transition text-gray-600">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-6 text-gray-800">Legal</h3>
              <ul className="space-y-4">
                <li><a href="#" className="ivo-text-small hover:text-blue-600 ivo-transition text-gray-600">Privacy Policy</a></li>
                <li><a href="#" className="ivo-text-small hover:text-blue-600 ivo-transition text-gray-600">Legal Disclaimer</a></li>
                <li><a href="#" className="ivo-text-small hover:text-blue-600 ivo-transition text-gray-600">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center" style={{ borderColor: 'var(--ivo-gray-200)' }}>
            <p className="ivo-text-small text-gray-600">
              © 2024 LegalOps. All rights reserved. Built with ❤️ for the legal community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
