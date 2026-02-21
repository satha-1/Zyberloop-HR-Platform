// Constants for Template Editor

import { VariableGroup } from './types';

// Available variables grouped by entity
export const VARIABLE_GROUPS: VariableGroup[] = [
  {
    entity: 'employee',
    label: 'Employee Information',
    variables: [
      {
        key: 'employee.fullName',
        label: 'Employee Full Name',
        description: 'First name and last name combined',
        type: 'string',
        category: 'Personal',
      },
      {
        key: 'employee.firstName',
        label: 'First Name',
        description: 'Employee first name',
        type: 'string',
        category: 'Personal',
      },
      {
        key: 'employee.lastName',
        label: 'Last Name',
        description: 'Employee last name',
        type: 'string',
        category: 'Personal',
      },
      {
        key: 'employee.email',
        label: 'Email Address',
        description: 'Employee email address',
        type: 'string',
        category: 'Contact',
      },
      {
        key: 'employee.phone',
        label: 'Phone Number',
        description: 'Employee phone number',
        type: 'string',
        category: 'Contact',
      },
      {
        key: 'employee.employeeCode',
        label: 'Employee Code',
        description: 'Unique employee identifier',
        type: 'string',
        category: 'Employment',
      },
      {
        key: 'employee.grade',
        label: 'Job Grade',
        description: 'Employee job grade/level',
        type: 'string',
        category: 'Employment',
      },
      {
        key: 'employee.salary',
        label: 'Salary',
        description: 'Employee base salary',
        type: 'number',
        category: 'Compensation',
      },
      {
        key: 'employee.hireDate',
        label: 'Hire Date',
        description: 'Employee start date',
        type: 'date',
        category: 'Employment',
      },
      {
        key: 'employee.department.name',
        label: 'Department Name',
        description: 'Employee department',
        type: 'string',
        category: 'Employment',
      },
      {
        key: 'employee.manager.name',
        label: 'Manager Name',
        description: 'Reporting manager full name',
        type: 'string',
        category: 'Employment',
      },
      {
        key: 'employee.address',
        label: 'Address',
        description: 'Employee residential address',
        type: 'string',
        category: 'Personal',
      },
    ],
  },
  {
    entity: 'company',
    label: 'Company Information',
    variables: [
      {
        key: 'company.name',
        label: 'Company Name',
        description: 'Legal company name',
        type: 'string',
        category: 'General',
      },
      {
        key: 'company.address',
        label: 'Company Address',
        description: 'Company registered address',
        type: 'string',
        category: 'General',
      },
      {
        key: 'company.phone',
        label: 'Company Phone',
        description: 'Company contact phone',
        type: 'string',
        category: 'Contact',
      },
      {
        key: 'company.email',
        label: 'Company Email',
        description: 'Company contact email',
        type: 'string',
        category: 'Contact',
      },
      {
        key: 'company.logoUrl',
        label: 'Company Logo',
        description: 'URL to company logo image',
        type: 'string',
        category: 'Branding',
      },
    ],
  },
  {
    entity: 'payroll',
    label: 'Payroll Information',
    variables: [
      {
        key: 'payroll.totals.gross',
        label: 'Gross Salary',
        description: 'Total gross salary for the period',
        type: 'number',
        category: 'Totals',
      },
      {
        key: 'payroll.totals.net',
        label: 'Net Salary',
        description: 'Net salary after deductions',
        type: 'number',
        category: 'Totals',
      },
      {
        key: 'payroll.totals.deductions',
        label: 'Total Deductions',
        description: 'Sum of all deductions',
        type: 'number',
        category: 'Totals',
      },
      {
        key: 'payroll.period.start',
        label: 'Pay Period Start',
        description: 'Payroll period start date',
        type: 'date',
        category: 'Period',
      },
      {
        key: 'payroll.period.end',
        label: 'Pay Period End',
        description: 'Payroll period end date',
        type: 'date',
        category: 'Period',
      },
      {
        key: 'payroll.statutory.epfEmployee',
        label: 'EPF (Employee)',
        description: 'Employee EPF contribution',
        type: 'number',
        category: 'Statutory',
      },
      {
        key: 'payroll.statutory.tax',
        label: 'Income Tax',
        description: 'Income tax deduction',
        type: 'number',
        category: 'Statutory',
      },
    ],
  },
];

// Default text style
export const DEFAULT_TEXT_STYLE = {
  fontSize: 12,
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'normal' as const,
  fontStyle: 'normal' as const,
  textDecoration: 'none' as const,
  textAlign: 'left' as const,
  color: '#000000',
  lineHeight: 1.5,
};

// Default field style
export const DEFAULT_FIELD_STYLE = {
  fontSize: 12,
  fontFamily: 'Arial, sans-serif',
  color: '#0066cc',
  backgroundColor: '#f0f8ff',
  border: {
    width: 1,
    color: '#0066cc',
    style: 'dashed' as const,
  },
  padding: {
    top: 4,
    right: 8,
    bottom: 4,
    left: 8,
  },
};

// Page dimensions (A4 in mm)
export const A4_DIMENSIONS = {
  width: 210,
  height: 297,
  margins: {
    top: 20,
    right: 15,
    bottom: 20,
    left: 15,
  },
};

// Field type icons/labels
export const FIELD_TYPE_CONFIG = {
  text: { label: 'Text', icon: 'Type', description: 'Single-line text input' },
  paragraph: { label: 'Paragraph', icon: 'AlignLeft', description: 'Multi-line text area' },
  checkbox: { label: 'Checkbox', icon: 'Square', description: 'Checkbox option' },
  dropdown: { label: 'Dropdown', icon: 'ChevronDown', description: 'Select from options' },
  date: { label: 'Date', icon: 'Calendar', description: 'Date picker' },
  number: { label: 'Number', icon: 'Hash', description: 'Numeric input' },
  image: { label: 'Image', icon: 'Image', description: 'Image placeholder' },
  signature: { label: 'Signature', icon: 'PenTool', description: 'Signature field' },
  initials: { label: 'Initials', icon: 'FileSignature', description: 'Initials field' },
};
