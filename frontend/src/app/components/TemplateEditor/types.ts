// Type definitions for Visual Template Editor

export type DocType = 'OFFER_LETTER' | 'APPOINTMENT_LETTER' | 'PAYSLIP' | 'FINAL_SETTLEMENT' | 'EXPERIENCE_CERT';

export type FieldType = 
  | 'text'
  | 'paragraph'
  | 'checkbox'
  | 'dropdown'
  | 'date'
  | 'number'
  | 'image'
  | 'signature'
  | 'initials';

export interface VisualTemplate {
  id: string;
  name: string;
  docType: DocType;
  locale: string;
  version: number;
  pages: Page[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  };
}

export interface Page {
  id: string;
  pageNumber: number;
  width: number; // mm
  height: number; // mm
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  blocks: Block[];
}

export type Block = TextBlock | FieldBlock;

export interface TextBlock {
  id: string;
  type: 'text';
  content: string; // Rich text HTML
  position: {
    x: number; // mm
    y: number; // mm
  };
  style: TextStyle;
}

export interface TextStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  color: string;
  lineHeight: number;
}

export interface FieldBlock {
  id: string;
  type: 'field';
  fieldKey: string;
  fieldType: FieldType;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  label: string;
  dataSource: DataSource;
  settings: FieldSettings;
  style: FieldStyle;
}

export interface DataSource {
  type: 'auto' | 'manual';
  entity?: 'employee' | 'company' | 'payroll' | 'termination' | 'custom';
  field?: string;
  handlebarsExpression?: string;
  prompt?: string;
  validation?: ValidationRules;
}

export interface ValidationRules {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface FieldSettings {
  required: boolean;
  tooltip?: string;
  defaultValue?: any;
  maxLength?: number;
  placeholder?: string;
  min?: number;
  max?: number;
  decimalPlaces?: number;
  format?: 'currency' | 'number' | 'percentage';
  dateFormat?: string;
  defaultDate?: 'today' | 'employee_start_date' | string;
  options?: Array<{ label: string; value: string }>;
  defaultOption?: string;
  defaultChecked?: boolean;
  signer?: 'employee' | 'hr' | 'manager' | 'other';
  signerRole?: string;
  imageSource?: 'static' | 'dynamic';
  staticImageUrl?: string;
  dynamicImagePath?: string;
}

export interface FieldStyle {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  border?: {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface VariableGroup {
  entity: 'employee' | 'company' | 'payroll' | 'termination' | 'custom';
  label: string;
  variables: Variable[];
}

export interface Variable {
  key: string;
  label: string;
  description: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'object';
  category?: string;
}

export interface SerializedTemplate {
  visual: VisualTemplate;
  handlebars: string;
  fieldSchema: FieldSchema;
}

export interface FieldSchema {
  autoFields: Array<{
    fieldKey: string;
    handlebarsExpression: string;
    entity: string;
    field: string;
  }>;
  manualFields: Array<{
    fieldKey: string;
    label: string;
    type: FieldType;
    settings: FieldSettings;
  }>;
}
