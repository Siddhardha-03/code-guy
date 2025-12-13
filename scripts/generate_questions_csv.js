const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '..', 'client', 'public', 'questions_data.txt');
const OUTPUT_PATH = path.join(__dirname, '..', 'client', 'public', 'questions_bulk_template.csv');

const toCamel = (title) => {
  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return '';
  const camel = words
    .map((w, idx) => {
      const lower = w.toLowerCase();
      if (idx === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
  return /^[a-zA-Z]/.test(camel) ? camel : `q${camel}`;
};

const clean = (text = '') => text.replace(/\s+/g, ' ').trim();

const mapQuestionType = (title, tagsRaw) => {
  const t = (tagsRaw || '').toLowerCase();
  const ttl = (title || '').toLowerCase();
  const has = (kw) => t.includes(kw) || ttl.includes(kw);

  if (has('array')) return 'array';
  if (has('string')) return 'string';
  if (has('matrix')) return 'matrix';
  if (has('math')) return 'math';
  if (has('linked list') || has('linked_list') || has('listnode')) return 'linked_list';
  if (has('binary tree') || has('tree') || has('treenode')) return 'binary_tree';
  if (has('graph')) return 'graph';
  if (has('trie')) return 'trie';
  if (has('heap') || has('priority queue')) return 'heap';
  if (has('stack')) return 'stack';
  if (has('backtracking')) return 'backtracking';
  if (has('greedy')) return 'greedy';
  if (has('bit manipulation')) return 'bit_manipulation';
  if (has('binary search')) return 'binary_search';
  if (has('interval')) return 'intervals';
  if (has('geometry')) return 'geometry';
  if (has('dynamic programming') || has('dp')) return 'dynamic_programming';
  if (has('design')) return 'custom_class';
  if (has('two pointers') || has('sliding window')) return 'array';
  // Fallback
  return 'array';
};

const extractBetween = (src, start, end) => {
  const startIdx = src.indexOf(start);
  if (startIdx === -1) return '';
  const slice = src.slice(startIdx + start.length);
  const endIdx = slice.indexOf(end);
  if (endIdx === -1) return slice.trim();
  return slice.slice(0, endIdx).trim();
};

const escapeCsv = (value) => {
  const str = value === undefined || value === null ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

const parseParams = (section) => {
  if (!section) return [];
  return section
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^Parameters:?$/i.test(line))
    .map((line) => line.replace(/^Constructor:\s*/i, '').replace(/^Methods?:\s*/i, ''))
    .flatMap((line) => {
      // Handle combined method declarations separated by ';'
      return line.split(/;\s*/).map((part) => part.trim()).filter(Boolean);
    })
    .map((line) => {
      const [namePart, typePart] = line.split(':').map((t) => t.trim());
      if (!namePart || !typePart) return null;
      const name = namePart.replace(/[^a-zA-Z0-9_]/g, '_') || 'param';
      return { name, type: typePart };
    })
    .filter(Boolean);
};

const extractRawValues = (testStr) => {
  if (!testStr) return '';
  // Remove parameter names like "nums = ", "target = ", "s = ", etc.
  // Keep only the values and commas between values
  const cleaned = testStr
    .replace(/\b\w+\s*=\s*/g, '')  // Remove "word =" patterns
    .trim();
  return cleaned;
};

const parseTestCases = (section) => {
  if (!section) return [];
  const lines = section.split(/\n/);
  const cases = [];
  let collecting = false;
  let inputParts = [];

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    // Inline "Input: ... -> Output: ..."
    const inline = line.match(/^Input:\s*(.*)\s*->\s*Output:\s*(.*)$/i);
    if (inline) {
      cases.push({ input: inline[1].trim(), output: inline[2].trim() });
      collecting = false;
      inputParts = [];
      return;
    }

    if (/^Input:/i.test(line)) {
      collecting = true;
      inputParts = [];
      const initial = line.replace(/^Input:\s*/i, '').trim();
      if (initial) inputParts.push(initial);
      return;
    }

    if (collecting && /^(->\s*)?Output:/i.test(line)) {
      const output = line.replace(/^(->\s*)?Output:\s*/i, '').trim();
      const input = inputParts.filter(Boolean).join(' ');
      cases.push({ input, output });
      collecting = false;
      inputParts = [];
      return;
    }

    if (collecting) {
      inputParts.push(line);
    }
  });

  return cases;
};

const text = fs.readFileSync(INPUT_PATH, 'utf8');
const entries = text.split(/\n(?=\d+\.\s)/).filter((e) => e.trim());

const headers = [
  'title',
  'function_name',
  'description',
  'difficulty',
  'question_type',
  'tags',
  'languages',
  'parameter_schema',
  'examples',
  'leetcode_url',
  'geeksforgeeks_url',
  'other_platform_url',
  'other_platform_name',
  'solution_video_url',
  'testcase_1_input',
  'testcase_1_output',
  'testcase_1_hidden',
  'testcase_2_input',
  'testcase_2_output',
  'testcase_2_hidden',
  'testcase_3_input',
  'testcase_3_output',
  'testcase_3_hidden'
];

const rows = entries.map((entryRaw) => {
  const entry = entryRaw.trim();
  const titleMatch = entry.match(/^\d+\.\s+(.+)/);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const urlMatch = entry.match(/URL:\s*(.+)/);
  const url = urlMatch ? urlMatch[1].trim() : '';
  const tagsMatch = entry.match(/Tags:\s*(.+)/);
  const tagsRaw = tagsMatch ? tagsMatch[1].trim() : '';
  const tags = tagsRaw.toLowerCase();
  const questionType = mapQuestionType(title, tagsRaw);
  const difficultyMatch = entry.match(/Difficulty:\s*(.+)/);
  const difficulty = difficultyMatch ? difficultyMatch[1].trim() : '';
  const descMatch = entry.match(/Description:\s*([\s\S]*?)(?:\n\s*Parameters:|\n\s*Parameters\s*\n)/i);
  const description = descMatch ? clean(descMatch[1]) : '';
  const paramsSection = extractBetween(entry, 'Parameters:', 'Return Type:');
  const params = parseParams(paramsSection);
  const returnTypeMatch = entry.match(/Return Type:\s*([^\n]+)/i);
  const returnType = returnTypeMatch ? returnTypeMatch[1].trim() : '';
  const parameterSchema = JSON.stringify({ params, returnType });
  const testsMatch = entry.match(/Test Cases:\s*([\s\S]*)/i);
  const testsSection = testsMatch ? testsMatch[1] : '';
  const testCases = parseTestCases(testsSection).slice(0, 3);
  while (testCases.length < 3) {
    testCases.push({ input: '', output: '' });
  }

  return {
    title,
    function_name: toCamel(title),
    description,
    difficulty,
    question_type: questionType,
    tags,
    languages: 'javascript, python, java, cpp',
    parameter_schema: parameterSchema,
    examples: '[]',
    leetcode_url: url,
    geeksforgeeks_url: '',
    other_platform_url: '',
    other_platform_name: '',
    solution_video_url: '',
    testcase_1_input: extractRawValues(testCases[0].input),
    testcase_1_output: extractRawValues(testCases[0].output),
    testcase_1_hidden: 'false',
    testcase_2_input: extractRawValues(testCases[1].input),
    testcase_2_output: extractRawValues(testCases[1].output),
    testcase_2_hidden: 'false',
    testcase_3_input: extractRawValues(testCases[2].input),
    testcase_3_output: extractRawValues(testCases[2].output),
    testcase_3_hidden: 'false'
  };
});

const forceQuoteFields = new Set([
  'testcase_1_input','testcase_1_output',
  'testcase_2_input','testcase_2_output',
  'testcase_3_input','testcase_3_output'
]);

const csvLines = [headers.join(',')];
rows.forEach((row) => {
  const line = headers.map((h) => {
    const v = row[h];
    let cell = escapeCsv(v);
    // Always quote testcase fields to ensure backend receives strings
    if (forceQuoteFields.has(h)) {
      const str = String(v ?? '');
      cell = '"' + str.replace(/"/g, '""') + '"';
    }
    return cell;
  }).join(',');
  csvLines.push(line);
});

fs.writeFileSync(OUTPUT_PATH, csvLines.join('\n'), 'utf8');
console.log(`Generated ${rows.length} rows to ${OUTPUT_PATH}`);
