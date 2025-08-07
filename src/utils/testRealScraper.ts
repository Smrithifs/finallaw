import { fetchRealCasesFromAllSources } from './realIndianKanoonAPI';

export const testRealScraper = async () => {
  console.log('🧪 Testing Comprehensive Legal Scraper...');
  
  try {
    // Test with a comprehensive search
    const testFilters = {
      keyword: "Section 302 IPC",
      citation: "",
      jurisdiction: "Supreme Court",
      yearFrom: "2020",
      yearTo: "2024",
      judge: "",
      provision: "",
      caseType: "",
      act: ""
    };
    
    const results = await fetchRealCasesFromAllSources(testFilters, "all");
    
    console.log('✅ Test Results:', results.length, 'cases found');
    results.forEach((caseItem, index) => {
      console.log(`${index + 1}. ${caseItem.title} (${caseItem.citation})`);
    });
    
    return results;
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

export const testMultipleSearches = async () => {
  console.log('🧪 Testing Multiple Comprehensive Searches...');
  
  const testQueries = [
    "Section 302 IPC",
    "Article 21",
    "Contract Act", 
    "Section 138 NI Act",
    "Section 9 CPC",
    "Section 420 IPC",
    "Article 14",
    "Property Act",
    "Evidence Act",
    "Companies Act",
    "Income Tax Act",
    "Section 376 IPC",
    "Section 498A IPC",
    "Section 482 CrPC",
    "murder",
    "divorce",
    "bail",
    "land acquisition",
    "environmental law",
    "cyber crime",
    "intellectual property",
    "consumer protection",
    "labor law",
    "banking law",
    "insurance law",
    "real estate law",
    "family law",
    "criminal procedure",
    "civil procedure",
    "constitutional law"
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
      
    } catch (error) {
      console.error(`❌ Failed for "${query}":`, error);
    }
  }
  
  console.log('\n🎉 Comprehensive testing completed!');
}; 