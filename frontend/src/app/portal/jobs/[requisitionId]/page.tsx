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
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [applicationStatus, setApplicationStatus] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (!requisitionId) return;
    
    api.getPublicRequisition(requisitionId)
      .then((data: any) => {
        // Handle both direct data and wrapped response
        const requisition = data?.data || data;
        setRequisition(requisition);
      })
      .catch((error: any) => {
        console.error("Error loading requisition:", error);
        toast.error(error.message || "Job posting not found or not available");
        setLoading(false);
      })
      .finally(() => setLoading(false));
  }, [requisitionId]);

  // Check if user has already applied (when email is entered)
  const checkApplication = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    setCheckingStatus(true);
    try {
      const result = await api.checkApplicationStatus(requisitionId, email);
      if (result.hasApplied) {
        setApplicationStatus(result.application);
        setSubmitted(true);
      }
    } catch (error) {
      // Silently fail - user might not have applied yet
      console.error('Error checking application status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem(`application_draft_${requisitionId}`);
    if (draft && !submitted) {
      try {
        const draftData = JSON.parse(draft);
        // Pre-fill form with draft data
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) {
          if (draftData.firstName) (form.querySelector('#firstName') as HTMLInputElement).value = draftData.firstName;
          if (draftData.lastName) (form.querySelector('#lastName') as HTMLInputElement).value = draftData.lastName;
          if (draftData.email) (form.querySelector('#email') as HTMLInputElement).value = draftData.email;
          if (draftData.phone) (form.querySelector('#phone') as HTMLInputElement).value = draftData.phone;
          if (draftData.experience) (form.querySelector('#experience') as HTMLInputElement).value = draftData.experience;
          if (draftData.currentCompany) (form.querySelector('#currentCompany') as HTMLInputElement).value = draftData.currentCompany;
          if (draftData.coverLetter) (form.querySelector('#coverLetter') as HTMLTextAreaElement).value = draftData.coverLetter;
        }
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }, [requisitionId, submitted]);

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF, DOC, and DOCX files are allowed");
        return;
      }
      setResumeFile(file);
      setResumeFileName(file.name);
    }
  };

  const handleSaveDraft = () => {
    const form = document.querySelector('form') as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const draftData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      experience: formData.get('experience'),
      currentCompany: formData.get('currentCompany'),
      coverLetter: formData.get('coverLetter'),
    };

    localStorage.setItem(`application_draft_${requisitionId}`, JSON.stringify(draftData));
    toast.success("Draft saved successfully!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      // Validate required fields
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
      const email = formData.get('email') as string;
      const phone = formData.get('phone') as string;
      const experience = formData.get('experience') as string;

      if (!firstName || !lastName || !email || !phone || !experience) {
        toast.error("Please fill in all required fields");
        setSubmitting(false);
        return;
      }

      if (!resumeFile) {
        toast.error("Please upload your resume");
        setSubmitting(false);
        return;
      }

      // Create FormData for API call
      const applicationData = new FormData();
      applicationData.append('requisitionId', requisitionId);
      applicationData.append('fullName', `${firstName} ${lastName}`);
      applicationData.append('email', email);
      applicationData.append('phone', phone);
      applicationData.append('experienceYears', experience);
      applicationData.append('resume', resumeFile);
      
      const currentCompany = formData.get('currentCompany');
      if (currentCompany) {
        applicationData.append('currentCompany', currentCompany as string);
      }

      const coverLetter = formData.get('coverLetter');
      if (coverLetter) {
        applicationData.append('coverLetter', coverLetter as string);
      }

      const result = await api.createCandidateApplication(applicationData);
      
      // Clear draft on successful submission
      localStorage.removeItem(`application_draft_${requisitionId}`);
      
      // Set application status if returned
      if (result) {
        setApplicationStatus(result);
      }
      
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
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

  if (submitted || applicationStatus) {
    const status = applicationStatus?.status || 'APPLIED';
    const statusColors: Record<string, string> = {
      APPLIED: 'bg-blue-100 text-blue-800',
      SCREENING: 'bg-yellow-100 text-yellow-800',
      INTERVIEW: 'bg-purple-100 text-purple-800',
      OFFERED: 'bg-green-100 text-green-800',
      HIRED: 'bg-emerald-100 text-emerald-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    const statusColor = statusColors[status] || 'bg-gray-100 text-gray-800';

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
            <h2 className="text-2xl font-bold text-gray-900 mt-6">
              {applicationStatus ? 'Application Received' : 'Application Submitted!'}
            </h2>
            {applicationStatus && (
              <div className="mt-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                  Status: {status}
                </span>
              </div>
            )}
            <p className="text-gray-600 mt-4">
              Thank you for applying to {requisition?.title || 'this position'}. Our team will review your application
              and get back to you soon.
            </p>
            {applicationStatus?.createdAt && (
              <p className="text-sm text-gray-500 mt-2">
                Applied on: {new Date(applicationStatus.createdAt).toLocaleDateString()}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              {applicationStatus ? 
                "You'll receive updates via email as your application progresses." :
                "You'll receive a confirmation email at the address you provided."
              }
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job posting...</p>
        </div>
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mt-6">Job Not Found</h2>
            <p className="text-gray-600 mt-4">
              This job posting may not be available, has been closed, or the link is invalid.
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
              <span className="text-white font-bold text-lg">ZJ</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ZyberJR</h1>
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
                  <Input id="firstName" name="firstName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" name="lastName" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  onBlur={(e) => {
                    const email = e.target.value;
                    if (email && email.includes('@')) {
                      checkApplication(email);
                    }
                  }}
                />
                {checkingStatus && (
                  <p className="text-xs text-gray-500">Checking application status...</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" name="phone" type="tel" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience *</Label>
                <Input id="experience" name="experience" type="number" required min="0" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentCompany">Current Company (Optional)</Label>
                <Input id="currentCompany" name="currentCompany" type="text" placeholder="Your current employer" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume">Resume/CV *</Label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('resume')?.click()}
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {resumeFileName || "Click to upload or drag and drop"}
                  </p>
                  {resumeFileName && (
                    <p className="text-sm text-green-600 mt-1 font-medium">{resumeFileName}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (max 5MB)</p>
                  <input
                    id="resume"
                    name="resume"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleResumeChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                <Textarea
                  id="coverLetter"
                  name="coverLetter"
                  rows={6}
                  placeholder="Tell us why you're a great fit for this role..."
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Application"}
                </Button>
                <Button type="button" variant="outline" onClick={handleSaveDraft}>
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
