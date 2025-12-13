/**
 * Generates language-specific scaffolding from a canonical parameter schema.
 * Produces LeetCode-style function/class signatures without solution logic.
 */

const headerByType = {
  array: 'Array / Two Pointer / Sliding Window',
  string: 'String',
  linked_list: 'Linked List',
  binary_tree: 'Binary Tree / BST',
  graph: 'Graph (Adjacency List)',
  dynamic_programming: 'Dynamic Programming / Recursion',
  heap: 'Heap / Priority Queue'
};

function mapCanonicalToLang(type) {
  const t = String(type || '').toLowerCase().trim();
  
  // Void/None returns
  if (t === 'void' || t === 'none' || t === '') return { java: 'void', py: 'None', js: 'void', cpp: 'void', ts: 'void' };
  
  // Primitives
  if (t === 'int' || t === 'integer') return { java: 'int', py: 'int', js: 'number', cpp: 'int', ts: 'number' };
  if (t === 'long') return { java: 'long', py: 'int', js: 'number', cpp: 'long long', ts: 'number' };
  if (t === 'float') return { java: 'float', py: 'float', js: 'number', cpp: 'float', ts: 'number' };
  if (t === 'double' || t === 'number') return { java: 'double', py: 'float', js: 'number', cpp: 'double', ts: 'number' };
  if (t === 'bool' || t === 'boolean') return { java: 'boolean', py: 'bool', js: 'boolean', cpp: 'bool', ts: 'boolean' };
  if (t === 'char' || t === 'character') return { java: 'char', py: 'str', js: 'string', cpp: 'char', ts: 'string' };
  if (t === 'str' || t === 'string') return { java: 'String', py: 'str', js: 'string', cpp: 'string', ts: 'string' };

  // 1D Arrays
  if (t === 'list[int]' || t === 'array[int]') return { java: 'int[]', py: 'List[int]', js: 'number[]', cpp: 'vector<int>', ts: 'number[]' };
  if (t === 'list[long]') return { java: 'long[]', py: 'List[int]', js: 'number[]', cpp: 'vector<long long>', ts: 'number[]' };
  if (t === 'list[float]') return { java: 'float[]', py: 'List[float]', js: 'number[]', cpp: 'vector<float>', ts: 'number[]' };
  if (t === 'list[double]') return { java: 'double[]', py: 'List[float]', js: 'number[]', cpp: 'vector<double>', ts: 'number[]' };
  if (t === 'list[bool]' || t === 'list[boolean]') return { java: 'boolean[]', py: 'List[bool]', js: 'boolean[]', cpp: 'vector<bool>', ts: 'boolean[]' };
  if (t === 'list[char]') return { java: 'char[]', py: 'List[str]', js: 'string[]', cpp: 'vector<char>', ts: 'string[]' };
  if (t === 'list[str]' || t === 'list[string]') return { java: 'String[]', py: 'List[str]', js: 'string[]', cpp: 'vector<string>', ts: 'string[]' };

  // 2D Arrays
  if (t === 'list[list[int]]' || t === 'array[array[int]]') return { java: 'int[][]', py: 'List[List[int]]', js: 'number[][]', cpp: 'vector<vector<int>>', ts: 'number[][]' };
  if (t === 'list[list[str]]' || t === 'list[list[string]]') return { java: 'String[][]', py: 'List[List[str]]', js: 'string[][]', cpp: 'vector<vector<string>>', ts: 'string[][]' };
  if (t === 'list[list[char]]') return { java: 'char[][]', py: 'List[List[str]]', js: 'string[][]', cpp: 'vector<vector<char>>', ts: 'string[][]' };

  // Collections (Sets, Maps)
  if (t === 'set[int]') return { java: 'Set<Integer>', py: 'Set[int]', js: 'Set<number>', cpp: 'unordered_set<int>', ts: 'Set<number>' };
  if (t === 'set[str]' || t === 'set[string]') return { java: 'Set<String>', py: 'Set[str]', js: 'Set<string>', cpp: 'unordered_set<string>', ts: 'Set<string>' };
  if (t === 'map[str,int]' || t === 'dict[str,int]') return { java: 'Map<String, Integer>', py: 'Dict[str, int]', js: 'Map<string, number>', cpp: 'unordered_map<string, int>', ts: 'Map<string, number>' };
  if (t === 'map[int,int]' || t === 'dict[int,int]') return { java: 'Map<Integer, Integer>', py: 'Dict[int, int]', js: 'Map<number, number>', cpp: 'unordered_map<int, int>', ts: 'Map<number, number>' };

  // Linked list / Tree
  if (t.includes('listnode')) return { java: 'ListNode', py: 'ListNode', js: 'ListNode', cpp: 'ListNode*', ts: 'ListNode | null' };
  if (t.includes('treenode')) return { java: 'TreeNode', py: 'TreeNode', js: 'TreeNode', cpp: 'TreeNode*', ts: 'TreeNode | null' };

  // Graph adjacency list
  if (t === 'list[list[integer]]') return { java: 'List<List<Integer>>', py: 'List[List[int]]', js: 'number[][]', cpp: 'vector<vector<int>>', ts: 'number[][]' };

  // Fallback
  return { java: 'Object', py: 'object', js: 'any', cpp: 'auto', ts: 'any' };
}

