// Serialize visual template to Handlebars HTML

import { VisualTemplate, SerializedTemplate, FieldSchema } from '../types';

export function serializeToHandlebars(visualTemplate: VisualTemplate): SerializedTemplate {
  const handlebars = generateHandlebarsHTML(visualTemplate);
  const fieldSchema = generateFieldSchema(visualTemplate);

  return {
    visual: visualTemplate,
    handlebars,
    fieldSchema,
  };
}

function generateHandlebarsHTML(template: VisualTemplate): string {
  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 0;
      size: A4;
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
    .page {
      width: 210mm;
      height: 297mm;
      position: relative;
      page-break-after: always;
      background: white;
    }
    .text-block {
      position: absolute;
    }
    .field-block {
      position: absolute;
      border: 1px dashed #0066cc;
      background: #f0f8ff;
      padding: 4px 8px;
      color: #0066cc;
      font-weight: 500;
    }
  </style>
</head>
<body>`;

  for (const page of template.pages) {
    html += `<div class="page" style="width: ${page.width}mm; height: ${page.height}mm; padding: ${page.margins.top}mm ${page.margins.right}mm ${page.margins.bottom}mm ${page.margins.left}mm;">`;

    // Sort blocks by position (top to bottom, left to right)
    const sortedBlocks = [...page.blocks].sort((a, b) => {
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y;
      }
      return a.position.x - b.position.x;
    });

    for (const block of sortedBlocks) {
      if (block.type === 'text') {
        html += `<div class="text-block" style="position: absolute; left: ${block.position.x}mm; top: ${block.position.y}mm; ${generateTextStyle(block.style)}">`;
        html += escapeHtml(block.content);
        html += '</div>';
      } else if (block.type === 'field') {
        html += `<div class="field-block" style="position: absolute; left: ${block.position.x}mm; top: ${block.position.y}mm; width: ${block.position.width}mm; height: ${block.position.height}mm;">`;

        if (block.dataSource.type === 'auto' && block.dataSource.handlebarsExpression) {
          html += block.dataSource.handlebarsExpression;
        } else if (block.dataSource.type === 'auto' && block.dataSource.entity && block.dataSource.field) {
          html += `{{${block.dataSource.entity}.${block.dataSource.field}}}`;
        } else {
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

function generateTextStyle(style: any): string {
  return `
    font-size: ${style.fontSize}pt;
    font-family: ${style.fontFamily};
    font-weight: ${style.fontWeight};
    font-style: ${style.fontStyle};
    text-decoration: ${style.textDecoration};
    text-align: ${style.textAlign};
    color: ${style.color};
    line-height: ${style.lineHeight};
  `.trim();
}

function generateFieldSchema(template: VisualTemplate): FieldSchema {
  const autoFields: FieldSchema['autoFields'] = [];
  const manualFields: FieldSchema['manualFields'] = [];

  for (const page of template.pages) {
    for (const block of page.blocks) {
      if (block.type === 'field') {
        if (block.dataSource.type === 'auto') {
          const handlebarsExpression =
            block.dataSource.handlebarsExpression ||
            (block.dataSource.entity && block.dataSource.field
              ? `{{${block.dataSource.entity}.${block.dataSource.field}}}`
              : `{{${block.fieldKey}}}`);

          autoFields.push({
            fieldKey: block.fieldKey,
            handlebarsExpression,
            entity: block.dataSource.entity || 'custom',
            field: block.dataSource.field || block.fieldKey,
          });
        } else {
          manualFields.push({
            fieldKey: block.fieldKey,
            label: block.label,
            type: block.fieldType,
            settings: block.settings,
          });
        }
      }
    }
  }

  return { autoFields, manualFields };
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
