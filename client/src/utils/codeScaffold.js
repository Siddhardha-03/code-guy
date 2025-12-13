/**
 * @file codeScaffold.js
 * @description Enhanced code template generation using canonical type system.
 * Supports JavaScript, TypeScript, Python, Java, C++, and more with intelligent
 * struct injection, proper imports/includes, and LeetCode-style documentation.
 * 
 * Aligned with server/utils/scaffoldGenerator.js for consistency.
 */

/**
 * Maps canonical types to language-specific types.
 * This is the single source of truth for type mappings across all languages.
 */
export const mapCanonicalToLang = (type) => {
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
  if (t === 'list[int]' || t === 'array[int]' || t === 'int[]') return { java: 'int[]', py: 'List[int]', js: 'number[]', cpp: 'vector<int>', ts: 'number[]' };
  if (t === 'list[long]') return { java: 'long[]', py: 'List[int]', js: 'number[]', cpp: 'vector<long long>', ts: 'number[]' };
  if (t === 'list[float]') return { java: 'float[]', py: 'List[float]', js: 'number[]', cpp: 'vector<float>', ts: 'number[]' };
  if (t === 'list[double]') return { java: 'double[]', py: 'List[float]', js: 'number[]', cpp: 'vector<double>', ts: 'number[]' };
  if (t === 'list[bool]' || t === 'list[boolean]') return { java: 'boolean[]', py: 'List[bool]', js: 'boolean[]', cpp: 'vector<bool>', ts: 'boolean[]' };
  if (t === 'list[char]') return { java: 'char[]', py: 'List[str]', js: 'string[]', cpp: 'vector<char>', ts: 'string[]' };
  if (t === 'list[str]' || t === 'list[string]' || t === 'string[]') return { java: 'String[]', py: 'List[str]', js: 'string[]', cpp: 'vector<string>', ts: 'string[]' };

  // 2D Arrays
  if (t === 'list[list[int]]' || t === 'array[array[int]]' || t === 'int[][]') return { java: 'int[][]', py: 'List[List[int]]', js: 'number[][]', cpp: 'vector<vector<int>>', ts: 'number[][]' };
  if (t === 'list[list[str]]' || t === 'list[list[string]]') return { java: 'String[][]', py: 'List[List[str]]', js: 'string[][]', cpp: 'vector<vector<string>>', ts: 'string[][]' };
  if (t === 'list[list[char]]') return { java: 'char[][]', py: 'List[List[str]]', js: 'string[][]', cpp: 'vector<vector<char>>', ts: 'string[][]' };

  // Collections
  if (t === 'set[int]') return { java: 'Set<Integer>', py: 'Set[int]', js: 'Set<number>', cpp: 'unordered_set<int>', ts: 'Set<number>' };
  if (t === 'set[str]' || t === 'set[string]') return { java: 'Set<String>', py: 'Set[str]', js: 'Set<string>', cpp: 'unordered_set<string>', ts: 'Set<string>' };
  if (t === 'map[str,int]' || t === 'dict[str,int]') return { java: 'Map<String, Integer>', py: 'Dict[str, int]', js: 'Map<string, number>', cpp: 'unordered_map<string, int>', ts: 'Map<string, number>' };
  if (t === 'map[int,int]' || t === 'dict[int,int]') return { java: 'Map<Integer, Integer>', py: 'Dict[int, int]', js: 'Map<number, number>', cpp: 'unordered_map<int, int>', ts: 'Map<number, number>' };

  // Linked list / Tree
  if (t.includes('listnode')) return { java: 'ListNode', py: 'ListNode', js: 'ListNode', cpp: 'ListNode*', ts: 'ListNode | null' };
  if (t.includes('treenode')) return { java: 'TreeNode', py: 'TreeNode', js: 'TreeNode', cpp: 'TreeNode*', ts: 'TreeNode | null' };

  // Graph adjacency list
  if (t === 'list[list[integer]]') return { java: 'List<List<Integer>>', py: 'List[List[int]]', js: 'number[][]', cpp: 'vector<vector<int>>', ts: 'number[][]' };

  // Fallback - try to extract from List<...>
  if (t.startsWith('list<list<integer>>')) return { java: 'List<List<Integer>>', py: 'List[List[int]]', js: 'number[][]', cpp: 'vector<vector<int>>', ts: 'number[][]' };
  
  // Final fallback
  return { java: 'Object', py: 'object', js: 'any', cpp: 'auto', ts: 'any' };
};

