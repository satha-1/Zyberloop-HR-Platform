"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { api } from "../../../lib/api";
import { Briefcase, MapPin, Clock, Upload } from "lucide-react";
import { useState, useEffect, use } from "react";
import { toast } from "sonner";

export default function CandidatePortal({ params }: { params: Promise<{ requisitionId: string }> }) {
  const { requisitionId } = use(params);
  const [requisition, setRequisition] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPublicRequisition(requisitionId)
      .then(setRequisition)
      .catch(() => {
        toast.error("Requisition not found");
      })
      .finally(() => setLoading(false));
  }, [requisitionId]);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      requisitionId,
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      resumeUrl: formData.get('resumeUrl'),
      coverLetter: formData.get('coverLetter'),
    };
    
    try {
      await api.createCandidateApplication(data);
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit application");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Job posting not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mt-6">Application Submitted!</h2>
            <p className="text-gray-600 mt-2">
              Thank you for applying to {requisition.title}. Our team will review your application
              and get back to you soon.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              You'll receive a confirmation email at the address you provided.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">NG</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">NG-IHRP</h1>
              <p className="text-sm text-gray-600">Careers Portal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{requisition.title}</CardTitle>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {requisition.departmentId?.name || requisition.department || "N/A"}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {requisition.location}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {requisition.type?.replace("_", " ") || requisition.type}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {requisition.aboutTheRole && (
              <div>
                <h3 className="font-semibold mb-2">About the Role</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {requisition.aboutTheRole}
                </p>
              </div>
            )}
            {requisition.keyResponsibilities && requisition.keyResponsibilities.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Key Responsibilities</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {requisition.keyResponsibilities.map((resp: string, index: number) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}
            {requisition.requirements && requisition.requirements.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Requirements</h3>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {requisition.requirements.map((req: string, index: number) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
            {!requisition.aboutTheRole && 
             (!requisition.keyResponsibilities || requisition.keyResponsibilities.length === 0) &&
             (!requisition.requirements || requisition.requirements.length === 0) && (
              <div className="text-gray-500 text-sm italic">
                Job description details are being prepared. Please check back soon.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Apply for this Position</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" type="tel" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience *</Label>
                <Input id="experience" type="number" required min="0" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Expected Salary (USD) *</Label>
                <Input id="salary" type="number" required min="0" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume">Resume/CV *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (max 5MB)</p>
                  <input
                    id="resume"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                <Textarea
                  id="coverLetter"
                  rows={6}
                  placeholder="Tell us why you're a great fit for this role..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  Submit Application
                </Button>
                <Button type="button" variant="outline">
                  Save Draft
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
