# Visual Template Editor - Design Specification

## Overview

A DocHub-style WYSIWYG template editor that allows HR users to visually design document templates without writing Handlebars code. The editor maintains Handlebars compatibility behind the scenes for backend document generation.

## UX/UI Layout

### Main Editor Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Toolbar: Bold | Italic | Underline | Align | Font Size | Undo | Redo] │
├──────────┬──────────────────────────────────────────────┬───────────────┤
│          │                                              │               │
│ TOOLBOX  │           CANVAS (Page Editor)              │  PROPERTIES   │
│          │                                              │               │
│ [Text]   │  ┌──────────────────────────────────────┐   │ Field Settings│
│ [Para]   │  │                                      │   │               │
│ [Check]  │  │  Document Content (Editable)        │   │ Label:        │
│ [Select] │  │                                      │   │ [Employee...] │
│ [Date]   │  │  Dear [Employee Full Name],          │   │               │
│ [Number] │  │                                      │   │ Data Source:  │
│ [Image]  │  │  We are pleased to offer...          │   │ ○ Auto-fill   │
│ [Sign]   │  │                                      │   │ ○ Manual      │
│ [Init]   │  │  [Signature Field]                   │   │               │
│          │  │                                      │   │ Type: Text    │
│ [Vars]   │  └──────────────────────────────────────┘   │ Required: Yes │
│          │                                              │               │
│          │  [Page 1] [Page 2] [Add Page]               │               │
│          │                                              │               │
└──────────┴──────────────────────────────────────────────┴───────────────┘
```

### Three-Panel Layout

1. **Left Panel - Toolbox** (250px width)
   - Draggable field types
   - Variables panel (collapsible)
   - Page navigation

2. **Center Panel - Canvas** (flexible, ~60% width)
   - Page preview (A4 size, scrollable)
   - Click-to-edit text
   - Drag-and-drop field placement
   - Visual field indicators (chips/badges)

3. **Right Panel - Properties** (300px width)
   - Field settings form
   - Data source selection
   - Type-specific options

## Component Architecture

### React Component Structure

```
TemplateEditor/
├── TemplateEditor.tsx (Main container)
├── Toolbar.tsx (Formatting toolbar)
├── Toolbox/
│   ├── Toolbox.tsx
│   ├── FieldButton.tsx (Draggable field buttons)
│   └── VariablesPanel.tsx (Variable picker)
├── Canvas/
│   ├── Canvas.tsx (Main canvas container)
│   ├── Page.tsx (Single page renderer)
│   ├── EditableText.tsx (Rich text editor)
│   ├── FieldChip.tsx (Visual field placeholder)
│   └── FieldOverlay.tsx (Selected field highlight)
├── Properties/
│   ├── PropertiesPanel.tsx
│   ├── FieldSettings.tsx
│   ├── DataSourceSelector.tsx
│   └── TypeSpecificSettings.tsx
└── utils/
    ├── templateSerializer.ts (Visual → Handlebars)
    ├── templateParser.ts (Handlebars → Visual)
    └── fieldMapper.ts (Field mapping logic)
```

## Data Model

### TypeScript Interfaces

```typescript
// Core Template Structure
interface VisualTemplate {
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

// Page Structure
interface Page {
  id: string;
  pageNumber: number;
  width: number; // e.g., 210mm for A4
  height: number; // e.g., 297mm for A4
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  blocks: Block[];
}

// Block Types (Text or Field)
type Block = TextBlock | FieldBlock;

// Text Block (Rich text content)
interface TextBlock {
  id: string;
  type: 'text';
  content: string; // Rich text (HTML or structured format)
  position: {
    x: number;
    y: number;
  };
  style: TextStyle;
}

interface TextStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  color: string;
  lineHeight: number;
}

// Field Block (Placeholder/Input)
interface FieldBlock {
  id: string;
  type: 'field';
  fieldKey: string; // Unique identifier, e.g., "employee_full_name"
  fieldType: FieldType;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  label: string; // Display label, e.g., "Employee Full Name"
  dataSource: DataSource;
  settings: FieldSettings;
  style: FieldStyle;
}

type FieldType = 
  | 'text'
  | 'paragraph'
  | 'checkbox'
  | 'dropdown'
  | 'date'
  | 'number'
  | 'image'
  | 'signature'
  | 'initials';

// Data Source Configuration
interface DataSource {
  type: 'auto' | 'manual';
  // For auto-fill fields
  entity?: 'employee' | 'company' | 'payroll' | 'termination';
  field?: string; // e.g., "fullName", "salary"
  handlebarsExpression?: string; // e.g., "{{employee.fullName}}"
  // For manual fields
  prompt?: string; // Question shown during generation
  validation?: ValidationRules;
}

// Field Settings (Type-specific)
interface FieldSettings {
  // Common
  required: boolean;
  tooltip?: string;
  defaultValue?: any;
  
  // Text/Paragraph
  maxLength?: number;
  placeholder?: string;
  