function injectStructsIfNeeded(params, returnType, language, problemType) {
  const needsListNode = [...params, returnType].some(t => String(t).toLowerCase().includes('listnode'));
  const needsTreeNode = [...params, returnType].some(t => String(t).toLowerCase().includes('treenode'));
  if (language === 'java') {
    const pieces = [];
    if (needsListNode) {
      pieces.push('/**\n * Definition for singly-linked list.\n */\nclass ListNode {\n    int val;\n    ListNode next;\n    ListNode() {}\n    ListNode(int val) { this.val = val; }\n    ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n}');
    }
    if (needsTreeNode) {
      pieces.push('/**\n * Definition for a binary tree node.\n */\nclass TreeNode {\n    int val;\n    TreeNode left;\n    TreeNode right;\n    TreeNode() {}\n    TreeNode(int val) { this.val = val; }\n    TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }\n}');
    }
    return pieces.join('\n\n');
  }
  if (language === 'python') {
    const pieces = [];
    // Determine necessary typing imports based on parameter types
    const allTypes = [...params, returnType].map(t => String(t).toLowerCase());
    const hasListTypes = allTypes.some(t => t.includes('list['));
    const hasSetTypes = allTypes.some(t => t.includes('set['));
    const hasDictTypes = allTypes.some(t => t.includes('dict[') || t.includes('map['));
    const imports = [];
    if (hasListTypes) imports.push('List');
    if (hasSetTypes) imports.push('Set');
    if (hasDictTypes) imports.push('Dict');
    if (needsListNode || needsTreeNode) imports.push('Optional');
    if (imports.length > 0) {
      pieces.push(`from typing import ${imports.join(', ')}`);
    }
    if (needsListNode) {
      pieces.push('# Definition for singly-linked list.\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next');
    }
    if (needsTreeNode) {
      pieces.push('# Definition for a binary tree node.\nclass TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right');
    }
    return pieces.join('\n\n');
  }
  if (language === 'javascript') {
    const pieces = [];
    if (needsListNode) {
      pieces.push('/**\n * Definition for singly-linked list.\n * @param {number} val\n * @param {ListNode} next\n */\nfunction ListNode(val, next) {\n    this.val = (val===undefined ? 0 : val);\n    this.next = (next===undefined ? null : next);\n}');
    }
    if (needsTreeNode) {
      pieces.push('/**\n * Definition for a binary tree node.\n * @param {number} val\n * @param {TreeNode} left\n * @param {TreeNode} right\n */\nfunction TreeNode(val, left, right) {\n    this.val = (val===undefined ? 0 : val);\n    this.left = (left===undefined ? null : left);\n    this.right = (right===undefined ? null : right);\n}');
    }
    return pieces.join('\n\n');
  }
  if (language === 'cpp') {
    const pieces = [];
    // Determine necessary includes based on parameter types
    const allTypes = [...params, returnType].map(t => String(t).toLowerCase());
    const needsVector = allTypes.some(t => t.includes('vector') || t.includes('list['));
    const needsString = allTypes.some(t => t.includes('string'));
    const needsUnorderedSet = allTypes.some(t => t.includes('unordered_set') || t.includes('set['));
    const needsUnorderedMap = allTypes.some(t => t.includes('unordered_map') || t.includes('map[') || t.includes('dict['));
    const includes = [];
    if (needsVector) includes.push('#include <vector>');
    if (needsString) includes.push('#include <string>');
    if (needsUnorderedSet) includes.push('#include <unordered_set>');
    if (needsUnorderedMap) includes.push('#include <unordered_map>');
    if (includes.length > 0) {
      pieces.push(includes.join('\n') + '\nusing namespace std;');
    }
    if (needsListNode) {
      pieces.push('/**\n * Definition for singly-linked list.\n */\nstruct ListNode {\n    int val;\n    ListNode *next;\n    ListNode(int x) : val(x), next(nullptr) {}\n};');
    }
    if (needsTreeNode) {
      pieces.push('/**\n * Definition for a binary tree node.\n */\nstruct TreeNode {\n    int val;\n    TreeNode *left;\n    TreeNode *right;\n    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n};');
    }
    return pieces.join('\n\n');
  }
  if (language === 'typescript' || language === 'ts') {
    const pieces = [];
    if (needsListNode) {
      pieces.push('/**\n * Definition for singly-linked list.\n */\nclass ListNode {\n    val: number;\n    next: ListNode | null;\n    constructor(val?: number, next?: ListNode | null) {\n        this.val = (val===undefined ? 0 : val);\n        this.next = (next===undefined ? null : next);\n    }\n}');
    }
    if (needsTreeNode) {
      pieces.push('/**\n * Definition for a binary tree node.\n */\nclass TreeNode {\n    val: number;\n    left: TreeNode | null;\n    right: TreeNode | null;\n    constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {\n        this.val = (val===undefined ? 0 : val);\n        this.left = (left===undefined ? null : left);\n        this.right = (right===undefined ? null : right);\n    }\n}');
    }
    return pieces.join('\n\n');
  }
  return '';
}

