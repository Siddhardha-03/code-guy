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
  
  // Required fields - convert to string first
  const title = String(row.title || '').trim();
  if (!title) {
    errors.push(`Row ${rowIndex}: Title is required`);
  }
  
  const description = String(row.description || '').trim();
  if (!description) {
    errors.push(`Row ${rowIndex}: Description is required`);
  }
  
  const difficulty = String(row.difficulty || '').trim();
  if (!difficulty || !['Easy', 'Medium', 'Hard'].includes(difficulty)) {
    errors.push(`Row ${rowIndex}: Difficulty must be Easy, Medium, or Hard`);
  }
  
  // Validate test cases - at least one required
  const testCaseInputs = [];
  const testCaseOutputs = [];
  const testCaseHidden = [];
  
  for (let i = 1; i <= 10; i++) {
    const input = String(row[`testcase_${i}_input`] || '').trim();
    const output = String(row[`testcase_${i}_output`] || '').trim();
    
    // Only add test case if BOTH input and output exist
    if (input && output) {
      testCaseInputs.push(input);
      testCaseOutputs.push(output);
      testCaseHidden.push(row[`testcase_${i}_hidden`] === 'true' || row[`testcase_${i}_hidden`] === true || row[`testcase_${i}_hidden`] === 1);
    }
  }
  
  if (testCaseInputs.length === 0) {
    errors.push(`Row ${rowIndex}: At least one test case is required`);
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
  // Parse tags - ensure string conversion
  let tags = { tags: [] };
  if (row.tags) {
    const tagList = String(row.tags).split(',').map(t => String(t).trim()).filter(t => t);
    tags = { tags: tagList };
  }
  
  // Parse languages - ensure string conversion
  let languages = { languages: ['javascript', 'python', 'java', 'cpp'] };
  if (row.languages) {
    const langList = String(row.languages).split(',').map(l => String(l).trim()).filter(l => l);
    languages = { languages: langList };
  }
  
  // Parse parameter schema
  let parameterSchema = { params: [], returnType: '' };
  if (row.parameter_schema) {
    try {
      const schemaStr = typeof row.parameter_schema === 'string' ? row.parameter_schema : String(row.parameter_schema);
      parameterSchema = JSON.parse(schemaStr);
    } catch (e) {
      // Use default if parsing fails
    }
  }
  
  // Parse examples
  let examples = [];
  if (row.examples) {
    try {
      const examplesStr = typeof row.examples === 'string' ? row.examples : String(row.examples);
      examples = JSON.parse(examplesStr);
    } catch (e) {
      // Use empty array if parsing fails
    }
  }
  
  return {
    title: String(row.title || '').trim(),
    function_name: String(row.function_name || '').trim(),
    description: String(row.description || '').trim(),
    difficulty: String(row.difficulty || '').trim(),
    question_type: String(row.question_type || '').trim(),
    tags,
    language_supported: languages,
    parameter_schema: parameterSchema,
    examples,
    leetcode_url: String(row.leetcode_url || '').trim(),
    geeksforgeeks_url: String(row.geeksforgeeks_url || '').trim(),
    other_platform_url: String(row.other_platform_url || '').trim(),
    other_platform_name: String(row.other_platform_name || '').trim(),
    solution_video_url: String(row.solution_video_url || '').trim()
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
          (title, function_name, description, difficulty, question_type, tags, language_supported, parameter_schema, examples, leetcode_url, geeksforgeeks_url, other_platform_url, other_platform_name, solution_video_url) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            question.other_platform_name,
            question.solution_video_url
          ]
        );
        
        const questionId = result.insertId;
        
        // Insert test cases
        for (const testCase of testCases) {
          await connection.execute(
            'INSERT INTO test_cases (question_id, input, expected_output, hidden) VALUES (?, ?, ?, ?)',
            [
              questionId,
              String(testCase.input || ''),
              String(testCase.expected_output || ''),
              testCase.hidden ? 1 : 0
            ]
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
