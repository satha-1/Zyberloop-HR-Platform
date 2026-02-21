"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Upload, X, FileText } from "lucide-react";

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface DocumentFile {
  file: File;
  type: string;
  preview?: string;
}

export function AddEmployeeDialog({ open, onOpenChange, onSuccess }: AddEmployeeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [departments, setDepartments] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
    grade: "",
    departmentId: "",
    managerId: "",
    hireDate: "",
    salary: "",
    employeeCode: "",
  });

  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchManagers();
    }
  }, [open]);

  const fetchDepartments = async () => {
    try {
      const depts = await api.getDepartments();
      setDepartments(depts || []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  };

  const fetchManagers = async () => {
    try {
      const emps = await api.getEmployees({ status: "active" });
      setManagers(emps || []);
    } catch (error) {
      console.error("Failed to fetch managers:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    files.forEach((file) => {
      // Validate file size
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} has an invalid type. Allowed: PDF, JPG, PNG, DOC, DOCX`);
        return;
      }

      setDocuments((prev) => [...prev, { file, type }]);
    });
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress({});

    try {
      const formDataToSend = new FormData();
      
      // Add employee data (filter out empty strings, undefined, null, and "none" values)
      Object.entries(formData).forEach(([key, value]) => {
        if (value && value !== '' && value !== 'undefined' && value !== 'null' && value !== 'none') {
          formDataToSend.append(key, value);
        }
      });

      // Add documents with progress tracking
      documents.forEach((doc, index) => {
        formDataToSend.append("documents", doc.file);
        formDataToSend.append(`docType_documents`, doc.type);
      });

      // Use XMLHttpRequest for real upload progress tracking
      const token = localStorage.getItem('auth_token');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';
      
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const overallProgress = (e.loaded / e.total) * 100;
            // Distribute progress across all documents
            documents.forEach((_, index) => {
              setUploadProgress((prev) => ({
                ...prev,
                [index]: overallProgress,
              }));
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                resolve();
              } else {
                reject(new Error(response.error?.message || 'Upload failed'));
              }
            } catch (error) {
              resolve(); // Assume success if can't parse
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.open('POST', `${API_BASE_URL}/employees`);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formDataToSend);
      });
      
      setUploadProgress({});
      
      toast.success("Employee created successfully!");
      onOpenChange(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dob: "",
        address: "",
        grade: "",
        departmentId: "",
        managerId: "",
        hireDate: "",
        salary: "",
        employeeCode: "",
      });
      setDocuments([]);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create employee");
    } finally {
      setLoading(false);
      setUploadProgress({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Fill in the employee details and upload required documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeCode">Employee Code</Label>
                <Input
                  id="employeeCode"
                  placeholder="Auto-generated if empty"
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Employment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Employment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department *</Label>
                <Select
                  value={formData.departmentId || undefined}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => {
                      const deptId = dept._id || dept.id;
                      if (!deptId) return null;
                      return (
                        <SelectItem key={String(deptId)} value={String(deptId)}>
                          {dept.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade *</Label>
                <Input
                  id="grade"
                  required
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="managerId">Manager</Label>
                <Select
                  value={formData.managerId || undefined}
                  onValueChange={(value) => setFormData({ ...formData, managerId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {managers.map((mgr) => {
                      const mgrId = mgr._id || mgr.id;
                      if (!mgrId) return null;
                      return (
                        <SelectItem key={String(mgrId)} value={String(mgrId)}>
                          {mgr.firstName} {mgr.lastName} ({mgr.employeeCode})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date *</Label>
                <Input
                  id="hireDate"
                  type="date"
                  required
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Salary *</Label>
              <Input
                id="salary"
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Documents</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NIC Copy</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, "NIC")}
                />
              </div>
              <div className="space-y-2">
                <Label>Passport Copy</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, "PASSPORT")}
                />
              </div>
              <div className="space-y-2">
                <Label>CV</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, "CV")}
                />
              </div>
              <div className="space-y-2">
                <Label>Appointment Letter</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, "APPOINTMENT_LETTER")}
                />
              </div>
              <div className="space-y-2">
                <Label>Contract</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, "CONTRACT")}
                />
              </div>
              <div className="space-y-2">
                <Label>Certificates</Label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, "CERTIFICATE")}
                />
              </div>
            </div>

            {documents.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Documents ({documents.length})</Label>
                <div className="space-y-2">
                  {documents.map((doc, index) => {
                    const fileSizeMB = (doc.file.size / (1024 * 1024)).toFixed(2);
                    const isImage = doc.file.type.startsWith('image/');
                    const progress = uploadProgress[index];
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded border"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{doc.file.name}</p>
                            <p className="text-xs text-gray-500">
                              {doc.type} • {fileSizeMB} MB
                            </p>
                            {progress !== undefined && (
                              <div className="w-full mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{progress}% uploaded</p>
                              </div>
                            )}
                          </div>
                          {isImage && (
                            <div className="w-12 h-12 border rounded overflow-hidden">
                              <img
                                src={URL.createObjectURL(doc.file)}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(index)}
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
