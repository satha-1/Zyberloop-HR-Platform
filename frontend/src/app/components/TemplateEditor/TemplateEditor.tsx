"use client";

import { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { VisualTemplate, Block, FieldBlock } from './types';
import { Toolbar } from './Toolbar';
import { Toolbox } from './Toolbox/Toolbox';
import { Canvas } from './Canvas/Canvas';
import { PropertiesPanel } from './Properties/PropertiesPanel';
import { serializeToHandlebars } from './utils/serializer';
import { Card } from '../ui/card';

interface TemplateEditorProps {
  template?: VisualTemplate;
  docType: string;
  locale: string;
  onSave: (serialized: { visual: VisualTemplate; handlebars: string; fieldSchema: any }) => void;
  onCancel: () => void;
}

export function TemplateEditor({
  template,
  docType,
  locale,
  onSave,
  onCancel,
}: TemplateEditorProps) {
  const [currentTemplate, setCurrentTemplate] = useState<VisualTemplate>(
    template || createBlankTemplate(docType, locale)
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [undoStack, setUndoStack] = useState<VisualTemplate[]>([]);
  const [redoStack, setRedoStack] = useState<VisualTemplate[]>([]);

  const currentPage = currentTemplate.pages[currentPageIndex];
  const selectedBlock = currentPage.blocks.find((b) => b.id === selectedBlockId);

  const handleBlockUpdate = useCallback((blockId: string, updates: Partial<Block>) => {
    setCurrentTemplate((prev) => {
      const newTemplate = { ...prev };
      const page = newTemplate.pages[currentPageIndex];
      const blockIndex = page.blocks.findIndex((b) => b.id === blockId);
      
      if (blockIndex >= 0) {
        page.blocks = [...page.blocks];
        page.blocks[blockIndex] = { ...page.blocks[blockIndex], ...updates };
      }
      
      return newTemplate;
    });
  }, [currentPageIndex]);

  const handleBlockAdd = useCallback((block: Block) => {
    setCurrentTemplate((prev) => {
      const newTemplate = { ...prev };
      const page = newTemplate.pages[currentPageIndex];
      page.blocks = [...page.blocks, block];
      return newTemplate;
    });
    setSelectedBlockId(block.id);
  }, [currentPageIndex]);

  const handleBlockDelete = useCallback((blockId: string) => {
    setCurrentTemplate((prev) => {
      const newTemplate = { ...prev };
      const page = newTemplate.pages[currentPageIndex];
      page.blocks = page.blocks.filter((b) => b.id !== blockId);
      return newTemplate;
    });
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [currentPageIndex, selectedBlockId]);

  const handleSave = () => {
    const serialized = serializeToHandlebars(currentTemplate);
    onSave(serialized);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Toolbar */}
        <Toolbar
        template={currentTemplate}
        onUpdate={setCurrentTemplate}
        onUndo={() => {
          if (undoStack.length > 0) {
            const prev = undoStack[undoStack.length - 1];
            setRedoStack([currentTemplate, ...redoStack]);
            setCurrentTemplate(prev);
            setUndoStack(undoStack.slice(0, -1));
          }
        }}
        onRedo={() => {
          if (redoStack.length > 0) {
            const next = redoStack[0];
            setUndoStack([...undoStack, currentTemplate]);
            setCurrentTemplate(next);
            setRedoStack(redoStack.slice(1));
          }
        }}
          onSave={handleSave}
          onCancel={onCancel}
        />

        {/* Main Editor Area */}
        <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Toolbox */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <Toolbox
            onFieldAdd={handleBlockAdd}
            currentPage={currentPage}
          />
        </div>

        {/* Center Panel - Canvas */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <Canvas
            page={currentPage}
            selectedBlockId={selectedBlockId}
            onBlockSelect={setSelectedBlockId}
            onBlockUpdate={handleBlockUpdate}
            onBlockDelete={handleBlockDelete}
            onBlockAdd={handleBlockAdd}
          />
        </div>

        {/* Right Panel - Properties */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          {selectedBlock ? (
            <PropertiesPanel
              block={selectedBlock}
              onUpdate={(updates) => handleBlockUpdate(selectedBlock.id, updates)}
            />
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p>Select a field or text block to edit its properties</p>
            </div>
          )}
        </div>
        </div>
      </div>
    </DndProvider>
  );
}

function createBlankTemplate(docType: string, locale: string): VisualTemplate {
  return {
    id: `template_${Date.now()}`,
    name: 'New Template',
    docType: docType as any,
    locale,
    version: 1,
    pages: [
      {
        id: `page_${Date.now()}`,
        pageNumber: 1,
        width: 210,
        height: 297,
        margins: {
          top: 20,
          right: 15,
          bottom: 20,
          left: 15,
        },
        blocks: [],
      },
    ],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current_user',
    },
  };
}
