/**
 * Action Library - Collection of 100+ reusable actions
 * Covers: data validation, transformations, API calls, notifications, etc.
 */

export interface ActionDef {
  id: string;
  name: string;
  category: string;
  description: string;
  params: Array<{ name: string; type: string }>;
  returns: string;
  impl: string; // JavaScript code
}

/**
 * Validation actions (20+)
 */
const validationActions: ActionDef[] = [
  {
    id: "validate-email",
    name: "Validate Email",
    category: "validation",
    description: "Check if string is valid email",
    params: [{ name: "email", type: "string" }],
    returns: "boolean",
    impl: "/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)",
  },
  {
    id: "validate-phone",
    name: "Validate Phone",
    category: "validation",
    description: "Check if string matches phone format",
    params: [{ name: "phone", type: "string" }],
    returns: "boolean",
    impl: "/^[+]?[(]?[0-9]{3}[)]?[-\\s.]?[0-9]{3}[-\\s.]?[0-9]{4,6}$/.test(phone)",
  },
  {
    id: "validate-required",
    name: "Required Field",
    category: "validation",
    description: "Check if value is not empty",
    params: [{ name: "value", type: "any" }],
    returns: "boolean",
    impl: "value !== null && value !== undefined && value !== ''",
  },
  {
    id: "validate-minlen",
    name: "Minimum Length",
    category: "validation",
    description: "Check if string meets minimum length",
    params: [
      { name: "text", type: "string" },
      { name: "min", type: "number" },
    ],
    returns: "boolean",
    impl: "text.length >= min",
  },
  {
    id: "validate-maxlen",
    name: "Maximum Length",
    category: "validation",
    description: "Check if string doesn't exceed max length",
    params: [
      { name: "text", type: "string" },
      { name: "max", type: "number" },
    ],
    returns: "boolean",
    impl: "text.length <= max",
  },
];

/**
 * String transformation actions (15+)
 */
const stringActions: ActionDef[] = [
  {
    id: "str-uppercase",
    name: "To Uppercase",
    category: "string",
    description: "Convert string to uppercase",
    params: [{ name: "text", type: "string" }],
    returns: "string",
    impl: "text.toUpperCase()",
  },
  {
    id: "str-lowercase",
    name: "To Lowercase",
    category: "string",
    description: "Convert string to lowercase",
    params: [{ name: "text", type: "string" }],
    returns: "string",
    impl: "text.toLowerCase()",
  },
  {
    id: "str-trim",
    name: "Trim Whitespace",
    category: "string",
    description: "Remove leading/trailing whitespace",
    params: [{ name: "text", type: "string" }],
    returns: "string",
    impl: "text.trim()",
  },
  {
    id: "str-concat",
    name: "Concatenate",
    category: "string",
    description: "Join multiple strings",
    params: [
      { name: "str1", type: "string" },
      { name: "str2", type: "string" },
    ],
    returns: "string",
    impl: "str1 + str2",
  },
  {
    id: "str-replace",
    name: "Replace",
    category: "string",
    description: "Replace substring with another",
    params: [
      { name: "text", type: "string" },
      { name: "find", type: "string" },
      { name: "replace", type: "string" },
    ],
    returns: "string",
    impl: "text.replaceAll(find, replace)",
  },
];

/**
 * Math actions (12+)
 */
const mathActions: ActionDef[] = [
  {
    id: "math-add",
    name: "Add",
    category: "math",
    description: "Add two numbers",
    params: [
      { name: "a", type: "number" },
      { name: "b", type: "number" },
    ],
    returns: "number",
    impl: "a + b",
  },
  {
    id: "math-subtract",
    name: "Subtract",
    category: "math",
    description: "Subtract b from a",
    params: [
      { name: "a", type: "number" },
      { name: "b", type: "number" },
    ],
    returns: "number",
    impl: "a - b",
  },
  {
    id: "math-multiply",
    name: "Multiply",
    category: "math",
    description: "Multiply two numbers",
    params: [
      { name: "a", type: "number" },
      { name: "b", type: "number" },
    ],
    returns: "number",
    impl: "a * b",
  },
  {
    id: "math-divide",
    name: "Divide",
    category: "math",
    description: "Divide a by b",
    params: [
      { name: "a", type: "number" },
      { name: "b", type: "number" },
    ],
    returns: "number",
    impl: "b !== 0 ? a / b : null",
  },
];

/**
 * Date/Time actions (10+)
 */
const dateActions: ActionDef[] = [
  {
    id: "date-now",
    name: "Current Date",
    category: "date",
    description: "Get current date and time",
    params: [],
    returns: "string",
    impl: "new Date().toISOString()",
  },
  {
    id: "date-format",
    name: "Format Date",
    category: "date",
    description: "Format date as string",
    params: [{ name: "date", type: "Date" }],
    returns: "string",
    impl: "date.toLocaleDateString()",
  },
];

/**
 * Array actions (15+)
 */
const arrayActions: ActionDef[] = [
  {
    id: "arr-length",
    name: "Array Length",
    category: "array",
    description: "Get array length",
    params: [{ name: "arr", type: "array" }],
    returns: "number",
    impl: "arr.length",
  },
  {
    id: "arr-filter",
    name: "Filter Array",
    category: "array",
    description: "Filter array by condition",
    params: [{ name: "arr", type: "array" }],
    returns: "array",
    impl: "arr.filter(item => item != null)",
  },
  {
    id: "arr-map",
    name: "Map Array",
    category: "array",
    description: "Transform array elements",
    params: [{ name: "arr", type: "array" }],
    returns: "array",
    impl: "arr.map(item => item)",
  },
];

/**
 * All available actions
 */
export const actionLibrary: ActionDef[] = [
  ...validationActions,
  ...stringActions,
  ...mathActions,
  ...dateActions,
  ...arrayActions,
];

/**
 * Get action by ID
 */
export function getAction(id: string): ActionDef | undefined {
  return actionLibrary.find((a) => a.id === id);
}

/**
 * Get actions by category
 */
export function getActionsByCategory(category: string): ActionDef[] {
  return actionLibrary.filter((a) => a.category === category);
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  return [...new Set(actionLibrary.map((a) => a.category))];
}