  // Number
  min?: number;
  max?: number;
  decimalPlaces?: number;
  format?: 'currency' | 'number' | 'percentage';
  
  // Date
  dateFormat?: string; // e.g., "DD MMM YYYY"
  defaultDate?: 'today' | 'employee_start_date' | string;
  
  // Dropdown
  options?: Array<{ label: string; value: string }>;
  defaultOption?: string;
  
  // Checkbox
  defaultChecked?: boolean;
  
  // Signature/Initials
  signer?: 'employee' | 'hr' | 'manager' | 'other';
  signerRole?: string;
  
  // Image
  imageSource?: 'static' | 'dynamic';
  staticImageUrl?: string;
  dynamicImagePath?: string; // e.g., "company.logoUrl"
}

interface FieldStyle {
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

// Available Variables Schema
interface VariableGroup {
  entity: 'employee' | 'company' | 'payroll' | 'termination' | 'custom';
  label: string; // e.g., "Employee Information"
  variables: Variable[];
}

interface Variable {
  key: string; // e.g., "employee.fullName"
  label: string; // e.g., "Employee Full Name"
  description: string; // e.g., "First name and last name combined"
  type: 'string' | 'number' | 'date' | 'boolean' | 'object';
  category?: string; // e.g., "Personal", "Employment"
}

// Template Serialization
interface SerializedTemplate {
  // Visual representation (for editor)
  visual: VisualTemplate;
  // Compiled Handlebars (for backend)
  handlebars: string;
  // Field schema (for generation form)
  fieldSchema: FieldSchema;
}

interface FieldSchema {
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
```

## Conversion Logic

### Visual Layout → Handlebars HTML

```typescript
function serializeToHandlebars(visualTemplate: VisualTemplate): string {
  let html = '<!DOCTYPE html><html><head><style>/* Print styles */</style></head><body>';
  
  for (const page of visualTemplate.pages) {
    html += `<div class="page" style="width: ${page.width}mm; height: ${page.height}mm;">`;
    
    // Sort blocks by position (top to bottom, left to right)
    const sortedBlocks = [...page.blocks].sort((a, b) => {
      if (a.position.y !== b.position.y) return a.position.y - b.position.y;
      return a.position.x - b.position.x;
    });
    
    for (const block of sortedBlocks) {
      if (block.type === 'text') {
        // Render rich text with inline styles
        html += `<div style="position: absolute; left: ${block.position.x}mm; top: ${block.position.y}mm;">`;
        html += applyTextStyles(block.content, block.style);
        html += '</div>';
      } else if (block.type === 'field') {
        // Render field as Handlebars expression
        html += `<div style="position: absolute; left: ${block.position.x}mm; top: ${block.position.y}mm; width: ${block.position.width}mm; height: ${block.position.height}mm;">`;
        
        if (block.dataSource.type === 'auto') {
          // Use the handlebars expression
          html += block.dataSource.handlebarsExpression || `{{${block.fieldKey}}}`;
        } else {
          // Manual field - use custom namespace
          html += `{{custom.${block.fieldKey}}}`;
        }
        
        html += '</div>';
      }
    }
    
    html += '</div>';
  }
  
  html += '</body></html>';
  return html;
}
```

### Handlebars HTML → Visual Layout (Backward Compatibility)

```typescript
function parseHandlebarsToVisual(handlebarsHtml: string, docType: DocType): VisualTemplate {
  // Parse HTML and extract Handlebars expressions
  const parser = new DOMParser();
  const doc = parser.parseFromString(handlebarsHtml, 'text/html');
  
  const blocks: Block[] = [];
  let yOffset = 0;
  
  // Traverse DOM and create blocks
  function traverseNode(node: Node, parentY: number = 0) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        blocks.push({
          id: generateId(),
          type: 'text',
          content: text,
          position: { x: 0, y: parentY },
          style: defaultTextStyle,
        });
        yOffset += 20; // Approximate line height
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const text = element.textContent?.trim();
      
      // Check for Handlebars expressions
      const handlebarsRegex = /\{\{([^}]+)\}\}/g;
      const matches = [...text.matchAll(handlebarsRegex)];
      
      if (matches.length > 0) {
        // Split text and create blocks
        let lastIndex = 0;
        for (const match of matches) {
          // Text before expression
          if (match.index! > lastIndex) {
            const beforeText = text.substring(lastIndex, match.index);
            if (beforeText.trim()) {
              blocks.push({
                id: generateId(),
                type: 'text',
                content: beforeText,
                position: { x: 0, y: yOffset },
                style: defaultTextStyle,
              });
              yOffset += 20;
            }
          }
          
          // Field block for expression
          const expression = match[1];
          const field = mapHandlebarsToField(expression, docType);
          blocks.push({
            id: generateId(),
            type: 'field',
            fieldKey: field.key,
            fieldType: field.type,
            position: { x: 0, y: yOffset, width: 50, height: 20 },
            label: field.label,
            dataSource: field.dataSource,
            settings: field.settings,
            style: defaultFieldStyle,
          });
          yOffset += 25;
          
          lastIndex = match.index! + match[0].length;
        }
        
        // Text after last expression
        if (lastIndex < text.length) {
          const afterText = text.substring(lastIndex);
          if (afterText.trim()) {
            blocks.push({
              id: generateId(),
              type: 'text',
              content: afterText,
              position: { x: 0, y: yOffset },
              style: defaultTextStyle,
            });
            yOffset += 20;
          }
        }
      } else if (text) {
        // Regular text block
        blocks.push({
          id: generateId(),
          type: 'text',
          content: text,
          position: { x: 0, y: yOffset },
          style: defaultTextStyle,
        });
        yOffset += 20;
      }
      