function buildSignature(problem, language) {
  // Normalize language key to match mapCanonicalToLang output keys
  const langKey = language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'c++' ? 'cpp' : language;
  const params = (problem?.parameter_schema?.params || []).map(p => ({ name: p.name, type: mapCanonicalToLang(p.type)[langKey] }));
  const returnType = mapCanonicalToLang(problem?.parameter_schema?.returnType || 'void')[langKey];
  const fn = (problem?.function_name || problem?.title || 'solve').trim();
  const header = headerByType[problem?.question_type] || 'Problem';

  if (language === 'java') {
    const structs = injectStructsIfNeeded(problem?.parameter_schema?.params?.map(p => p.type) || [], problem?.parameter_schema?.returnType || '', 'java', problem?.question_type);
    const paramStr = params.map(p => `${p.type} ${p.name}`).join(', ');
    // Add imports for Java collections if needed
    const allTypes = [...params.map(p => p.type), returnType].join(' ');
    const needsCollections = allTypes.includes('List<') || allTypes.includes('Set<') || allTypes.includes('Map<');
    const imports = needsCollections ? 'import java.util.*;\\n\\n' : '';
    return `// ${header}\\n${imports}${structs ? structs + '\\n\\n' : ''}class Solution {\\n    public ${returnType} ${fn}(${paramStr}) {\\n        \\n    }\\n}`;
  }
  if (language === 'python' || language === 'py') {
    const structs = injectStructsIfNeeded(problem?.parameter_schema?.params?.map(p => p.type) || [], problem?.parameter_schema?.returnType || '', 'python', problem?.question_type);
    const paramStr = params.map(p => `${p.name}: ${p.type}`).join(', ');
    return `# ${header}\n${structs ? structs + '\n\n' : ''}class Solution:\n    def ${fn}(self, ${paramStr}) -> ${returnType}:\n        pass`;
  }
  if (language === 'javascript' || language === 'js') {
    const structs = injectStructsIfNeeded(problem?.parameter_schema?.params?.map(p => p.type) || [], problem?.parameter_schema?.returnType || '', 'javascript', problem?.question_type);
    const paramStr = params.map(p => p.name).join(', ');
    return `// ${header}\n${structs ? structs + '\n\n' : ''}var ${fn} = function(${paramStr}) {\n    \n};`;
  }
  if (language === 'cpp' || language === 'c++') {
    const structs = injectStructsIfNeeded(problem?.parameter_schema?.params?.map(p => p.type) || [], problem?.parameter_schema?.returnType || '', 'cpp', problem?.question_type);
    const paramStr = params.map(p => `${p.type} ${p.name}`).join(', ');
    return `// ${header}\n${structs ? structs + '\n\n' : ''}class Solution {\npublic:\n    ${returnType} ${fn}(${paramStr}) {\n        \n    }\n};`;
  }
  if (language === 'typescript' || language === 'ts') {
    const structs = injectStructsIfNeeded(problem?.parameter_schema?.params?.map(p => p.type) || [], problem?.parameter_schema?.returnType || '', 'typescript', problem?.question_type);
    const paramStr = params.map(p => `${p.name}: ${p.type}`).join(', ');
    const returnTypeAnnotation = returnType !== 'void' ? `: ${returnType}` : '';
    return `// ${header}\n${structs ? structs + '\n\n' : ''}function ${fn}(${paramStr})${returnTypeAnnotation} {\n    \n}`;
  }
  return '';
}

function generateScaffolds(problem, languages = ['java','python','javascript','cpp','typescript']) {
  const outputs = {};
  for (const lang of languages) {
    const scaffold = buildSignature(problem, lang);
    if (scaffold) {
      outputs[lang] = scaffold;
    }
  }
  return outputs;
}

module.exports = { generateScaffolds, mapCanonicalToLang, injectStructsIfNeeded };
