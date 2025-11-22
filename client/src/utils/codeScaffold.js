/**
 * @file codeScaffold.js
 * @description Centralized code template generation for multiple languages.
 * Supports JavaScript, Python, Java, and C++ with intelligent type inference
 * from test cases and stored parameter schemas.
 */

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
 * Java support class definitions.
 */
export const getJavaSupportDefinition = (questionType) => {
  switch (questionType) {
    case 'linked_list':
      return `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */`;
    case 'binary_tree':
      return `/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode() {}
 *     TreeNode(int val) { this.val = val; }
 *     TreeNode(int val, TreeNode left, TreeNode right) { this.val = val; this.left = left; this.right = right; }
 * }
 */`;
    case 'graph':
      return `/**
 * Definition for a graph node.
 * class GraphNode {
 *     int val;
 *     List<GraphNode> neighbors;
 *     GraphNode() { neighbors = new ArrayList<>(); }
 *     GraphNode(int val) { this.val = val; neighbors = new ArrayList<>(); }
 * }
 */`;
    default:
      return '';
  }
};

/**
 * JavaScript support comments.
 */
export const getJavaScriptSupportComment = (questionType) => {
  switch (questionType) {
    case 'linked_list':
      return `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val === undefined ? 0 : val)
 *     this.next = (next === undefined ? null : next)
 * }
 */`;
    case 'binary_tree':
      return `/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val === undefined ? 0 : val)
 *     this.left = (left === undefined ? null : left)
 *     this.right = (right === undefined ? null : right)
 * }
 */`;
    default:
      return '';
  }
};

/**
 * Python support definitions.
 */
export const getPythonSupportDefinition = (questionType) => {
  switch (questionType) {
    case 'linked_list':
      return `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
`;
    case 'binary_tree':
      return `# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
`;
    default:
      return '';
  }
};

/**
 * C++ support comments.
 */
export const getCppSupportComment = (questionType) => {
  switch (questionType) {
    case 'linked_list':
      return `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */`;
    case 'binary_tree':
      return `/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */`;
    default:
      return '';
  }
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
  const base = type?.trim();
  switch (base) {
    case 'int':
    case 'long':
    case 'double':
    case 'float':
      return 'number';
    case 'int[]':
    case 'long[]':
      return 'number[]';
    case 'boolean':
      return 'boolean';
    case 'char':
    case 'String':
      return 'string';
    case 'String[]':
      return 'string[]';
    case 'List<List<Integer>>':
      return 'number[][]';
    case 'ListNode':
    case 'TreeNode':
      return base;
    case 'void':
      return 'void';
    default:
      return base || 'any';
  }
};

/**
 * Maps canonical types to Python type hints.
 */
export const mapPythonType = (type) => {
  const base = type?.trim();
  switch (base) {
    case 'int':
    case 'long':
      return { hint: 'int' };
    case 'double':
    case 'float':
      return { hint: 'float' };
    case 'boolean':
      return { hint: 'bool' };
    case 'String':
      return { hint: 'str' };
    case 'int[]':
      return { hint: 'List[int]', imports: ['List'] };
    case 'String[]':
      return { hint: 'List[str]', imports: ['List'] };
    case 'List<List<Integer>>':
      return { hint: 'List[List[int]]', imports: ['List'] };
    case 'void':
      return { hint: 'None' };
    default:
      return { hint: 'Any', imports: ['Any'] };
  }
};

/**
 * Maps canonical types to C++ types.
 */
export const mapCppType = (type, { isReturn = false } = {}) => {
  const base = type?.trim();
  switch (base) {
    case 'int':
      return 'int';
    case 'long':
      return 'long long';
    case 'double':
    case 'float':
      return 'double';
    case 'boolean':
      return 'bool';
    case 'String':
      return 'string';
    case 'int[]':
      return isReturn ? 'vector<int>' : 'vector<int>&';
    case 'String[]':
      return isReturn ? 'vector<string>' : 'vector<string>&';
    case 'List<List<Integer>>':
      return isReturn ? 'vector<vector<int>>' : 'vector<vector<int>>&';
    case 'ListNode':
    case 'TreeNode':
      return `${base}*`;
    default:
      return 'int';
  }
};

/**
 * Builds Java template.
 */
export const buildJavaTemplate = (functionName, typeInfo, questionType, parameterSchema) => {
  const fallback = {
    returnType: typeInfo.returnType || 'int',
    paramTypes: typeInfo.paramTypes && typeInfo.paramTypes.length ? typeInfo.paramTypes : ['int']
  };
  const normalized = normalizeParameterSchema(parameterSchema, fallback);
  const paramList = normalized.params
    .map(param => `${param.type} ${param.name}`)
    .join(', ');
  const supportComment = getJavaSupportDefinition(questionType);
  const prefix = supportComment ? `${supportComment}\n\n` : '';
  return `${prefix}class Solution {
    public ${normalized.returnType} ${functionName}(${paramList}) {
        // Write your solution here
        
    }
}`;
};

/**
 * Builds JavaScript template.
 */
export const buildJavascriptTemplate = (functionName, context) => {
  const support = getJavaScriptSupportComment(context.questionType);
  const jsDocParams = context.jsDocs
    .filter(doc => doc.name)
    .map(doc => ` * @param {${doc.type}} ${doc.name}`)
    .join('\n');
  const jsDocReturn = ` * @return {${context.jsReturnType || 'any'}}`;
  const paramsList = context.normalized.params.map(param => param.name).join(', ');
  const docBlock = jsDocParams ? `/**\n${jsDocParams}\n${jsDocReturn}\n */` : `/**\n${jsDocReturn}\n */`;
  const supportBlock = support ? `${support}\n\n` : '';
  return `${supportBlock}${docBlock}
var ${functionName} = function(${paramsList}) {
    // Write your solution here
    
};`;
};

/**
 * Builds Python template.
 */
export const buildPythonTemplate = (functionName, context) => {
  const supportDefinition = getPythonSupportDefinition(context.questionType);
  const importLine = context.pythonImports.length
    ? `from typing import ${context.pythonImports.join(', ')}\n\n`
    : '';
  const params = context.pythonParams
    .map(param => `${param.name}: ${param.hint || 'Any'}`)
    .join(', ');
  const args = params ? `, ${params}` : '';
  const returnHint = context.pythonReturnHint ? ` -> ${context.pythonReturnHint}` : '';
  const supportBlock = supportDefinition ? `${supportDefinition}\n\n` : '';
  return `${supportBlock}${importLine}class Solution:
    def ${functionName}(self${args})${returnHint}:
        # Write your solution here
        pass`;
};

/**
 * Builds C++ template.
 */
export const buildCppTemplate = (functionName, context) => {
  const support = getCppSupportComment(context.questionType);
  const params = context.normalized.params
    .map((param, idx) => {
      const type = context.cppParamTypes[idx] || 'auto';
      return `${type} ${param.name}`;
    })
    .join(', ');
  const supportBlock = support ? `${support}\n` : '';
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

  const normalizedParams = normalizeParameterSchema(parameterSchema, {
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

  const javaTypeInfo = javaTypesFromTests;

  switch (language) {
    case 'python':
      return buildPythonTemplate(functionName, templateContext);
    case 'java':
      return buildJavaTemplate(functionName, javaTypeInfo, problem?.question_type, parameterSchema);
    case 'cpp':
      return buildCppTemplate(functionName, templateContext);
    case 'javascript':
    default:
      return buildJavascriptTemplate(functionName, templateContext);
  }
};
