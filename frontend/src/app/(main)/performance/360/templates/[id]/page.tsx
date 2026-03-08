"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Badge } from "../../../../../components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../../../components/ui/accordion";
import {
  ArrowLeft, Edit, Copy, Trash2, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../../lib/api";

export default function TemplateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    if (!templateId) return;
    setLoading(true);
    try {
      const data = await api.get360Template(templateId);
      setTemplate(data);
    } catch (e: any) {
      toast.error("Failed to load template: " + (e.message || "Unknown error"));
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!templateId) return;
    if (!confirm(`Delete template "${template?.name}"? This action cannot be undone.`)) return;
    try {
      await api.delete360Template(templateId);
      toast.success("Template deleted");
      router.push("/performance/360/templates");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete template");
    }
  };

  const handleDuplicate = async () => {
    if (!templateId) return;
    try {
      await api.duplicate360Template(templateId);
      toast.success("Template duplicated");
      router.push("/performance/360/templates");
    } catch (e: any) {
      toast.error(e.message || "Failed to duplicate template");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">Template not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalQuestions = (template.sections || []).reduce(
    (sum: number, s: any) => sum + (s.questions?.length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-gray-500 mt-0.5 text-sm">360 Feedback Template</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/performance/360/templates/${params.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" /> Duplicate
          </Button>
          <Button variant="outline" onClick={handleDelete} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Template Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Name</div>
              <div className="font-medium">{template.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Reusable</div>
              <Badge variant={template.reusable ? "default" : "secondary"}>
                {template.reusable ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-gray-500">Anonymous</div>
              <Badge variant={template.settings?.anonymous !== false ? "default" : "secondary"}>
                {template.settings?.anonymous !== false ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-gray-500">Min Responses to Show</div>
              <div className="font-medium">{template.settings?.minResponsesToShow || 3}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Sections</div>
              <div className="font-medium">{template.sections?.length || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Questions</div>
              <div className="font-medium">{totalQuestions}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Sections & Questions</CardTitle>
        </CardHeader>
        <CardContent>
          {!template.sections || template.sections.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sections defined.</p>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {template.sections.map((section: any, idx: number) => (
                <AccordionItem key={section.id || idx} value={`section-${idx}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="text-left">
                      <div className="font-medium">{section.title}</div>
                      <div className="text-sm text-gray-500">
                        {section.questions?.length || 0} question{section.questions?.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      {(!section.questions || section.questions.length === 0) ? (
                        <p className="text-gray-500 text-sm">No questions in this section.</p>
                      ) : (
                        section.questions.map((q: any, qIdx: number) => (
                          <div key={q.id || qIdx} className="border-l-2 border-blue-200 pl-4 py-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline">{q.type}</Badge>
                                  {q.required && (
                                    <Badge variant="secondary" className="text-xs">Required</Badge>
                                  )}
                                  {q.type === "LIKERT" && (
                                    <span className="text-xs text-gray-500">
                                      Scale: {q.scaleMin || 1} - {q.scaleMax || 5}
                                    </span>
                                  )}
                                </div>
                                <div className="font-medium">{q.prompt}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