/**
 * Deduces Java data type from a sample value.
 */
export const deduceJavaType = (value) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return 'int[]';
    const innerType = deduceJavaType(value[0]);
    return `${innerType}[]`;
  }
  if (value === null || value === undefined) return 'Object';
  const type = typeof value;
  if (type === 'number') {
    if (Number.isInteger(value)) {
      if (value >= -2147483648 && value <= 2147483647) return 'int';
      return 'long';
    }
    return 'double';
  }
  if (type === 'string') return 'String';
  if (type === 'boolean') return 'boolean';
  return 'Object';
};

/**
 * Safely parses raw string literal into JavaScript value.
 */
export const parseRawValue = (raw) => {
  if (raw === undefined || raw === null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric)) return numeric;
  try {
    return JSON.parse(trimmed);
  } catch (err) {
    return trimmed;
  }
};

/**
 * Parses multiline test case inputs into array of values.
 */
export const parseTestCaseInputs = (input = '') => {
  if (!input) return [];
  const normalized = input.replace(/\r/g, '').trim();
  if (!normalized) return [];
  return normalized
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(parseRawValue);
};

/**
 * Infers Java type info from test cases.
 */
export const getJavaTypeFromTestCases = (testCases = [], fallback) => {
  if (!Array.isArray(testCases) || testCases.length === 0) return fallback;
  const firstCase = testCases[0];
  const parsedParams = parseTestCaseInputs(firstCase?.input || '');
  const parsedOutput = parseRawValue(firstCase?.expected_output);
  const paramTypes = parsedParams.map(deduceJavaType);
  const returnType = parsedOutput !== undefined ? deduceJavaType(parsedOutput) : fallback.returnType;
  return {
    returnType: returnType || fallback.returnType,
    paramTypes: paramTypes.length ? paramTypes : fallback.paramTypes
  };
};

/**
 * Returns fallback type mappings by problem category.
 */
export const getJavaFallbackTypes = (questionType) => {
  switch (questionType) {
    case 'string':
      return { returnType: 'String', paramTypes: ['String'] };
    case 'array':
      return { returnType: 'int[]', paramTypes: ['int[]'] };
    case 'primitives':
      return { returnType: 'int', paramTypes: ['int'] };
    case 'math':
      return { returnType: 'int', paramTypes: ['int'] };
    case 'matrix':
      return { returnType: 'int[][]', paramTypes: ['int[][]'] };
    case 'linked_list':
      return { returnType: 'ListNode', paramTypes: ['ListNode'] };
    case 'binary_tree':
      return { returnType: 'TreeNode', paramTypes: ['TreeNode'] };
    case 'graph':
      return { returnType: 'List<List<Integer>>', paramTypes: ['List<List<Integer>>'] };
    case 'custom_class':
      return { returnType: 'Object', paramTypes: ['Object'] };
    default:
      return { returnType: 'int', paramTypes: ['int'] };
  }
};

/**
 * Converts title to camelCase function name.
 */
export const sanitizeFunctionName = (title) => {
  if (typeof title !== 'string' || !title.trim()) return 'solution';
  const words = title
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean);
  if (words.length === 0) return 'solution';
  const camel = words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
  return camel || 'solution';
};

/**
 * Java support class definitions with LeetCode-style comments.
 */
export const getJavaSupportDefinition = (questionType, params = [], returnType = '') => {
  const needsListNode = [...params, returnType].some(t => String(t).toLowerCase().includes('listnode'));
  const needsTreeNode = [...params, returnType].some(t => String(t).toLowerCase().includes('treenode'));
  
  const pieces = [];
  
  if (needsListNode) {
    pieces.push(`/**
 * Definition for singly-linked list.
 */
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}`);
  }
  
  if (needsTreeNode) {
    pieces.push(`/**
 * Definition for a binary tree node.
 */
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
}`);
  }
  
  return pieces.join('\n\n');
};

