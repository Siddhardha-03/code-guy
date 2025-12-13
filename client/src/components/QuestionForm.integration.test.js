/**
 * QuestionForm Integration Tests
 * Tests the complete workflow of creating and editing questions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionForm from './QuestionForm';
import * as adminService from '../services/adminService';

jest.mock('../services/adminService');

describe('QuestionForm - Integration Tests', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    adminService.getAllTestCases.mockResolvedValue({ testCases: [] });
  });

  describe('Complete Question Creation Workflow', () => {
    test('create question with examples from scratch', async () => {
      adminService.createQuestion.mockResolvedValue({ id: 1 });

      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      // Step 1: Fill basic information
      const titleInput = screen.getByPlaceholderText('Enter a clear, descriptive title...');
      await userEvent.type(titleInput, 'Two Sum');

      const descInput = screen.getByPlaceholderText('Describe the problem clearly. You can use HTML tags for formatting...');
      await userEvent.type(descInput, 'Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.');

      // Step 2: Select question type
      const questionTypeSelect = screen.getByDisplayValue('Select type');
      await userEvent.selectOptions(questionTypeSelect, 'array');

      // Step 3: Select difficulty
      const diffSelect = screen.getByDisplayValue('🟢 Easy');
      await userEvent.selectOptions(diffSelect, 'Easy');

      // Step 4: Add tags
      const tagsInput = screen.getByPlaceholderText('array, hash table, dynamic programming');
      await userEvent.type(tagsInput, 'array, hash table');

      // Step 5: Set up function signature
      const returnTypeSelects = screen.getAllByDisplayValue('Select return type');
      await userEvent.selectOptions(returnTypeSelects[0], 'List[int]');

      // Step 6: Add example
      const addExampleBtn = screen.getByText('Add Another Example');
      await userEvent.click(addExampleBtn);

      const exampleInput = screen.getByPlaceholderText('e.g., nums = [2,7,11,15], target = 9');
      await userEvent.type(exampleInput, 'nums = [2,7,11,15], target = 9');

      const exampleOutput = screen.getByPlaceholderText('e.g., [0,1]');
      await userEvent.type(exampleOutput, '[0,1]');

      const explanation = screen.getByPlaceholderText('Explain why this output is correct...');
      await userEvent.type(explanation, 'nums[0] + nums[1] == 9, so we return [0, 1].');

      // Step 7: Fill test case
      const testInputs = screen.getAllByPlaceholderText('Enter test input...');
      await userEvent.type(testInputs[0], '[2,7,11,15]\n9');

      const testOutputs = screen.getAllByPlaceholderText('Enter expected output...');
      await userEvent.type(testOutputs[0], '[0,1]');

      // Step 8: Select languages
      const pythonCheckbox = screen.getByRole('checkbox', { name: /python/i });
      const javaCheckbox = screen.getByRole('checkbox', { name: /java/i });
      await userEvent.click(pythonCheckbox);
      await userEvent.click(javaCheckbox);

      // Step 9: Submit
      const submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);

      // Verify
      await waitFor(() => {
        expect(adminService.createQuestion).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Two Sum',
            description: expect.stringContaining('array of integers'),
            question_type: 'array',
            difficulty: 'Easy',
            examples: expect.arrayContaining([
              expect.objectContaining({
                input: 'nums = [2,7,11,15], target = 9',
                output: '[0,1]',
                explanation: expect.stringContaining('nums[0] + nums[1]')
              })
            ]),
            testCases: expect.arrayContaining([
              expect.objectContaining({
                input: '[2,7,11,15]\n9',
                expected_output: '[0,1]'
              })
            ])
          })
        );
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    test('create complex question with multiple examples and parameters', async () => {
      adminService.createQuestion.mockResolvedValue({ id: 2 });

      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      // Fill basic info
      const titleInput = screen.getByPlaceholderText('Enter a clear, descriptive title...');
      await userEvent.type(titleInput, 'Binary Tree Level Order Traversal');

      const descInput = screen.getByPlaceholderText('Describe the problem clearly. You can use HTML tags for formatting...');
      await userEvent.type(descInput, 'Given the root of a binary tree, return the level order traversal of its nodes values.');

      // Set question type
      const questionTypeSelect = screen.getByDisplayValue('Select type');
      await userEvent.selectOptions(questionTypeSelect, 'binary_tree');

      // Set difficulty
      const diffSelect = screen.getByDisplayValue('🟢 Easy');
      await userEvent.selectOptions(diffSelect, 'Medium');

      // Set return type
      const returnTypeSelects = screen.getAllByDisplayValue('Select return type');
      await userEvent.selectOptions(returnTypeSelects[0], 'List[List[int]]');

      // Update parameter type
      const typeSelects = screen.getAllByDisplayValue('Select type');
      const paramTypeSelect = typeSelects[typeSelects.length - 1];
      await userEvent.selectOptions(paramTypeSelect, 'TreeNode');

      // Add multiple examples
      const addExampleBtn = screen.getByText('Add Another Example');
      
      // Example 1
      await userEvent.click(addExampleBtn);
      let exampleInputs = screen.getAllByPlaceholderText('e.g., nums = [2,7,11,15], target = 9');
      await userEvent.type(exampleInputs[exampleInputs.length - 1], '[3,9,20,null,null,15,7]');
      
      let exampleOutputs = screen.getAllByPlaceholderText('e.g., [0,1]');
      await userEvent.type(exampleOutputs[exampleOutputs.length - 1], '[[3],[9,20],[15,7]]');

      // Example 2
      await userEvent.click(addExampleBtn);
      exampleInputs = screen.getAllByPlaceholderText('e.g., nums = [2,7,11,15], target = 9');
      await userEvent.type(exampleInputs[exampleInputs.length - 1], '[1]');
      
      exampleOutputs = screen.getAllByPlaceholderText('e.g., [0,1]');
      await userEvent.type(exampleOutputs[exampleOutputs.length - 1], '[[1]]');

      // Add test cases
      const testInputs = screen.getAllByPlaceholderText('Enter test input...');
      await userEvent.type(testInputs[0], '[3,9,20,null,null,15,7]');

      const testOutputs = screen.getAllByPlaceholderText('Enter expected output...');
      await userEvent.type(testOutputs[0], '[[3],[9,20],[15,7]]');

      // Add another test case
      const addTestCaseBtn = screen.getByText('Add Another Test Case');
      await userEvent.click(addTestCaseBtn);

      const allTestInputs = screen.getAllByPlaceholderText('Enter test input...');
      await userEvent.type(allTestInputs[1], '[1]');

      const allTestOutputs = screen.getAllByPlaceholderText('Enter expected output...');
      await userEvent.type(allTestOutputs[1], '[[1]]');

      // Submit
      const submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(adminService.createQuestion).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Binary Tree Level Order Traversal',
            question_type: 'binary_tree',
            difficulty: 'Medium',
            examples: expect.arrayContaining([
              expect.objectContaining({
                input: '[3,9,20,null,null,15,7]',
                output: '[[3],[9,20],[15,7]]'
              }),
              expect.objectContaining({
                input: '[1]',
                output: '[[1]]'
              })
            ]),
            testCases: expect.arrayContaining([
              expect.objectContaining({
                input: '[3,9,20,null,null,15,7]',
                expected_output: '[[3],[9,20],[15,7]]'
              }),
              expect.objectContaining({
                input: '[1]',
                expected_output: '[[1]]'
              })
            ])
          })
        );
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Complete Question Editing Workflow', () => {
    test('edit existing question and update examples', async () => {
      const existingQuestion = {
        id: 1,
        title: 'Two Sum',
        description: 'Find two numbers that add up to target',
        difficulty: 'Easy',
        question_type: 'array',
        examples: [
          { input: '[2,7,11,15], 9', output: '[0,1]', explanation: 'Old explanation' }
        ],
        parameter_schema: {
          params: [{ name: 'nums', type: 'List[int]' }, { name: 'target', type: 'int' }],
          returnType: 'List[int]'
        }
      };

      adminService.getAllTestCases.mockResolvedValue({
        testCases: [
          { input: '[2,7,11,15]\n9', expected_output: '[0,1]', hidden: false }
        ]
      });
      adminService.updateQuestion.mockResolvedValue({ id: 1 });

      render(
        <QuestionForm 
          question={existingQuestion}
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Two Sum')).toBeInTheDocument();
      });

      // Update title
      const titleInput = screen.getByDisplayValue('Two Sum');
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Two Sum - Easy');

      // Update description
      const descInput = screen.getByDisplayValue('Find two numbers that add up to target');
      await userEvent.clear(descInput);
      await userEvent.type(descInput, 'Find the indices of two numbers that add up to the target');

      // Update existing example explanation
      const explanation = screen.getByDisplayValue('Old explanation');
      await userEvent.clear(explanation);
      await userEvent.type(explanation, 'Updated explanation with more details');

      // Add new example
      const addExampleBtn = screen.getByText('Add Another Example');
      await userEvent.click(addExampleBtn);

      const exampleInputs = screen.getAllByPlaceholderText('e.g., nums = [2,7,11,15], target = 9');
      await userEvent.type(exampleInputs[exampleInputs.length - 1], '[3,3], 6');

      const exampleOutputs = screen.getAllByPlaceholderText('e.g., [0,1]');
      await userEvent.type(exampleOutputs[exampleOutputs.length - 1], '[0,1]');

      // Submit
      const submitBtn = screen.getByText('Update Question');
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(adminService.updateQuestion).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            title: 'Two Sum - Easy',
            description: expect.stringContaining('indices of two'),
            examples: expect.arrayContaining([
              expect.objectContaining({
                explanation: 'Updated explanation with more details'
              }),
              expect.objectContaining({
                input: '[3,3], 6',
                output: '[0,1]'
              })
            ])
          })
        );
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Validation Workflows', () => {
    test('validates complete example workflow', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      // Fill required fields
      const titleInput = screen.getByPlaceholderText('Enter a clear, descriptive title...');
      await userEvent.type(titleInput, 'Test');

      const descInput = screen.getByPlaceholderText('Describe the problem clearly. You can use HTML tags for formatting...');
      await userEvent.type(descInput, 'Test');

      // Add incomplete example
      const addExampleBtn = screen.getByText('Add Another Example');
      await userEvent.click(addExampleBtn);

      const exampleInput = screen.getByPlaceholderText('e.g., nums = [2,7,11,15], target = 9');
      await userEvent.type(exampleInput, 'test input');

      // Fill test case
      const testInputs = screen.getAllByPlaceholderText('Enter test input...');
      await userEvent.type(testInputs[0], 'test');

      const testOutputs = screen.getAllByPlaceholderText('Enter expected output...');
      await userEvent.type(testOutputs[0], 'test');

      // Try to submit with incomplete example
      const submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Example 1 must have both input and output/i)).toBeInTheDocument();
      });

      // Now complete the example
      const exampleOutput = screen.getByPlaceholderText('e.g., [0,1]');
      await userEvent.type(exampleOutput, 'test output');

      // Retry submit
      await userEvent.click(submitBtn);

      // Should not show error anymore
      await waitFor(() => {
        expect(screen.queryByText(/Example 1 must have both input and output/i)).not.toBeInTheDocument();
      });
    });

    test('handles validation of all field types', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      // Try submit without anything
      let submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });

      // Add title
      const titleInput = screen.getByPlaceholderText('Enter a clear, descriptive title...');
      await userEvent.type(titleInput, 'Test');

      // Try submit again
      submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Description is required')).toBeInTheDocument();
      });

      // Add description
      const descInput = screen.getByPlaceholderText('Describe the problem clearly. You can use HTML tags for formatting...');
      await userEvent.type(descInput, 'Test');

      // Try submit again
      submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Test case 1 must have both input and expected output/i)).toBeInTheDocument();
      });

      // Add test case
      const testInputs = screen.getAllByPlaceholderText('Enter test input...');
      await userEvent.type(testInputs[0], 'test');

      const testOutputs = screen.getAllByPlaceholderText('Enter expected output...');
      await userEvent.type(testOutputs[0], 'test');

      // Now should be able to submit
      submitBtn = screen.getByText('Create Question');
      adminService.createQuestion.mockResolvedValue({ id: 1 });
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(adminService.createQuestion).toHaveBeenCalled();
      });
    });
  });

  describe('Responsive Behavior', () => {
    test('handles rapid user interactions', async () => {
      adminService.createQuestion.mockResolvedValue({ id: 1 });

      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );

      // Rapidly add and remove examples
      const addExampleBtn = screen.getByText('Add Another Example');
      
      await userEvent.click(addExampleBtn);
      await userEvent.click(addExampleBtn);
      await userEvent.click(addExampleBtn);

      let removeButtons = screen.getAllByText('Remove');
      await userEvent.click(removeButtons[0]);

      // Rapidly fill fields
      const titleInput = screen.getByPlaceholderText('Enter a clear, descriptive title...');
      await userEvent.type(titleInput, 'Test Title Here');

      const descInput = screen.getByPlaceholderText('Describe the problem clearly. You can use HTML tags for formatting...');
      await userEvent.type(descInput, 'Test Description Here');

      // Fill remaining examples quickly
      const exampleInputs = screen.getAllByPlaceholderText('e.g., nums = [2,7,11,15], target = 9');
      for (let i = 0; i < exampleInputs.length; i++) {
        await userEvent.type(exampleInputs[i], `input ${i}`);
      }

      const exampleOutputs = screen.getAllByPlaceholderText('e.g., [0,1]');
      for (let i = 0; i < exampleOutputs.length; i++) {
        await userEvent.type(exampleOutputs[i], `output ${i}`);
      }

      // Fill test case
      const testInputs = screen.getAllByPlaceholderText('Enter test input...');
      await userEvent.type(testInputs[0], 'test');

      const testOutputs = screen.getAllByPlaceholderText('Enter expected output...');
      await userEvent.type(testOutputs[0], 'test');

      // Submit
      const submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);

      await waitFor(() => {
        expect(adminService.createQuestion).toHaveBeenCalled();
      });
    });
  });
});
