// Parse Handlebars HTML to Visual Template (backward compatibility)

import { VisualTemplate, Block, TextBlock, FieldBlock, DocType } from '../types';
import { DEFAULT_TEXT_STYLE, DEFAULT_FIELD_STYLE, A4_DIMENSIONS, VARIABLE_GROUPS } from '../constants';
import { generateId } from './helpers';

export function parseHandlebarsToVisual(handlebarsHtml: string, docType: DocType): VisualTemplate {
  // Simple parser - extracts text and Handlebars expressions
  const blocks: Block[] = [];
  let yOffset = 20; // Start after top margin

  // Split by Handlebars expressions
  const handlebarsRegex = /\{\{([^}]+)\}\}/g;
  const parts: Array<{ type: 'text' | 'expression'; content: string; expression?: string }> = [];
  
  let lastIndex = 0;
  let match;
  
  while ((match = handlebarsRegex.exec(handlebarsHtml)) !== null) {
    // Text before expression
    if (match.index > lastIndex) {
      const text = handlebarsHtml.substring(lastIndex, match.index).trim();
      if (text) {
        parts.push({ type: 'text', content: text });
      }
    }
    
    // Expression
    const expression = match[1].trim();
    parts.push({ type: 'expression', content: match[0], expression });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Text after last expression
  if (lastIndex < handlebarsHtml.length) {
    const text = handlebarsHtml.substring(lastIndex).trim();
    if (text) {
      parts.push({ type: 'text', content: text });
    }
  }

  // If no expressions found, treat entire content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content: handlebarsHtml });
  }

  // Convert parts to blocks
  for (const part of parts) {
    if (part.type === 'text') {
      // Remove HTML tags for now (simple approach)
      const textContent = part.content.replace(/<[^>]*>/g, '').trim();
      if (textContent) {
        blocks.push({
          id: generateId('text'),
          type: 'text',
          content: textContent,
          position: { x: 0, y: yOffset },
          style: DEFAULT_TEXT_STYLE,
        });
        yOffset += 20; // Approximate line height
      }
    } else if (part.type === 'expression' && part.expression) {
      // Map expression to field
      const field = mapHandlebarsExpressionToField(part.expression);
      blocks.push({
        id: generateId('field'),
        type: 'field',
        fieldKey: field.key,
        fieldType: field.type,
        position: { x: 0, y: yOffset, width: 100, height: 30 },
        label: field.label,
        dataSource: field.dataSource,
        settings: field.settings,
        style: DEFAULT_FIELD_STYLE,
      });
      yOffset += 35;
    }
  }

  return {
    id: generateId('template'),
    name: 'Imported Template',
    docType,
    locale: 'en',
    version: 1,
    pages: [
      {
        id: generateId('page'),
        pageNumber: 1,
        width: A4_DIMENSIONS.width,
        height: A4_DIMENSIONS.height,
        margins: A4_DIMENSIONS.margins,
        blocks,
      },
    ],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
    },
  };
}

function mapHandlebarsExpressionToField(expression: string): {
  key: string;
  type: FieldBlock['fieldType'];
  label: string;
  dataSource: FieldBlock['dataSource'];
  settings: FieldBlock['settings'];
} {
  // Parse expression like "employee.fullName" or "custom.field_1"
  const parts = expression.split('.');
  
  if (parts[0] === 'custom') {
    // Manual field
    return {
      key: parts.slice(1).join('.') || 'custom_field',
      type: 'text',
      label: parts.slice(1).join(' ').replace(/_/g, ' ') || 'Custom Field',
      dataSource: {
        type: 'manual',
        prompt: `Enter ${parts.slice(1).join(' ')}`,
      },
      settings: {
        required: false,
      },
    };
  } else {
    // Auto field - find in variable groups
    for (const group of VARIABLE_GROUPS) {
      const variable = group.variables.find((v) => v.key === expression);
      if (variable) {
        return {
          key: variable.key.split('.').pop() || 'field',
          type: getFieldTypeFromVariableType(variable.type),
          label: variable.label,
          dataSource: {
            type: 'auto',
            entity: group.entity,
            field: variable.key.split('.').pop(),
            handlebarsExpression: `{{${variable.key}}}`,
          },
          settings: {
            required: false,
          },
        };
      }
    }
    
    // Fallback
    return {
      key: parts.pop() || 'field',
      type: 'text',
      label: parts.join(' ').replace(/_/g, ' ') || 'Field',
      dataSource: {
        type: 'auto',
        entity: parts[0] as any,
        field: parts[1],
        handlebarsExpression: `{{${expression}}}`,
      },
      settings: {
        required: false,
      },
    };
  }
}

function getFieldTypeFromVariableType(type: string): FieldBlock['fieldType'] {
  switch (type) {
    case 'number':
      return 'number';
    case 'date':
      return 'date';
    case 'boolean':
      return 'checkbox';
    default:
      return 'text';
  }
}
