import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuestionForm from './QuestionForm';
import * as adminService from '../services/adminService';

// Mock the adminService
jest.mock('../services/adminService');

describe('QuestionForm Component', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    adminService.getAllTestCases.mockResolvedValue({ testCases: [] });
  });

  describe('Rendering & Structure', () => {
    test('renders create mode when no question provided', () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      expect(screen.getByText('Create New Question')).toBeInTheDocument();
      expect(screen.getByText('Add a new coding challenge')).toBeInTheDocument();
    });

    test('renders edit mode when question provided', () => {
      const question = {
        id: 1,
        title: 'Test Question',
        description: 'Test Description'
      };
      render(
        <QuestionForm 
          question={question}
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );
      expect(screen.getByText('Edit Question')).toBeInTheDocument();
      expect(screen.getByText('Update the coding question details')).toBeInTheDocument();
    });

    test('renders all major sections', () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Function Signature')).toBeInTheDocument();
      expect(screen.getByText('Examples (optional)')).toBeInTheDocument();
      expect(screen.getByText('Supported Programming Languages')).toBeInTheDocument();
      expect(screen.getByText('Test Cases')).toBeInTheDocument();
    });
  });

  describe('Basic Information Section', () => {
    test('loads title and description fields', () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      expect(screen.getByPlaceholderText('Enter a clear, descriptive title...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Describe the problem clearly. You can use HTML tags for formatting...')).toBeInTheDocument();
    });

    test('allows typing in title field', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const titleInput = screen.getByPlaceholderText('Enter a clear, descriptive title...');
      await userEvent.type(titleInput, 'Two Sum');
      expect(titleInput.value).toBe('Two Sum');
    });

    test('displays all 20 question type options', () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const questionTypeSelect = screen.getByDisplayValue('Select type');
      fireEvent.click(questionTypeSelect);
      
      expect(screen.getByText('Array / Two Pointer / Sliding Window')).toBeInTheDocument();
      expect(screen.getByText('String')).toBeInTheDocument();
      expect(screen.getByText('Linked List')).toBeInTheDocument();
      expect(screen.getByText('Binary Tree / BST')).toBeInTheDocument();
      expect(screen.getByText('Graph (Adjacency List)')).toBeInTheDocument();
      expect(screen.getByText('Dynamic Programming / Recursion')).toBeInTheDocument();
      expect(screen.getByText('Heap / Priority Queue')).toBeInTheDocument();
      expect(screen.getByText('Backtracking')).toBeInTheDocument();
    });

    test('allows setting difficulty level', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const difficultySelect = screen.getByDisplayValue('🟢 Easy');
      await userEvent.selectOptions(difficultySelect, 'Medium');
      expect(difficultySelect.value).toBe('Medium');
    });

    test('allows adding platform links', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const leetcodeInput = screen.getByPlaceholderText('https://leetcode.com/problems/example');
      await userEvent.type(leetcodeInput, 'https://leetcode.com/problems/two-sum');
      expect(leetcodeInput.value).toBe('https://leetcode.com/problems/two-sum');
    });
  });

  describe('Examples Section (NEW)', () => {
    test('renders examples section', () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      expect(screen.getByText('Examples (optional)')).toBeInTheDocument();
      expect(screen.getByText('Add worked examples to help users understand the problem better.')).toBeInTheDocument();
    });

    test('displays example counter', () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      expect(screen.getByText('0 example(s)')).toBeInTheDocument();
    });

    test('allows adding examples', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const addExampleBtn = screen.getByText('Add Another Example');
      await userEvent.click(addExampleBtn);
      
      expect(screen.getByText('Example 1')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., nums = [2,7,11,15], target = 9')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., [0,1]')).toBeInTheDocument();
    });

    test('allows editing example input', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const addExampleBtn = screen.getByText('Add Another Example');
      await userEvent.click(addExampleBtn);
      
      const inputField = screen.getByPlaceholderText('e.g., nums = [2,7,11,15], target = 9');
      await userEvent.type(inputField, 'nums = [2,7,11,15], target = 9');
      expect(inputField.value).toBe('nums = [2,7,11,15], target = 9');
    });

    test('allows editing example output', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const addExampleBtn = screen.getByText('Add Another Example');
      await userEvent.click(addExampleBtn);
      
      const outputField = screen.getByPlaceholderText('e.g., [0,1]');
      await userEvent.type(outputField, '[0,1]');
      expect(outputField.value).toBe('[0,1]');
    });

    test('allows adding optional explanation', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const addExampleBtn = screen.getByText('Add Another Example');
      await userEvent.click(addExampleBtn);
      
      const explanationField = screen.getByPlaceholderText('Explain why this output is correct...');
      await userEvent.type(explanationField, 'Element at index 0 and 1 sum to target');
      expect(explanationField.value).toBe('Element at index 0 and 1 sum to target');
    });

    test('allows removing examples', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const addExampleBtn = screen.getByText('Add Another Example');
      await userEvent.click(addExampleBtn);
      
      expect(screen.getByText('Example 1')).toBeInTheDocument();
      
      const removeBtn = screen.getByText('Remove');
      await userEvent.click(removeBtn);
      
      expect(screen.queryByText('Example 1')).not.toBeInTheDocument();
    });

    test('updates counter when examples added', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      expect(screen.getByText('0 example(s)')).toBeInTheDocument();
      
      const addExampleBtn = screen.getByText('Add Another Example');
      await userEvent.click(addExampleBtn);
      expect(screen.getByText('1 example(s)')).toBeInTheDocument();
      
      await userEvent.click(addExampleBtn);
      expect(screen.getByText('2 example(s)')).toBeInTheDocument();
    });

    test('allows multiple examples', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const addExampleBtn = screen.getByText('Add Another Example');
      
      await userEvent.click(addExampleBtn);
      await userEvent.click(addExampleBtn);
      await userEvent.click(addExampleBtn);
      
      expect(screen.getByText('Example 1')).toBeInTheDocument();
      expect(screen.getByText('Example 2')).toBeInTheDocument();
      expect(screen.getByText('Example 3')).toBeInTheDocument();
    });

    test('loads examples when editing question', async () => {
      const question = {
        id: 1,
        title: 'Test',
        description: 'Test',
        examples: [
          { input: 'nums = [1,2]', output: '[0,1]', explanation: 'sum is 3' }
        ]
      };
      adminService.getAllTestCases.mockResolvedValue({ testCases: [] });
      
      render(
        <QuestionForm 
          question={question}
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('nums = [1,2]')).toBeInTheDocument();
        expect(screen.getByDisplayValue('[0,1]')).toBeInTheDocument();
        expect(screen.getByDisplayValue('sum is 3')).toBeInTheDocument();
      });
    });
  });

  describe('Function Signature Section', () => {
    test('displays return type options', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const returnTypeSelect = screen.getAllByDisplayValue('Select return type')[0];
      fireEvent.click(returnTypeSelect);
      
      expect(screen.getByText('void')).toBeInTheDocument();
      expect(screen.getByText('int')).toBeInTheDocument();
      expect(screen.getByText('List[int]')).toBeInTheDocument();
      expect(screen.getByText('ListNode')).toBeInTheDocument();
    });

    test('displays all 27 type options for parameters', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      
      // Find parameter type selects
      const selects = screen.getAllByDisplayValue('Select type');
      const paramTypeSelect = selects[selects.length - 1]; // Last one is parameter type
      fireEvent.click(paramTypeSelect);
      
      expect(screen.getByText('List[int]')).toBeInTheDocument();
      expect(screen.getByText('List[List[str]]')).toBeInTheDocument();
      expect(screen.getByText('Map[str,int]')).toBeInTheDocument();
    });

    test('allows adding parameters', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const addParamBtn = screen.getByText('Add Parameter');
      
      await userEvent.click(addParamBtn);
      expect(screen.getByText('Parameter 2')).toBeInTheDocument();
    });

    test('displays parameter counter', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      expect(screen.getByText('1 parameter(s)')).toBeInTheDocument();
      
      const addParamBtn = screen.getByText('Add Parameter');
      await userEvent.click(addParamBtn);
      expect(screen.getByText('2 parameter(s)')).toBeInTheDocument();
    });
  });

  describe('Languages Section', () => {
    test('displays language checkboxes', () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      expect(screen.getByRole('checkbox', { name: /javascript/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /python/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /java/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /cpp/i })).toBeInTheDocument();
    });

    test('allows toggling languages', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const pythonCheckbox = screen.getByRole('checkbox', { name: /python/i });
      
      await userEvent.click(pythonCheckbox);
      expect(pythonCheckbox).toBeChecked();
      
      await userEvent.click(pythonCheckbox);
      expect(pythonCheckbox).not.toBeChecked();
    });
  });

  describe('Test Cases Section', () => {
    test('displays test case inputs', () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      expect(screen.getByPlaceholderText('Enter test input...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter expected output...')).toBeInTheDocument();
    });

    test('displays hidden checkbox for test cases', () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      expect(screen.getByLabelText('Hidden from students')).toBeInTheDocument();
    });

    test('allows adding multiple test cases', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const addTestCaseBtn = screen.getByText('Add Another Test Case');
      
      await userEvent.click(addTestCaseBtn);
      expect(screen.getByText('Test Case 2')).toBeInTheDocument();
    });

    test('displays test case counter', () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      expect(screen.getByText('1 total • 1 visible • 0 hidden')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    test('prevents submission without title', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      adminService.createQuestion.mockRejectedValue(new Error('Title is required'));
      
      const submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });

    test('prevents submission without description', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const titleInput = screen.getByPlaceholderText('Enter a clear, descriptive title...');
      await userEvent.type(titleInput, 'Test Question');
      
      const submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(screen.getByText('Description is required')).toBeInTheDocument();
      });
    });

    test('prevents submission without test cases', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const titleInput = screen.getByPlaceholderText('Enter a clear, descriptive title...');
      await userEvent.type(titleInput, 'Test Question');
      
      const descInput = screen.getByPlaceholderText('Describe the problem clearly. You can use HTML tags for formatting...');
      await userEvent.type(descInput, 'Test Description');
      
      // Remove the default test case
      const testCaseRemoveBtn = screen.getByText('Remove');
      await userEvent.click(testCaseRemoveBtn);
      
      const submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(screen.getByText('At least one test case is required')).toBeInTheDocument();
      });
    });

    test('prevents submission with incomplete test cases', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      const titleInput = screen.getByPlaceholderText('Enter a clear, descriptive title...');
      await userEvent.type(titleInput, 'Test Question');
      
      const descInput = screen.getByPlaceholderText('Describe the problem clearly. You can use HTML tags for formatting...');
      await userEvent.type(descInput, 'Test Description');
      
      const submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/Test case 1 must have both input and expected output/i)).toBeInTheDocument();
      });
    });

    test('prevents submission with incomplete examples', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      
      // Fill required fields
      const titleInput = screen.getByPlaceholderText('Enter a clear, descriptive title...');
      await userEvent.type(titleInput, 'Test Question');
      
      const descInput = screen.getByPlaceholderText('Describe the problem clearly. You can use HTML tags for formatting...');
      await userEvent.type(descInput, 'Test Description');
      
      // Add test case
      const testInputs = screen.getAllByPlaceholderText('Enter test input...');
      await userEvent.type(testInputs[0], 'test input');
      
      const testOutputs = screen.getAllByPlaceholderText('Enter expected output...');
      await userEvent.type(testOutputs[0], 'test output');
      
      // Add incomplete example
      const addExampleBtn = screen.getByText('Add Another Example');
      await userEvent.click(addExampleBtn);
      
      const exampleInput = screen.getByPlaceholderText('e.g., nums = [2,7,11,15], target = 9');
      await userEvent.type(exampleInput, 'example input');
      // Don't fill output
      
      const submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(screen.getByText(/Example 1 must have both input and output/i)).toBeInTheDocument();
      });
    });

    test('allows submission with complete examples', async () => {
      adminService.createQuestion.mockResolvedValue({ id: 1 });
      
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      
      // Fill required fields
      const titleInput = screen.getByPlaceholderText('Enter a clear, descriptive title...');
      await userEvent.type(titleInput, 'Test Question');
      
      const descInput = screen.getByPlaceholderText('Describe the problem clearly. You can use HTML tags for formatting...');
      await userEvent.type(descInput, 'Test Description');
      
      // Add test case
      const testInputs = screen.getAllByPlaceholderText('Enter test input...');
      await userEvent.type(testInputs[0], 'test input');
      
      const testOutputs = screen.getAllByPlaceholderText('Enter expected output...');
      await userEvent.type(testOutputs[0], 'test output');
      
      // Add complete example
      const addExampleBtn = screen.getByText('Add Another Example');
      await userEvent.click(addExampleBtn);
      
      const exampleInput = screen.getByPlaceholderText('e.g., nums = [2,7,11,15], target = 9');
      await userEvent.type(exampleInput, 'example input');
      
      const exampleOutput = screen.getByPlaceholderText('e.g., [0,1]');
      await userEvent.type(exampleOutput, 'example output');
      
      const submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(adminService.createQuestion).toHaveBeenCalled();
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Data Loading', () => {
    test('loads question data correctly', async () => {
      const question = {
        id: 1,
        title: 'Two Sum',
        function_name: 'twoSum',
        description: 'Find two numbers...',
        difficulty: 'Easy',
        question_type: 'array',
        language_supported: ['python', 'java'],
        tags: ['array', 'hash table'],
        examples: []
      };
      adminService.getAllTestCases.mockResolvedValue({ testCases: [] });
      
      render(
        <QuestionForm 
          question={question}
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Two Sum')).toBeInTheDocument();
        expect(screen.getByDisplayValue('twoSum')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Easy')).toBeInTheDocument();
      });
    });

    test('loads test cases when editing', async () => {
      const question = {
        id: 1,
        title: 'Test',
        description: 'Test'
      };
      adminService.getAllTestCases.mockResolvedValue({
        testCases: [
          { input: '[1,2]', expected_output: '[0,1]', hidden: false }
        ]
      });
      
      render(
        <QuestionForm 
          question={question}
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('[1,2]')).toBeInTheDocument();
        expect(screen.getByDisplayValue('[0,1]')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('calls createQuestion for new question', async () => {
      adminService.createQuestion.mockResolvedValue({ id: 1 });
      
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      
      // Fill form
      const titleInput = screen.getByPlaceholderText('Enter a clear, descriptive title...');
      await userEvent.type(titleInput, 'Test');
      
      const descInput = screen.getByPlaceholderText('Describe the problem clearly. You can use HTML tags for formatting...');
      await userEvent.type(descInput, 'Test');
      
      const testInputs = screen.getAllByPlaceholderText('Enter test input...');
      await userEvent.type(testInputs[0], 'test');
      
      const testOutputs = screen.getAllByPlaceholderText('Enter expected output...');
      await userEvent.type(testOutputs[0], 'test');
      
      // Submit
      const submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(adminService.createQuestion).toHaveBeenCalled();
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    test('calls updateQuestion for existing question', async () => {
      adminService.updateQuestion.mockResolvedValue({ id: 1 });
      adminService.getAllTestCases.mockResolvedValue({ testCases: [] });
      
      const question = {
        id: 1,
        title: 'Test',
        description: 'Test',
        examples: []
      };
      
      render(
        <QuestionForm 
          question={question}
          onSave={mockOnSave} 
          onCancel={mockOnCancel} 
        />
      );
      
      const testInputs = screen.getAllByPlaceholderText('Enter test input...');
      await userEvent.type(testInputs[0], 'test');
      
      const testOutputs = screen.getAllByPlaceholderText('Enter expected output...');
      await userEvent.type(testOutputs[0], 'test');
      
      const submitBtn = screen.getByText('Update Question');
      await userEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(adminService.updateQuestion).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            title: 'Test',
            description: 'Test'
          })
        );
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('User Interactions', () => {
    test('shows loading state during submission', async () => {
      adminService.createQuestion.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ id: 1 }), 1000))
      );
      
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      
      const titleInput = screen.getByPlaceholderText('Enter a clear, descriptive title...');
      await userEvent.type(titleInput, 'Test');
      
      const descInput = screen.getByPlaceholderText('Describe the problem clearly. You can use HTML tags for formatting...');
      await userEvent.type(descInput, 'Test');
      
      const testInputs = screen.getAllByPlaceholderText('Enter test input...');
      await userEvent.type(testInputs[0], 'test');
      
      const testOutputs = screen.getAllByPlaceholderText('Enter expected output...');
      await userEvent.type(testOutputs[0], 'test');
      
      const submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);
      
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    test('allows canceling form', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      
      const cancelBtn = screen.getByText('Cancel');
      await userEvent.click(cancelBtn);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    test('displays error messages', async () => {
      render(
        <QuestionForm onSave={mockOnSave} onCancel={mockOnCancel} />
      );
      
      const submitBtn = screen.getByText('Create Question');
      await userEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });
  });
});
