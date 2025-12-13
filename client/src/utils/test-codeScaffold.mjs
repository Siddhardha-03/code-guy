/**
 * Test script for enhanced codeScaffold.js
 * Validates that the new canonical type system works correctly
 */

import { 
  generateCodeTemplate, 
  mapCanonicalToLang 
} from './codeScaffold.js';

console.log('='.repeat(80));
console.log('CODE SCAFFOLD ENHANCEMENT TEST');
console.log('='.repeat(80));

// Test 1: Array problem with List types
console.log('\n\n1. ARRAY PROBLEM - Two Sum');
console.log('-'.repeat(80));
const twoSum = {
  id: 1,
  title: 'Two Sum',
  question_type: 'array',
  function_name: 'twoSum',
  parameter_schema: {
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'target', type: 'int' }
    ],
    returnType: 'List[int]'
  }
};

console.log('\n--- Java ---');
console.log(generateCodeTemplate(twoSum, 'java'));
console.log('\n--- Python ---');
console.log(generateCodeTemplate(twoSum, 'python'));
console.log('\n--- JavaScript ---');
console.log(generateCodeTemplate(twoSum, 'javascript'));
console.log('\n--- C++ ---');
console.log(generateCodeTemplate(twoSum, 'cpp'));

// Test 2: Linked List problem
console.log('\n\n2. LINKED LIST PROBLEM - Reverse Linked List');
console.log('-'.repeat(80));
const reverseList = {
  id: 2,
  title: 'Reverse Linked List',
  question_type: 'linked_list',
  function_name: 'reverseList',
  parameter_schema: {
    params: [{ name: 'head', type: 'ListNode' }],
    returnType: 'ListNode'
  }
};

console.log('\n--- Java ---');
console.log(generateCodeTemplate(reverseList, 'java'));
console.log('\n--- Python ---');
console.log(generateCodeTemplate(reverseList, 'python'));
console.log('\n--- C++ ---');
console.log(generateCodeTemplate(reverseList, 'cpp'));

// Test 3: Problem with Set and Map types
console.log('\n\n3. PROBLEM WITH SET AND MAP');
console.log('-'.repeat(80));
const setMapProblem = {
  id: 3,
  title: 'Find Unique',
  question_type: 'array',
  function_name: 'findUnique',
  parameter_schema: {
    params: [
      { name: 'nums', type: 'List[int]' },
      { name: 'freq', type: 'Map[int,int]' }
    ],
    returnType: 'Set[int]'
  }
};

console.log('\n--- Java ---');
console.log(generateCodeTemplate(setMapProblem, 'java'));
console.log('\n--- Python ---');
console.log(generateCodeTemplate(setMapProblem, 'python'));
console.log('\n--- C++ ---');
console.log(generateCodeTemplate(setMapProblem, 'cpp'));

// Test 4: Type mapping verification
console.log('\n\n4. TYPE MAPPING VERIFICATION');
console.log('-'.repeat(80));
const testTypes = [
  'int', 'long', 'float', 'string', 
  'List[int]', 'List[str]', 'List[List[int]]',
  'Set[int]', 'Map[str,int]',
  'ListNode', 'TreeNode'
];

testTypes.forEach(type => {
  const mapped = mapCanonicalToLang(type);
  console.log(`\n${type}:`);
  console.log(`  Java: ${mapped.java}, Python: ${mapped.py}, JS: ${mapped.js}, C++: ${mapped.cpp}`);
});

console.log('\n\n' + '='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
console.log('\nVerify that:');
console.log('✅ Java includes "import java.util.*;" when using List/Set/Map');
console.log('✅ Python includes proper typing imports');
console.log('✅ C++ includes necessary headers (<vector>, <unordered_set>, <unordered_map>)');
console.log('✅ Struct definitions have proper documentation comments');
console.log('✅ All type mappings work correctly');
