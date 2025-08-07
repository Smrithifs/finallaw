// Debug file to test comprehensive scraper
import { fetchRealCasesFromAllSources } from './realIndianKanoonAPI';

export const debugScraper = async () => {
  console.log('🔍 Debugging Comprehensive Legal Scraper...');
  
  try {
    const testFilters = {
      keyword: "Section 302 IPC",
      citation: "",
      jurisdiction: "",
      yearFrom: "",
      yearTo: "",
      judge: "",
      provision: "",
      caseType: "",
      act: ""
    };
    
    console.log('📤 Sending test filters:', testFilters);
    
    const results = await fetchRealCasesFromAllSources(testFilters, "all");
    
    console.log('✅ Results received:', results.length, 'cases');
    console.log('📋 First result:', results[0]);
    
    return {
      success: true,
      count: results.length,
      sample: results[0]
    };
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Test function that can be called from browser console
(window as any).testScraper = debugScraper; 