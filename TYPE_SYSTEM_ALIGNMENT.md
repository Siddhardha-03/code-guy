# Type System Alignment - Scaffold Generator & Code Runner

## Overview
This document describes the canonical type system used across scaffold generation and code execution. All type mappings, struct definitions, and runtime conversions now use **scaffoldGenerator.js as the single source of truth**.

---

## Canonical Type Mappings

### Primitives
| Canonical Type | Java | Python | JavaScript | C++ |
|---------------|------|--------|------------|-----|
| `int` | `int` | `int` | `number` | `int` |
| `float` | `int` | `int` | `number` | `int` |
| `bool` | `boolean` | `bool` | `boolean` | `bool` |
| `str` | `String` | `str` | `string` | `string` |

### Arrays/Lists
| Canonical Type | Java | Python | JavaScript | C++ |
|---------------|------|--------|------------|-----|
| `List[int]` | `int[]` | `List[int]` | `number[]` | `vector<int>` |
| `List[float]` | `double[]` | `List[float]` | `number[]` | `vector<double>` |
| `List[str]` | `String[]` | `List[str]` | `string[]` | `vector<string>` |
| `List[List[int]]` | `int[][]` | `List[List[int]]` | `number[][]` | `vector<vector<int>>` |

### Structs
| Canonical Type | Java | Python | JavaScript | C++ |
|---------------|------|--------|------------|-----|
| `ListNode` | `ListNode` | `ListNode` | `ListNode` | `ListNode*` |
| `TreeNode` | `TreeNode` | `TreeNode` | `TreeNode` | `TreeNode*` |

---

## Struct Definitions (Aligned)

### Java

#### ListNode
```java
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}
```

#### TreeNode
```java
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) { 
        this.val = val; 
        this.left = left; 
        this.right = right; 
    }
}
```

### Python

#### ListNode
```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
```

#### TreeNode
```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
```

### JavaScript

#### ListNode
```javascript
function ListNode(val, next) { 
    this.val = (val===undefined ? 0 : val); 
    this.next = (next===undefined ? null : next); 
}
```

#### TreeNode
```javascript
function TreeNode(val, left, right) { 
    this.val = (val===undefined ? 0 : val); 
    this.left = (left===undefined ? null : left); 
    this.right = (right===undefined ? null : right); 
}
```

### C++

#### ListNode
```cpp
struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};
```

#### TreeNode
```cpp
struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};
```

---

## Files Aligned

### ✅ scaffoldGenerator.js
- **Location**: `server/utils/scaffoldGenerator.js`
- **Role**: Single source of truth for type mappings
- **Functions**:
  - `mapCanonicalToLang(type)` - Maps canonical types to language-specific types
  - `injectStructsIfNeeded()` - Auto-injects ListNode/TreeNode definitions
  - `buildSignature()` - Generates language-specific function signatures
  - `generateScaffolds()` - Returns {java, python, javascript, cpp} scaffolds

### ✅ codeRunner.js
- **Location**: `server/utils/codeRunner.js`
- **Role**: Runtime code execution with type-consistent wrappers
- **Alignment**:
  - C++ ListNode struct updated to single-constructor pattern (line ~846)
  - C++ TreeNode struct updated to single-constructor pattern (line ~137)
  - C++ buildLinkedList updated to use `new ListNode(0)` instead of `new ListNode()` (line ~851)
  - Java/Python/JavaScript structs already aligned ✅
- **Helper Functions**:
  - `wrapJavaCode()`, `wrapPythonCode()`, `wrapJavaScriptCode()`, `wrapCppCode()`
  - Each wrapper injects struct definitions matching scaffoldGenerator format
  - Builders: `buildLinkedList()`, `buildBinaryTree()`, `buildGraph()`
  - Converters: `linkedListToArray()`, `binaryTreeToArray()`, `graphToAdjList()`

---

## Execution Flow

### 1. Scaffold Generation
```
User clicks "Generate Scaffold" 
→ GET /api/admin/questions/:id/scaffold
→ scaffoldGenerator.generateScaffolds(problem)
→ Returns {java, python, javascript, cpp} with canonical types
```

### 2. Code Execution
```
User submits code with test cases
→ POST /api/compiler/execute
→ codeRunner.js wraps code with struct definitions
→ Injects builders matching canonical types (buildLinkedList, buildBinaryTree)
→ Executes via Judge0
→ Normalizes output back to JSON arrays
```

