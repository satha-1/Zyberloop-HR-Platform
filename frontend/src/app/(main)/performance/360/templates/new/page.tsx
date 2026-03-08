"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Textarea } from "../../../../../components/ui/textarea";
import { Checkbox } from "../../../../../components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../../../components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import {
  Plus, Trash2, ArrowLeft, Save, Loader2, GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../../lib/api";

interface Section {
  id: string;
  title: string;
  order: number;
  questions: Question[];
}

interface Question {
  id: string;
  type: "LIKERT" | "TEXT";
  prompt: string;
  required: boolean;
  scaleMin: number;
  scaleMax: number;
  order: number;
}

export default function NewTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cycleId = searchParams.get("cycleId");
  const templateId = searchParams.get("id"); // For edit mode

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    reusable: false,
    anonymous: true,
    minResponsesToShow: 3,
    sections: [] as Section[],
  });

  useEffect(() => {
    if (templateId) loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const template: any = await api.get360Template(templateId!);
      setFormData({
        name: template.name,
        reusable: template.reusable || false,
        anonymous: template.settings?.anonymous !== false,
        minResponsesToShow: template.settings?.minResponsesToShow || 3,
        sections: (template.sections || []).map((s: any, idx: number) => ({
          id: s.id || `section-${idx}`,
          title: s.title,
          order: s.order || idx,
          questions: (s.questions || []).map((q: any, qidx: number) => ({
            id: q.id || `q-${idx}-${qidx}`,
            type: q.type,
            prompt: q.prompt,
            required: q.required || false,
            scaleMin: q.scaleMin || 1,
            scaleMax: q.scaleMax || 5,
            order: q.order || qidx,
          })),
        })),
      });
    } catch (e: any) {
      toast.error("Failed to load template: " + (e.message || "Unknown error"));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addSection = () => {
    const newSection: Section = {
      id: generateId(),
      title: `Section ${formData.sections.length + 1}`,
      order: formData.sections.length,
      questions: [],
    };
    setFormData({
      ...formData,
      sections: [...formData.sections, newSection],
    });
  };

  const removeSection = (sectionId: string) => {
    setFormData({
      ...formData,
      sections: formData.sections.filter((s) => s.id !== sectionId),
    });
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setFormData({
      ...formData,
      sections: formData.sections.map((s) =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    });
  };

  const addQuestion = (sectionId: string) => {
    const section = formData.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const newQuestion: Question = {
      id: generateId(),
      type: "LIKERT",
      prompt: "",
      required: false,
      scaleMin: 1,
      scaleMax: 5,
      order: section.questions.length,
    };
    updateSection(sectionId, {
      questions: [...section.questions, newQuestion],
    });
  };

  const removeQuestion = (sectionId: string, questionId: string) => {
    const section = formData.sections.find((s) => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, {
      questions: section.questions.filter((q) => q.id !== questionId),
    });
  };

  const updateQuestion = (
    sectionId: string,
    questionId: string,
    updates: Partial<Question>
  ) => {
    const section = formData.sections.find((s) => s.id === sectionId);
    if (!section) return;
    updateSection(sectionId, {
      questions: section.questions.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q
      ),
    });
  };

  const validate = (): string | null => {
    if (!formData.name.trim()) return "Template name is required";
    if (formData.sections.length === 0) return "At least one section is required";
    for (const section of formData.sections) {
      if (!section.title.trim()) return `Section "${section.title}" must have a title`;
      if (section.questions.length === 0) {
        return `Section "${section.title}" must have at least one question`;
      }
      for (const q of section.questions) {
        if (!q.prompt.trim()) return "All questions must have a prompt";
        if (q.type === "LIKERT" && q.scaleMin >= q.scaleMax) {
          return "LIKERT questions must have scaleMin < scaleMax";
        }
      }
    }
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        reusable: formData.reusable,
        settings: {
          anonymous: formData.anonymous,
          minResponsesToShow: formData.minResponsesToShow,
        },
        sections: formData.sections.map((s, idx) => ({
          id: s.id,
          title: s.title,
          order: idx,
          questions: s.questions.map((q, qidx) => ({
            id: q.id,
            type: q.type,
            prompt: q.prompt,
            required: q.required,
            scaleMin: q.type === "LIKERT" ? q.scaleMin : undefined,
            scaleMax: q.type === "LIKERT" ? q.scaleMax : undefined,
            order: qidx,
          })),
        })),
      };

      if (templateId) {
        await api.update360Template(templateId, payload);
        toast.success("Template updated");
      } else {
        if (!cycleId) {
          toast.error("Cycle ID is required");
          return;
        }
        await api.create360Template(cycleId, payload);
        toast.success("Template created");
      }
      router.push(`/performance/360/templates?cycleId=${cycleId || ""}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {templateId ? "Edit Template" : "New Template"}
            </h1>
            <p className="text-gray-500 mt-0.5 text-sm">
              Build a 360-degree feedback questionnaire
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Template
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Standard 360 Feedback Q1 2024"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="reusable"
              checked={formData.reusable}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, reusable: checked === true })
              }
            />
            <Label htmlFor="reusable" className="cursor-pointer">
              Reusable across cycles
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="anonymous"
              checked={formData.anonymous}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, anonymous: checked === true })
              }
            />
            <Label htmlFor="anonymous" className="cursor-pointer">
              Anonymous feedback (raters' identities hidden)
            </Label>
          </div>
          <div>
            <Label htmlFor="minResponses">Minimum Responses to Show Aggregate</Label>
            <Input
              id="minResponses"
              type="number"
              min="1"
              value={formData.minResponsesToShow}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minResponsesToShow: parseInt(e.target.value) || 3,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Sections */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sections & Questions</CardTitle>
          <Button variant="outline" size="sm" onClick={addSection}>
            <Plus className="h-4 w-4 mr-2" /> Add Section
          </Button>
        </CardHeader>
        <CardContent>
          {formData.sections.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No sections yet. Add your first section to get started.</p>
              <Button variant="outline" className="mt-4" onClick={addSection}>
                <Plus className="h-4 w-4 mr-2" /> Add Section
              </Button>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {formData.sections.map((section, sectionIdx) => (
                <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <div className="text-left">
                        <div className="font-medium">{section.title || `Section ${sectionIdx + 1}`}</div>
                        <div className="text-sm text-gray-500">
                          {section.questions.length} question{section.questions.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label>Section Title *</Label>
                        <Input
                          value={section.title}
                          onChange={(e) =>
                            updateSection(section.id, { title: e.target.value })
                          }
                          placeholder="e.g., Performance, Collaboration"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Questions</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addQuestion(section.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add Question
                          </Button>
                        </div>

                        {section.questions.map((question, qIdx) => (
                          <Card key={question.id} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 space-y-3">
                                  <div>
                                    <Label>Question Type</Label>
                                    <Select
                                      value={question.type}
                                      onValueChange={(value: "LIKERT" | "TEXT") =>
                                        updateQuestion(section.id, question.id, {
                                          type: value,
                                          scaleMin: value === "LIKERT" ? 1 : undefined,
                                          scaleMax: value === "LIKERT" ? 5 : undefined,
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="LIKERT">Likert Scale (Rating)</SelectItem>
                                        <SelectItem value="TEXT">Text Response</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Question Prompt *</Label>
                                    <Textarea
                                      value={question.prompt}
                                      onChange={(e) =>
                                        updateQuestion(section.id, question.id, {
                                          prompt: e.target.value,
                                        })
                                      }
                                      placeholder="e.g., How effectively does this person communicate?"
                                      rows={2}
                                    />
                                  </div>
                                  {question.type === "LIKERT" && (
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label>Scale Min</Label>
                                        <Input
                                          type="number"
                                          value={question.scaleMin}
                                          onChange={(e) =>
                                            updateQuestion(section.id, question.id, {
                                              scaleMin: parseInt(e.target.value) || 1,
                                            })
                                          }
                                        />
                                      </div>
                                      <div>
                                        <Label>Scale Max</Label>
                                        <Input
                                          type="number"
                                          value={question.scaleMax}
                                          onChange={(e) =>
                                            updateQuestion(section.id, question.id, {
                                              scaleMax: parseInt(e.target.value) || 5,
                                            })
                                          }
                                        />
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={question.required}
                                      onCheckedChange={(checked) =>
                                        updateQuestion(section.id, question.id, {
                                          required: checked === true,
                                        })
                                      }
                                    />
                                    <Label className="cursor-pointer">Required</Label>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeQuestion(section.id, question.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}

                        {section.questions.length === 0 && (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No questions yet. Add your first question.
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                  <div className="flex items-center justify-end gap-2 pb-4 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(section.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Remove Section
                    </Button>
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
