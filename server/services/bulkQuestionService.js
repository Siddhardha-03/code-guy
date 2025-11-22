const xlsx = require('xlsx');

/**
 * Parse Excel file and extract questions data
 */
function parseExcelFile(buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = xlsx.utils.sheet_to_json(worksheet);
  
  return data;
}

/**
 * Validate a single question row
 */
function validateQuestionRow(row, rowIndex) {
  const errors = [];
  
  // Required fields
  if (!row.title || !row.title.trim()) {
    errors.push(`Row ${rowIndex}: Title is required`);
  }
  
  if (!row.description || !row.description.trim()) {
    errors.push(`Row ${rowIndex}: Description is required`);
  }
  
  if (!row.difficulty || !['Easy', 'Medium', 'Hard'].includes(row.difficulty)) {
    errors.push(`Row ${rowIndex}: Difficulty must be Easy, Medium, or Hard`);
  }
  
  // Validate test cases - at least one required
  const testCaseInputs = [];
  const testCaseOutputs = [];
  const testCaseHidden = [];
  
  for (let i = 1; i <= 10; i++) {
    if (row[`testcase_${i}_input`]) {
      testCaseInputs.push(row[`testcase_${i}_input`]);
      testCaseOutputs.push(row[`testcase_${i}_output`] || '');
      testCaseHidden.push(row[`testcase_${i}_hidden`] === 'true' || row[`testcase_${i}_hidden`] === true || row[`testcase_${i}_hidden`] === 1);
    }
  }
  
  if (testCaseInputs.length === 0) {
    errors.push(`Row ${rowIndex}: At least one test case is required`);
  }
  
  // Check for matching outputs
  for (let i = 0; i < testCaseInputs.length; i++) {
    if (!testCaseOutputs[i] || !testCaseOutputs[i].trim()) {
      errors.push(`Row ${rowIndex}: Test case ${i + 1} is missing expected output`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    testCases: testCaseInputs.map((input, i) => ({
      input,
      expected_output: testCaseOutputs[i],
      hidden: testCaseHidden[i]
    }))
  };
}

/**
 * Transform row data into question object
 */
function transformRowToQuestion(row) {
  // Parse tags
  let tags = { tags: [] };
  if (row.tags) {
    const tagList = row.tags.split(',').map(t => t.trim()).filter(t => t);
    tags = { tags: tagList };
  }
  
  // Parse languages
  let languages = { languages: ['javascript', 'python', 'java', 'cpp'] };
  if (row.languages) {
    const langList = row.languages.split(',').map(l => l.trim()).filter(l => l);
    languages = { languages: langList };
  }
  
  // Parse parameter schema
  let parameterSchema = { params: [], returnType: '' };
  if (row.parameter_schema) {
    try {
      parameterSchema = JSON.parse(row.parameter_schema);
    } catch (e) {
      // Use default if parsing fails
    }
  }
  
  // Parse examples
  let examples = [];
  if (row.examples) {
    try {
      examples = JSON.parse(row.examples);
    } catch (e) {
      // Use empty array if parsing fails
    }
  }
  
  return {
    title: row.title.trim(),
    function_name: row.function_name?.trim() || '',
    description: row.description.trim(),
    difficulty: row.difficulty,
    question_type: row.question_type?.trim() || '',
    tags,
    language_supported: languages,
    parameter_schema: parameterSchema,
    examples,
    leetcode_url: row.leetcode_url?.trim() || '',
    geeksforgeeks_url: row.geeksforgeeks_url?.trim() || '',
    other_platform_url: row.other_platform_url?.trim() || '',
    other_platform_name: row.other_platform_name?.trim() || ''
  };
}

/**
 * Bulk insert questions with test cases
 */
async function bulkInsertQuestions(db, questions, testCasesMap) {
  const connection = await db.getConnection();
  await connection.beginTransaction();
  
  const results = {
    successful: [],
    failed: []
  };
  
  try {
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const testCases = testCasesMap[i];
      
      try {
        // Insert question
        const [result] = await connection.execute(
          `INSERT INTO questions 
          (title, function_name, description, difficulty, question_type, tags, language_supported, parameter_schema, examples, leetcode_url, geeksforgeeks_url, other_platform_url, other_platform_name) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            question.title,
            question.function_name,
            question.description,
            question.difficulty,
            question.question_type,
            JSON.stringify(question.tags),
            JSON.stringify(question.language_supported),
            JSON.stringify(question.parameter_schema),
            JSON.stringify(question.examples),
            question.leetcode_url,
            question.geeksforgeeks_url,
            question.other_platform_url,
            question.other_platform_name
          ]
        );
        
        const questionId = result.insertId;
        
        // Insert test cases
        for (const testCase of testCases) {
          await connection.execute(
            'INSERT INTO test_cases (question_id, input, expected_output, hidden) VALUES (?, ?, ?, ?)',
            [questionId, testCase.input, testCase.expected_output, testCase.hidden ? 1 : 0]
          );
        }
        
        results.successful.push({
          row: i + 2, // +2 because row 1 is header and array is 0-indexed
          title: question.title,
          questionId
        });
      } catch (error) {
        results.failed.push({
          row: i + 2,
          title: question.title,
          error: error.message
        });
      }
    }
    
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  
  return results;
}

/**
 * Process Excel file and import questions
 */
async function processExcelImport(db, fileBuffer) {
  // Parse Excel
  const rows = parseExcelFile(fileBuffer);
  
  if (!rows || rows.length === 0) {
    throw new Error('Excel file is empty or invalid');
  }
  
  // Validate all rows
  const validationResults = [];
  const validQuestions = [];
  const validTestCases = [];
  
  for (let i = 0; i < rows.length; i++) {
    const validation = validateQuestionRow(rows[i], i + 2); // +2 for header and 1-based indexing
    validationResults.push({
      row: i + 2,
      ...validation
    });
    
    if (validation.valid) {
      validQuestions.push(transformRowToQuestion(rows[i]));
      validTestCases.push(validation.testCases);
    }
  }
  
  // If there are validation errors, return them
  const errors = validationResults.filter(r => !r.valid);
  if (errors.length > 0) {
    return {
      success: false,
      validationErrors: errors.flatMap(e => e.errors),
      totalRows: rows.length,
      validRows: validQuestions.length,
      invalidRows: errors.length
    };
  }
  
  // Insert valid questions
  const insertResults = await bulkInsertQuestions(db, validQuestions, validTestCases);
  
  return {
    success: true,
    totalRows: rows.length,
    successful: insertResults.successful.length,
    failed: insertResults.failed.length,
    details: insertResults
  };
}

module.exports = {
  parseExcelFile,
  validateQuestionRow,
  transformRowToQuestion,
  bulkInsertQuestions,
  processExcelImport
};
