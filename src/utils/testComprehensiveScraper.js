// Simple test for comprehensive legal scraper
import { fetchRealCasesFromAllSources } from './comprehensiveLegalScraper.js';

const testComprehensiveScraper = async () => {
  console.log('🧪 Testing Comprehensive Legal Scraper...');
  
  const testQueries = [
    "Section 302 IPC",
    "Article 21", 
    "Contract Act",
    "Section 138 NI Act",
    "murder",
    "cyber crime"
  ];
  
  for (const query of testQueries) {
    try {
      console.log(`\n🔍 Testing: "${query}"`);
      
      const testFilters = {
        keyword: query,
        citation: "",
        jurisdiction: "",
        yearFrom: "",
        yearTo: "",
        judge: "",
        provision: "",
        caseType: "",
        act: ""
      };
      
      const results = await fetchRealCasesFromAllSources(testFilters, "all");
      console.log(`✅ Found ${results.length} cases for "${query}"`);
      
      // Show first result
      if (results.length > 0) {
        const firstCase = results[0];
        console.log(`📋 Sample: ${firstCase.title} (${firstCase.citation})`);
        console.log(`🔗 URL: ${firstCase.url}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed for "${query}":`, error);
    }
  }
  
  console.log('\n🎉 Comprehensive testing completed!');
};

// Run the test
testComprehensiveScraper(); 