      // Recursively process children
      for (const child of Array.from(element.childNodes)) {
        traverseNode(child, yOffset);
      }
    }
  }
  
  traverseNode(doc.body);
  
  return {
    id: generateId(),
    name: 'Imported Template',
    docType,
    locale: 'en',
    version: 1,
    pages: [{
      id: generateId(),
      pageNumber: 1,
      width: 210, // A4 width in mm
      height: 297, // A4 height in mm
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      blocks,
    }],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    },
  };
}
```

## Recommended Libraries

### 1. Rich Text Editing
- **TipTap** (recommended) - Modern, extensible, Vue/React compatible
  - Pros: Excellent API, plugin system, collaborative editing support
  - Alternative: **Slate.js** (more control, steeper learning curve)
  - Alternative: **Draft.js** (Facebook, but less maintained)

### 2. Canvas/Document Rendering
- **react-pdf** / **@react-pdf/renderer** - Render PDFs in React
  - For preview only (not editing)
- **pdf-lib** - PDF manipulation (for importing existing PDFs)
- **mammoth** - Convert DOCX to HTML (for importing Word templates)
- **html2pdf.js** or **jsPDF** - Client-side PDF generation (for preview)

### 3. Drag and Drop
- **@dnd-kit/core** (recommended) - Modern, accessible, performant
  - Pros: Better than react-dnd, TypeScript-first, touch support
  - Alternative: **react-beautiful-dnd** (Atlassian, but less maintained)

### 4. Layout/Positioning
- **react-rnd** - Resizable and draggable components
- **react-grid-layout** - Grid-based layout (optional, for snapping)

### 5. Handlebars
- **handlebars** - Template compilation
- **handlebars-helpers** - Additional helpers

## Implementation Plan

### Phase 1: Core Editor
1. Set up three-panel layout
2. Implement basic text editing (TipTap)
3. Create field toolbox with draggable items
4. Implement field placement on canvas

### Phase 2: Field Management
1. Build properties panel
2. Implement data source selector
3. Create variable picker
4. Add type-specific settings

### Phase 3: Serialization
1. Implement visual → Handlebars conversion
2. Implement Handlebars → visual parsing (backward compatibility)
3. Add field schema generation

### Phase 4: Advanced Features
1. Multi-page support
2. Import DOCX/PDF
3. Undo/redo
4. Grid/snapping
5. Zoom controls

## Example User Flow

### Creating an Offer Letter Template

1. **User clicks "New Template"**
   - Selects: Document Type = "OFFER_LETTER", Locale = "en"
   - Clicks "Create"

2. **Editor opens with blank page**
   - User types: "Dear"
   - Clicks Variables panel → Employee → Full Name
   - Visual chip appears: `[Employee Full Name]`
   - User continues typing: ", we are pleased to offer..."

3. **User adds salary field**
   - Drags "Number" field from toolbox
   - Drops it after "Your starting salary will be"
   - Properties panel opens
   - Sets:
     - Label: "Starting Salary"
     - Data Source: Auto-fill → Employee → Salary
     - Format: Currency
   - Field appears as: `[Starting Salary: LKR 50,000]` (preview value)

4. **User adds signature**
   - Drags "Signature" field to bottom
   - Sets signer: "Employee"
   - Field appears as signature box placeholder

5. **User saves template**
   - System converts visual layout to Handlebars
   - Stores both representations
   - Template ready for document generation

## Field Mapping Examples

| User Action | Visual Display | Handlebars Expression |
|------------|---------------|----------------------|
| Insert Employee Full Name | `[Employee Full Name]` | `{{employee.fullName}}` |
| Insert Company Logo | `[Company Logo]` | `<img src="{{company.logoUrl}}" />` |
| Add Manual Text Field | `[Special Conditions]` | `{{custom.special_conditions}}` |
| Add Signature | `[Signature: Employee]` | `{{signature.employee}}` |
| Add Date Field | `[Start Date]` | `{{employee.hireDate \| date "DD MMM YYYY"}}` |

## Next Steps

1. Create initial React component structure
2. Set up TipTap editor
3. Implement drag-and-drop field placement
4. Build properties panel
5. Create serialization utilities
6. Add variable picker
7. Test with real templates