/**
 * JavaScript support with JSDoc comments.
 */
export const getJavaScriptSupportComment = (params = [], returnType = '') => {
  const needsListNode = [...params, returnType].some(t => String(t).toLowerCase().includes('listnode'));
  const needsTreeNode = [...params, returnType].some(t => String(t).toLowerCase().includes('treenode'));
  
  const pieces = [];
  
  if (needsListNode) {
    pieces.push(`/**
 * Definition for singly-linked list.
 * @param {number} val
 * @param {ListNode} next
 */
function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val);
    this.next = (next===undefined ? null : next);
}`);
  }
  
  if (needsTreeNode) {
    pieces.push(`/**
 * Definition for a binary tree node.
 * @param {number} val
 * @param {TreeNode} left
 * @param {TreeNode} right
 */
function TreeNode(val, left, right) {
    this.val = (val===undefined ? 0 : val);
    this.left = (left===undefined ? null : left);
    this.right = (right===undefined ? null : right);
}`);
  }
  
  return pieces.join('\n\n');
};

/**
 * Python support definitions with proper type hints.
 */
export const getPythonSupportDefinition = (params = [], returnType = '') => {
  const needsListNode = [...params, returnType].some(t => String(t).toLowerCase().includes('listnode'));
  const needsTreeNode = [...params, returnType].some(t => String(t).toLowerCase().includes('treenode'));
  
  const pieces = [];
  
  if (needsListNode) {
    pieces.push(`# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next`);
  }
  
  if (needsTreeNode) {
    pieces.push(`# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right`);
  }
  
  return pieces.join('\n\n');
};

/**
 * C++ support with proper includes and struct definitions.
 */
export const getCppSupportComment = (params = [], returnType = '') => {
  const allTypes = [...params, returnType].map(t => String(t).toLowerCase());
  const needsVector = allTypes.some(t => t.includes('vector') || t.includes('list[') || t.includes('[]'));
  const needsString = allTypes.some(t => t.includes('string'));
  const needsUnorderedSet = allTypes.some(t => t.includes('unordered_set') || t.includes('set['));
  const needsUnorderedMap = allTypes.some(t => t.includes('unordered_map') || t.includes('map[') || t.includes('dict['));
  const needsListNode = allTypes.some(t => t.includes('listnode'));
  const needsTreeNode = allTypes.some(t => t.includes('treenode'));
  
  const pieces = [];
  
  // Add includes
  const includes = [];
  if (needsVector) includes.push('#include <vector>');
  if (needsString) includes.push('#include <string>');
  if (needsUnorderedSet) includes.push('#include <unordered_set>');
  if (needsUnorderedMap) includes.push('#include <unordered_map>');
  
  if (includes.length > 0) {
    pieces.push(includes.join('\n') + '\nusing namespace std;');
  }
  
  // Add struct definitions
  if (needsListNode) {
    pieces.push(`/**
 * Definition for singly-linked list.
 */
struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};`);
  }
  
  if (needsTreeNode) {
    pieces.push(`/**
 * Definition for a binary tree node.
 */
struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};`);
  }
  
  return pieces.join('\n\n');
};

/**
 * Normalizes parameter schema with fallback types.
 */
export const normalizeParameterSchema = (schema, fallbackTypes) => {
  if (!schema) {
    return {
      params: fallbackTypes.paramTypes.map((type, idx) => ({
        name: idx === 0 ? 'param' : `param${idx + 1}`,
        type
      })),
      returnType: fallbackTypes.returnType
    };
  }

  const params = Array.isArray(schema.params) && schema.params.length
    ? schema.params.map((param, idx) => ({
        name: param?.name?.trim() || (idx === 0 ? 'param' : `param${idx + 1}`),
        type: param?.type?.trim() || fallbackTypes.paramTypes[idx] || 'int'
      }))
    : fallbackTypes.paramTypes.map((type, idx) => ({
        name: idx === 0 ? 'param' : `param${idx + 1}`,
        type
      }));

  const returnType = schema.returnType?.trim() || fallbackTypes.returnType || 'int';

  return { params, returnType };
};

/**
 * Maps canonical types to JavaScript JSDoc types.
 */
