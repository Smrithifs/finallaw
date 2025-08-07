// Simple test to check if basic functionality works
export const simpleTest = () => {
  console.log('🧪 Simple test running...');
  
  // Test basic case generation
  const testCases = [];
  for (let i = 1; i <= 5; i++) {
    testCases.push({
      tid: `test_${i}`,
      title: `Test Case ${i}`,
      headline: `This is test case ${i}`,
      docsource: "Supreme Court",
      docsize: 250000,
      year: "2023",
      citation: `2023 AIR SC ${i}`,
      url: `https://indiankanoon.org/doc/test_${i}/`
    });
  }
  
  console.log('✅ Generated test cases:', testCases);
  return testCases;
};

// Make it available globally
(window as any).simpleTest = simpleTest; 