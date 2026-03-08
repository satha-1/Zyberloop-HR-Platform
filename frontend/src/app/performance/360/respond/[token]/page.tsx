"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Checkbox } from "../../../../components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../../components/ui/accordion";
import {
  Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../lib/api";

export default function RespondPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});

  useEffect(() => {
    if (token) {
      loadForm();
    }
  }, [token]);

  const loadForm = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data: any = await api.get360ResponseForm(token);
      setFormData(data);
      
      // Mark as opened
      try {
        await api.mark360Opened(token);
      } catch (e) {
        // Non-blocking
      }

      // Initialize answers
      const initialAnswers: Record<string, string | number> = {};
      if (data.template?.sections) {
        for (const section of data.template.sections) {
          for (const question of section.questions || []) {
            initialAnswers[question.id] = question.type === "LIKERT" ? 0 : "";
          }
        }
      }
      setAnswers(initialAnswers);
    } catch (e: any) {
      toast.error("Invalid or expired token. Please contact the sender.");
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!token) return;
    
    // Validate required questions
    if (formData?.template?.sections) {
      for (const section of formData.template.sections) {
        for (const question of section.questions || []) {
          if (question.required) {
            const answer = answers[question.id];
            if (!answer || (question.type === "LIKERT" && answer === 0) || (question.type === "TEXT" && !answer.toString().trim())) {
              toast.error(`Please answer the required question: ${question.prompt}`);
              return;
            }
          }
        }
      }
    }

    setSubmitting(true);
    try {
      const answerArray = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      await api.submit360Response(token, { answers: answerArray });
      setSubmitted(true);
      toast.success("Thank you! Your feedback has been submitted.");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateAnswer = (questionId: string, value: string | number) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading feedback form...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-4">
              Your feedback has been successfully submitted.
            </p>
            <p className="text-sm text-gray-500">
              You can close this page now.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invalid Link</h2>
            <p className="text-gray-600">
              This feedback link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const targetEmployee = formData.assignment?.targetEmployeeId;
  const targetName = targetEmployee
    ? `${targetEmployee.firstName} ${targetEmployee.lastName}`
    : "Employee";
  const rater = formData.rater;
  const template = formData.template;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">360-Degree Feedback</CardTitle>
            <div className="text-sm text-gray-600 mt-2">
              <p>
                You are providing feedback for: <strong>{targetName}</strong>
              </p>
              {rater && (
                <p className="mt-1">
                  Your role: <strong>{rater.roleType.replace(/_/g, " ")}</strong>
                </p>
              )}
              {formData.assignment?.deadlineAt && (
                <p className="mt-1 text-orange-600">
                  Deadline: {new Date(formData.assignment.deadlineAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!template || !template.sections || template.sections.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No questions available.</p>
            ) : (
              <div className="space-y-6">
                <Accordion type="multiple" className="space-y-4">
                  {template.sections.map((section: any, idx: number) => (
                    <AccordionItem
                      key={section.id || idx}
                      value={`section-${idx}`}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="text-left">
                          <div className="font-medium">{section.title}</div>
                          <div className="text-sm text-gray-500">
                            {section.questions?.length || 0} question
                            {section.questions?.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-6 pt-4">
                          {section.questions?.map((question: any, qIdx: number) => (
                            <div key={question.id || qIdx} className="space-y-2">
                              <Label>
                                {question.prompt}
                                {question.required && (
                                  <span className="text-red-600 ml-1">*</span>
                                )}
                              </Label>
                              {question.type === "LIKERT" ? (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-4">
                                    {Array.from(
                                      { length: (question.scaleMax || 5) - (question.scaleMin || 1) + 1 },
                                      (_, i) => {
                                        const value = (question.scaleMin || 1) + i;
                                        return (
                                          <label
                                            key={value}
                                            className="flex items-center gap-2 cursor-pointer"
                                          >
                                            <input
                                              type="radio"
                                              name={question.id}
                                              value={value}
                                              checked={answers[question.id] === value}
                                              onChange={(e) =>
                                                updateAnswer(question.id, parseInt(e.target.value))
                                              }
                                              className="w-4 h-4"
                                            />
                                            <span className="text-sm">{value}</span>
                                          </label>
                                        );
                                      }
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 flex justify-between">
                                    <span>{question.scaleMin || 1} - Poor</span>
                                    <span>{question.scaleMax || 5} - Excellent</span>
                                  </div>
                                </div>
                              ) : (
                                <Textarea
                                  value={answers[question.id]?.toString() || ""}
                                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                                  placeholder="Enter your feedback..."
                                  rows={4}
                                  required={question.required}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className="flex items-center justify-end gap-2 pt-4 border-t">
                  <Button onClick={handleSubmit} disabled={submitting} size="lg">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Submit Feedback
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