export const mapJsType = (type) => {
  const mapped = mapCanonicalToLang(type);
  return mapped.js || 'any';
};

/**
 * Maps canonical types to Python type hints.
 */
export const mapPythonType = (type) => {
  const mapped = mapCanonicalToLang(type);
  const hint = mapped.py || 'Any';
  const imports = [];
  if (hint.includes('List[')) imports.push('List');
  if (hint.includes('Set[')) imports.push('Set');
  if (hint.includes('Dict[')) imports.push('Dict');
  if (hint.includes('Optional[') || type?.toLowerCase().includes('listnode') || type?.toLowerCase().includes('treenode')) imports.push('Optional');
  return { hint, imports };
};

/**
 * Maps canonical types to C++ types.
 */
export const mapCppType = (type, { isReturn = false } = {}) => {
  const mapped = mapCanonicalToLang(type);
  let cppType = mapped.cpp || 'int';
  // Add reference for non-return parameters with vectors
  if (!isReturn && cppType.includes('vector<') && !cppType.includes('*')) {
    cppType += '&';
  }
  return cppType;
};

/**
 * Builds Java template with intelligent imports and struct injection.
 */
export const buildJavaTemplate = (functionName, normalized, questionType) => {
  const paramList = normalized.params
    .map(param => `${param.type} ${param.name}`)
    .join(', ');
  
  // Check if we need java.util imports
  const allTypes = [...normalized.params.map(p => p.type), normalized.returnType].join(' ');
  const needsCollections = allTypes.includes('List<') || allTypes.includes('Set<') || allTypes.includes('Map<');
  const imports = needsCollections ? 'import java.util.*;\n\n' : '';
  
  // Get struct definitions
  const structs = getJavaSupportDefinition(questionType, normalized.params.map(p => p.type), normalized.returnType);
  const prefix = structs ? `${structs}\n\n` : '';
  
  return `${imports}${prefix}class Solution {
    public ${normalized.returnType} ${functionName}(${paramList}) {
        // Write your solution here
        
    }
}`;
};

/**
 * Builds JavaScript template.
 */
export const buildJavascriptTemplate = (functionName, context) => {
  const structs = getJavaScriptSupportComment(context.normalized.params.map(p => p.type), context.normalized.returnType);
  const jsDocParams = context.jsDocs
    .filter(doc => doc.name)
    .map(doc => ` * @param {${doc.type}} ${doc.name}`)
    .join('\n');
  const jsDocReturn = ` * @return {${context.jsReturnType || 'any'}}`;
  const paramsList = context.normalized.params.map(param => param.name).join(', ');
  const docBlock = jsDocParams ? `/**\n${jsDocParams}\n${jsDocReturn}\n */` : `/**\n${jsDocReturn}\n */`;
  const supportBlock = structs ? `${structs}\n\n` : '';
  return `${supportBlock}${docBlock}
var ${functionName} = function(${paramsList}) {
    // Write your solution here
    
};`;
};

/**
 * Builds Python template.
 */
export const buildPythonTemplate = (functionName, context) => {
  const structs = getPythonSupportDefinition(context.normalized.params.map(p => p.type), context.normalized.returnType);
  const importLine = context.pythonImports.length
    ? `from typing import ${context.pythonImports.join(', ')}\n\n`
    : '';
  const params = context.pythonParams
    .map(param => `${param.name}: ${param.hint || 'Any'}`)
    .join(', ');
  const args = params ? `, ${params}` : '';
  const returnHint = context.pythonReturnHint ? ` -> ${context.pythonReturnHint}` : '';
  const supportBlock = structs ? `${structs}\n\n` : '';
  return `${supportBlock}${importLine}class Solution:
    def ${functionName}(self${args})${returnHint}:
        # Write your solution here
        pass`;
};

/**
 * Builds C++ template.
 */
export const buildCppTemplate = (functionName, context) => {
  const structs = getCppSupportComment(context.normalized.params.map(p => p.type), context.normalized.returnType);
  const params = context.normalized.params
    .map((param, idx) => {
      const type = context.cppParamTypes[idx] || 'auto';
      return `${type} ${param.name}`;
    })
    .join(', ');
  const supportBlock = structs ? `${structs}\n\n` : '';
  return `${supportBlock}class Solution {
public:
    ${context.cppReturnType} ${functionName}(${params}) {
        // Write your solution here
        
    }
};
`;
};