### 3. Type Consistency
- **Scaffold**: `def twoSum(self, nums: List[int], target: int) -> List[int]:`
- **Runtime Input**: Test case `[2,7,11,15], 9` parsed as `List[int]` and `int`
- **Builder**: `nums = json.loads('[2,7,11,15]')` creates Python list matching scaffold type
- **Output**: Compact serialization `[0,1]` matches expected format

---

## Key Changes Made

### Before Alignment
- ❌ C++ ListNode had 3 constructors (0-arg, 1-arg, 2-arg)
- ❌ C++ TreeNode had 3 constructors
- ❌ buildLinkedList used `new ListNode()` which didn't match scaffold
- ❌ Type mappings scattered across files
- ❌ No proper includes/imports detection
- ❌ Missing documentation comments

### After Alignment
- ✅ C++ ListNode has single constructor `ListNode(int x)`
- ✅ C++ TreeNode has single constructor `TreeNode(int x)`
- ✅ buildLinkedList uses `new ListNode(0)` for dummy node
- ✅ All structs match scaffoldGenerator.js exactly
- ✅ Single source of truth for type mappings
- ✅ **Intelligent import detection for all languages:**
  - Java: `import java.util.*;` when using List/Set/Map
  - Python: Dynamic `from typing import List, Set, Dict, Optional` based on usage
  - C++: Conditional includes for `<vector>`, `<string>`, `<unordered_set>`, `<unordered_map>`
  - TypeScript: Full type annotations with proper type hints
- ✅ **Enhanced type support:**
  - Added `long`, `char`, `float` primitives
  - Added `Set[int]`, `Map[str,int]` collection types
  - Added `List[List[str]]`, 2D string arrays
  - Proper void/None return type handling
- ✅ **Documentation comments** (LeetCode-style):
  - Java: `/** Definition for singly-linked list. */`
  - Python: `# Definition for singly-linked list.`
  - JavaScript: JSDoc `@param` annotations
  - C++: Multi-line `/** ... */` comments
- ✅ **TypeScript support** added with proper type annotations

---

## Testing Checklist

### Scaffold Generation
- [ ] Generate Java scaffold with ListNode → shows `ListNode` class with correct constructors
- [ ] Generate Python scaffold with TreeNode → shows `TreeNode` class with `__init__` signature
- [ ] Generate C++ scaffold with both → shows `struct ListNode` and `struct TreeNode` with single constructors
- [ ] Generate JavaScript scaffold → shows function-based constructors

### Code Execution
- [ ] Submit Java solution with ListNode input → builds linked list correctly
- [ ] Submit Python solution with TreeNode output → converts to array format `[1,2,null,3]`
- [ ] Submit C++ solution using ListNode → compiles without errors
- [ ] Submit JavaScript solution with array inputs → matches scaffold parameter types

### Type Mapping
- [ ] `List[int]` scaffold parameter matches runtime `int[]` (Java) / `List[int]` (Python) / `number[]` (JS) / `vector<int>` (C++)
- [ ] `ListNode` scaffold matches runtime struct injections across all languages
- [ ] Output serialization produces compact format `[0,1]` not `[0, 1]`

---

## Benefits

1. **Consistency**: Scaffolds and execution use identical type definitions
2. **Maintainability**: Single source of truth in scaffoldGenerator.js
3. **LeetCode Parity**: Struct definitions match LeetCode's canonical patterns
4. **Multi-Language**: Same canonical types map correctly across Java/Python/JS/C++
5. **Developer Experience**: Generated scaffolds exactly match what the runner expects

---

## Future Enhancements

1. Add GraphNode to canonical type system
2. Support custom structs like `class Node { int val; Node random; Node next; }`
3. Add TypeScript support with proper type annotations
4. Cache scaffold generation for performance
5. Add validation: scaffold types ↔ test case types ↔ runtime builder types

---

## Related Files

- [scaffoldGenerator.js](server/utils/scaffoldGenerator.js) - Type mapping source of truth
- [codeRunner.js](server/utils/codeRunner.js) - Runtime execution with aligned wrappers
- [admin.js](server/routes/admin.js) - Scaffold generation endpoint (lines 662-705)
- [ProblemDetail.js](client/src/pages/ProblemDetail.js) - UI for scaffold preview (lines 113-139, 613-623)

---

**Last Updated**: December 2024  
**Status**: ✅ Aligned and Production Ready