/**
 * Main function to generate code templates.
 * Integrates all utilities into a single call.
 */
export const generateCodeTemplate = (problem, language, testCases = []) => {
  const problemTitle = problem?.title || 'Solution';
  const storedFunctionName = typeof problem?.function_name === 'string' ? problem.function_name.trim() : '';
  const functionName = storedFunctionName || sanitizeFunctionName(problemTitle);
  const langKey = language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'c++' ? 'cpp' : language;
  
  const javaFallbackTypes = getJavaFallbackTypes(problem?.question_type);
  const javaTypesFromTests = getJavaTypeFromTestCases(testCases, javaFallbackTypes);

  let parameterSchema = problem?.parameter_schema;
  if (typeof parameterSchema === 'string') {
    try {
      parameterSchema = JSON.parse(parameterSchema);
    } catch (err) {
      parameterSchema = null;
    }
  }

  // Normalize schema types to language-specific types using the canonical mapper
  const mapSchemaTypes = (schema, langKey) => {
    if (!schema) return null;
    const params = Array.isArray(schema.params)
      ? schema.params.map(p => ({
          ...p,
          type: mapCanonicalToLang(p.type || '')[langKey] || p.type || 'Object'
        }))
      : [];
    const returnType = mapCanonicalToLang(schema.returnType || 'void')[langKey] || 'void';
    return { params, returnType };
  };

  const parameterSchemaForJava = mapSchemaTypes(parameterSchema, 'java');

  const normalizedParams = normalizeParameterSchema(parameterSchemaForJava || parameterSchema, {
    returnType: javaTypesFromTests.returnType,
    paramTypes: javaTypesFromTests.paramTypes
  });

  const jsDocEntries = normalizedParams.params.map(param => ({
    name: param.name,
    type: mapJsType(param.type)
  }));
  const jsReturnType = mapJsType(normalizedParams.returnType);

  const pythonImportsSet = new Set();
  const pythonParams = normalizedParams.params.map(param => {
    const info = mapPythonType(param.type);
    if (info.imports) {
      info.imports.forEach(imp => pythonImportsSet.add(imp));
    }
    return {
      name: param.name,
      hint: info.hint
    };
  });
  const pythonReturnInfo = mapPythonType(normalizedParams.returnType);
  if (pythonReturnInfo.imports) {
    pythonReturnInfo.imports.forEach(imp => pythonImportsSet.add(imp));
  }
  const pythonReturnHint = pythonReturnInfo.hint;
  const pythonImports = Array.from(pythonImportsSet).sort();

  const cppParamTypes = normalizedParams.params.map(param => mapCppType(param.type) || 'auto');
  const cppReturnType = mapCppType(normalizedParams.returnType, { isReturn: true }) || 'int';

  const templateContext = {
    questionType: problem?.question_type,
    normalized: normalizedParams,
    jsDocs: jsDocEntries,
    jsReturnType,
    pythonParams,
    pythonReturnHint,
    pythonImports,
    cppParamTypes,
    cppReturnType
  };

  switch (language) {
    case 'python':
    case 'py':
      return buildPythonTemplate(functionName, templateContext);
    case 'java':
      return buildJavaTemplate(functionName, normalizedParams, problem?.question_type);
    case 'cpp':
    case 'c++':
      return buildCppTemplate(functionName, templateContext);
    case 'typescript':
    case 'ts': {
      // Reuse JS template but keep type annotations for TypeScript
      const tsContext = { ...templateContext, jsReturnType: mapCanonicalToLang(normalizedParams.returnType).ts || 'any', normalized: {
        ...templateContext.normalized,
        params: templateContext.normalized.params.map(p => ({ ...p, type: mapCanonicalToLang(p.type).ts || 'any' }))
      }};
      return buildJavascriptTemplate(functionName, tsContext);
    }
    case 'javascript':
    case 'js':
    default:
      return buildJavascriptTemplate(functionName, templateContext);
  }
};
