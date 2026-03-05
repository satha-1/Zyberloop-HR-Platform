"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  GraduationCap,
  BookOpen,
  Eye,
  Clock,
  Calendar,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Video,
  FileText,
  Link as LinkIcon,
  Trash2,
  Edit,
  Upload,
  ChevronDown,
  ChevronUp,
  GripVertical,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw
} from "lucide-react";
import {
  WorkdayTable,
  WorkdayTableColumn,
  TableToolbarActions
} from "../../components/ui/WorkdayTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { useLearningCourses, useLearningAssignments } from "../../lib/hooks";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { cn } from "../../components/ui/utils";

const QuizPlayer = ({ quiz }: { quiz: any }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = optionIdx;
    setAnswers(newAnswers);
  };

  const calculateScore = () => {
    let score = 0;
    quiz.questions.forEach((q: any, idx: number) => {
      if (answers[idx] === q.correctAnswer) score++;
    });
    return score;
  };

  if (showResult) {
    const score = calculateScore();
    const passed = score >= quiz.questions.length / 2;
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 bg-white rounded-xl">
        <div className={`h-24 w-24 rounded-full flex items-center justify-center ${passed ? 'bg-green-50' : 'bg-red-50'}`}>
          {passed ? <CheckCircle2 className="h-12 w-12 text-green-600" /> : <AlertCircle className="h-12 w-12 text-red-600" />}
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-bold text-gray-900">Quiz Completed!</h3>
          <p className="text-lg text-gray-500">Your Score: <span className="font-bold text-gray-900">{score} / {quiz.questions.length}</span></p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg w-full max-w-sm">
          <p className="text-sm text-gray-600">
            {passed ? "Excellent! You've successfully completed this assessment." : "Don't give up! Review the material and try again to improve your score."}
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => {
            setCurrentStep(0);
            setAnswers([]);
            setShowResult(false);
          }}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">Finish Module</Button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentStep];

  return (
    <div className="flex-1 flex flex-col p-8 space-y-8 bg-white rounded-xl">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest">Question {currentStep + 1} of {quiz.questions.length}</h3>
          <div className="h-2 w-48 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
        <Badge variant="secondary">Assessment In Progress</Badge>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">{currentQuestion.question}</h2>
        <div className="grid gap-3">
          {currentQuestion.options.map((opt: string, oIdx: number) => (
            <button
              key={oIdx}
              onClick={() => handleAnswer(oIdx)}
              className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group",
                answers[currentStep] === oIdx
                  ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                  : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <span className="font-medium text-lg">{opt}</span>
              <div className={cn(
                "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors",
                answers[currentStep] === oIdx ? "border-blue-600 bg-blue-600 text-white" : "border-gray-200 group-hover:border-gray-300"
              )}>
                {answers[currentStep] === oIdx && <CheckCircle2 className="h-4 w-4" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-8 border-t">
        {currentStep < quiz.questions.length - 1 ? (
          <Button
            disabled={answers[currentStep] === undefined}
            onClick={() => setCurrentStep(currentStep + 1)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Next Question
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            disabled={answers[currentStep] === undefined}
            onClick={() => setShowResult(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Submit Quiz
            <CheckCircle2 className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

const stripTempIds = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(stripTempIds);
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (key === '_id' && typeof obj[key] === 'string' && obj[key].startsWith('temp-')) {
        continue;
      }
      newObj[key] = stripTempIds(obj[key]);
    }
    return newObj;
  }
  return obj;
};

export default function Learning() {
  const [activeTab, setActiveTab] = useState("my-learning");
  const { data: courses, loading: coursesLoading, refetch: refetchCourses } = useLearningCourses();
  const { data: assignments, loading: assignmentsLoading, refetch: refetchAssignments } = useLearningAssignments();

  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [courseForm, setCourseForm] = useState<any>({
    title: "",
    description: "",
    category: "General",
    duration: 1,
    instructor: "",
    status: "DRAFT",
    sections: []
  });

  const [materialForm, setMaterialForm] = useState<any>({
    title: "",
    type: "DOCUMENT",
    url: "",
    file: null as File | null,
    sectionIndex: -1, // To track which section it belongs to in the creator
    quizData: {
      questions: [{ question: "", options: ["", "", "", ""], correctAnswer: 0 }]
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Check if user is admin (Mock for now, should come from auth context)
  const isAdmin = true;

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = stripTempIds({ ...courseForm });
      if (selectedCourse) {
        await api.updateLearningCourse(selectedCourse._id, payload);
        toast.success("Course updated successfully");
      } else {
        await api.createLearningCourse(payload);
        toast.success("Course created successfully");
      }
      setIsCourseDialogOpen(false);
      setSelectedCourse(null);
      setCourseForm({ title: "", description: "", category: "General", duration: 1, instructor: "", status: "DRAFT", sections: [] });
      refetchCourses();
    } catch (error: any) {
      toast.error(error.message || "Failed to save course");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSection = () => {
    setCourseForm({
      ...courseForm,
      sections: [...courseForm.sections, { title: "New Section", description: "", materials: [] }]
    });
  };

  const handleRemoveSection = (index: number) => {
    const newSections = [...courseForm.sections];
    newSections.splice(index, 1);
    setCourseForm({ ...courseForm, sections: newSections });
  };

  const handleUpdateSection = (index: number, data: any) => {
    const newSections = [...courseForm.sections];
    newSections[index] = { ...newSections[index], ...data };
    setCourseForm({ ...courseForm, sections: newSections });
  };

  const handleRemoveMaterialFromSection = (sIndex: number, mIndex: number) => {
    const newSections = [...courseForm.sections];
    newSections[sIndex].materials.splice(mIndex, 1);
    setCourseForm({ ...courseForm, sections: newSections });
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await api.deleteLearningCourse(id);
      toast.success("Course deleted successfully");
      refetchCourses();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete course");
    }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    if (materialForm.type === 'QUIZ') {
      const newSections = [...courseForm.sections];
      const newQuiz = {
        type: 'QUIZ',
        title: materialForm.title,
        quizData: materialForm.quizData,
        _id: `temp-${Date.now()}`
      };

      if (materialForm.sectionIndex >= 0) {
        newSections[materialForm.sectionIndex].materials.push(newQuiz);
        setCourseForm({ ...courseForm, sections: newSections });
        toast.success("Quiz added to section (Save course to persist)");
      } else {
        setCourseForm({ ...courseForm, materials: [...courseForm.materials, newQuiz] });
        toast.success("Quiz added to course (Save course to persist)");
      }

      setIsMaterialDialogOpen(false);
      setMaterialForm({
        title: "",
        type: "DOCUMENT",
        url: "",
        file: null,
        sectionIndex: -1,
        quizData: { questions: [{ question: "", options: ["", "", "", ""], correctAnswer: 0 }] }
      });
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("title", materialForm.title);
      formData.append("type", materialForm.type);
      if (materialForm.type === 'LINK') {
        let url = materialForm.url;
        if (!/^https?:\/\//i.test(url)) {
          url = `https://${url}`;
        }
        formData.append("url", url);
      } else if (materialForm.file) {
        formData.append("file", materialForm.file);
      } else {
        toast.error("File or URL is required");
        return;
      }

      if (materialForm.sectionIndex >= 0) {
        const result = await api.uploadLearningMaterial(selectedCourse?._id || "temp", formData);
        const newSections = [...courseForm.sections];
        newSections[materialForm.sectionIndex].materials.push(result.data || result);
        setCourseForm({ ...courseForm, sections: newSections });
        toast.success("Material added to section");
      } else {
        await api.uploadLearningMaterial(selectedCourse._id, formData);
        toast.success("Material uploaded successfully");
      }
      setIsMaterialDialogOpen(false);
      setMaterialForm({
        title: "",
        type: "DOCUMENT",
        url: "",
        file: null,
        sectionIndex: -1,
        quizData: { questions: [{ question: "", options: ["", "", "", ""], correctAnswer: 0 }] }
      });
      refetchCourses();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload material");
    } finally {
      setIsUploading(false);
    }
  };

  const transcriptColumns: WorkdayTableColumn<any>[] = [
    {
      key: "title",
      header: "Course Title",
      align: "left",
      render: (row) => row.courseId?.title || "N/A",
    },
    {
      key: "type",
      header: "Category",
      align: "left",
      render: (row) => row.courseId?.category || "N/A",
    },
    {
      key: "duration",
      header: "Duration",
      align: "left",
      render: (row) => `${row.courseId?.duration}h` || "N/A",
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (row) => (
        <Badge variant="outline" className={
          row.status === 'COMPLETED' ? "bg-green-50 text-green-700" :
            row.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-700" :
              "bg-gray-50 text-gray-700"
        }>
          {row.status || "N/A"}
        </Badge>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      align: "right",
      render: (row) => `${row.progress}%`,
    }
  ];

  const adminColumns: WorkdayTableColumn<any>[] = [
    {
      key: "title",
      header: "Course Name",
      align: "left",
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="text-xs text-gray-500">{row.category}</p>
        </div>
      )
    },
    {
      key: "instructor",
      header: "Instructor",
      align: "left",
      render: (row) => row.instructor || "Internal",
    },
    {
      key: "materials",
      header: "Materials",
      align: "left",
      render: (row) => (
        <div className="flex gap-1">
          {row.materials?.map((m: any, i: number) => (
            <div key={i} title={m.title}>
              {m.type === 'VIDEO' ? <Video className="h-4 w-4 text-blue-500" /> :
                m.type === 'DOCUMENT' ? <FileText className="h-4 w-4 text-orange-500" /> :
                  <LinkIcon className="h-4 w-4 text-gray-500" />}
            </div>
          ))}
          {(!row.materials || row.materials.length === 0) && <span className="text-gray-400 text-xs">No materials</span>}
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (row) => (
        <Badge variant="outline" className={
          row.status === 'PUBLISHED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
            row.status === 'ARCHIVED' ? "bg-red-50 text-red-700 border-red-200" :
              "bg-gray-50 text-gray-700 border-gray-200"
        }>
          {row.status}
        </Badge>
      )
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const firstMaterial = row.sections?.[0]?.materials?.[0];
              setSelectedCourse({ ...row, activeMaterial: firstMaterial || null });
              setIsPreviewDialogOpen(true);
            }}
            title="Preview Course"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCourse(row);
              setIsMaterialDialogOpen(true);
            }}
            title="Add Material"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCourse(row);
              setCourseForm({
                title: row.title,
                description: row.description,
                category: row.category,
                duration: row.duration,
                instructor: row.instructor,
                status: row.status,
                sections: row.sections || []
              });
              setIsCourseDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteCourse(row._id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning & Development</h1>
          <p className="text-gray-500 mt-1">Develop your skills and track your professional growth.</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={() => {
              setSelectedCourse(null);
              setCourseForm({ title: "", description: "", category: "General", duration: 1, instructor: "", status: "DRAFT", sections: [] });
              setIsCourseDialogOpen(true);
            }} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Create Course</span>
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="my-learning" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="my-learning" className="px-6">My Learning</TabsTrigger>
          <TabsTrigger value="browse" className="px-6">Browse Content</TabsTrigger>
          {isAdmin && <TabsTrigger value="manage" className="px-6 font-medium">Manage Courses</TabsTrigger>}
        </TabsList>

        <TabsContent value="my-learning" className="space-y-8 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Required Now</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assignments?.filter(a => a.status !== 'COMPLETED').length || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-50 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assignments?.filter(a => a.status === 'IN_PROGRESS').length || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assignments?.filter(a => a.status === 'COMPLETED').length || 0}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">My Transcript</h3>
            <WorkdayTable
              columns={transcriptColumns}
              data={assignments || []}
              getRowKey={(row) => row._id}
              isLoading={assignmentsLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="browse" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses?.filter(c => c.status === 'PUBLISHED').map((course) => (
              <Card key={course._id} className="hover:shadow-lg transition-shadow overflow-hidden group">
                <div className="h-40 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center relative">
                  <BookOpen className="h-16 w-16 text-white opacity-20 group-hover:scale-110 transition-transform" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/20 text-white backdrop-blur-sm border-none">{course.category}</Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 truncate" title={course.title}>{course.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">{course.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}h</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const firstMaterial = course.sections?.[0]?.materials?.[0];
                          setSelectedCourse({ ...course, activeMaterial: firstMaterial || null });
                          setIsPreviewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">Enroll Now</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!courses || courses.filter(c => c.status === 'PUBLISHED').length === 0) && !coursesLoading && (
              <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border border-dashed">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No courses available at the moment.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="manage" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <CardTitle className="text-xl">Course Catalog Management</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input className="pl-9 w-64" placeholder="Search courses..." />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <WorkdayTable
                  columns={adminColumns}
                  data={courses || []}
                  getRowKey={(row) => row._id}
                  isLoading={coursesLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Course Create/Edit Dialog */}
      <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
            <DialogDescription>
              Manage your course details, categories, and hierarchical sections.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCourse}>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Course Title</Label>
                    <Input
                      id="title"
                      value={courseForm.title}
                      onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={courseForm.category}
                        onValueChange={v => setCourseForm({ ...courseForm, category: v })}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Internal">Internal</SelectItem>
                          <SelectItem value="Compliance">Compliance</SelectItem>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                          <SelectItem value="Leadership">Leadership</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="duration">Duration (h)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={courseForm.duration}
                        onChange={e => setCourseForm({ ...courseForm, duration: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="instructor">Instructor</Label>
                    <Input
                      id="instructor"
                      value={courseForm.instructor}
                      onChange={e => setCourseForm({ ...courseForm, instructor: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={courseForm.status}
                      onValueChange={(v: any) => setCourseForm({ ...courseForm, status: v })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      rows={3}
                      value={courseForm.description}
                      onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4 border-l pl-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Course Sections</h3>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddSection}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Section
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {courseForm.sections.map((section: any, sIdx: number) => (
                      <div key={sIdx} className="border rounded-lg p-3 bg-gray-50/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Input
                            placeholder="Section Title"
                            value={section.title}
                            onChange={e => handleUpdateSection(sIdx, { title: e.target.value })}
                            className="h-8 text-sm font-medium"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSection(sIdx)}
                            className="text-red-500 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2 mt-2">
                          {section.materials.map((mat: any, mIdx: number) => (
                            <div key={mIdx} className="flex items-center justify-between text-xs bg-white border rounded px-2 py-1">
                              <div className="flex items-center gap-2">
                                {mat.type === 'VIDEO' ? <Video className="h-3 w-3 text-blue-500" /> :
                                  mat.type === 'DOCUMENT' ? <FileText className="h-3 w-3 text-orange-500" /> :
                                    <LinkIcon className="h-3 w-3 text-gray-500" />}
                                <span className="truncate max-w-[150px]">{mat.title}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMaterialFromSection(sIdx, mIdx)}
                                className="h-5 w-5 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!selectedCourse && !courseForm._id) {
                                toast.error("Please save the course first or work on an existing one");
                                return;
                              }
                              setMaterialForm({ ...materialForm, sectionIndex: sIdx });
                              setIsMaterialDialogOpen(true);
                            }}
                            className="w-full h-8 text-xs border border-dashed border-gray-300"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Material
                          </Button>
                        </div>
                      </div>
                    ))}
                    {courseForm.sections.length === 0 && (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed">
                        <p className="text-xs text-gray-500">No sections added yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCourseDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" loading={isSaving}>
                {selectedCourse ? "Update Course" : "Save Course"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Material Upload Dialog */}
      <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{materialForm.type === 'QUIZ' ? 'Create Quiz' : 'Add Material'}</DialogTitle>
            <DialogDescription>
              Add contents to your course section.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadMaterial}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="m-title">Material Title</Label>
                <Input
                  id="m-title"
                  value={materialForm.title}
                  onChange={e => setMaterialForm({ ...materialForm, title: e.target.value })}
                  placeholder="e.g. Introduction Slides"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="m-type">Material Type</Label>
                <Select
                  value={materialForm.type}
                  onValueChange={(v: any) => setMaterialForm({ ...materialForm, type: v })}
                >
                  <SelectTrigger id="m-type">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOCUMENT">Document (S3)</SelectItem>
                    <SelectItem value="VIDEO">Video (S3)</SelectItem>
                    <SelectItem value="LINK">External Link</SelectItem>
                    <SelectItem value="QUIZ">Quiz / Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {materialForm.type === 'QUIZ' ? (
                <div className="space-y-4 border rounded-lg p-4 bg-gray-50 max-h-[400px] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold uppercase text-gray-500">Quiz Questions</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setMaterialForm({
                        ...materialForm,
                        quizData: {
                          questions: [...materialForm.quizData.questions, { question: "", options: ["", "", "", ""], correctAnswer: 0 }]
                        }
                      })}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Question
                    </Button>
                  </div>
                  {materialForm.quizData.questions.map((q: any, qIdx: number) => (
                    <div key={qIdx} className="p-3 bg-white border rounded-lg space-y-3 relative group">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const newQs = [...materialForm.quizData.questions];
                          newQs.splice(qIdx, 1);
                          setMaterialForm({ ...materialForm, quizData: { questions: newQs } });
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <div className="space-y-1">
                        <Label className="text-xs">Question {qIdx + 1}</Label>
                        <Input
                          value={q.question}
                          onChange={(e) => {
                            const newQs = [...materialForm.quizData.questions];
                            newQs[qIdx].question = e.target.value;
                            setMaterialForm({ ...materialForm, quizData: { questions: newQs } });
                          }}
                          placeholder="What is...?"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt: string, oIdx: number) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={q.correctAnswer === oIdx}
                              onChange={() => {
                                const newQs = [...materialForm.quizData.questions];
                                newQs[qIdx].correctAnswer = oIdx;
                                setMaterialForm({ ...materialForm, quizData: { questions: newQs } });
                              }}
                            />
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const newQs = [...materialForm.quizData.questions];
                                newQs[qIdx].options[oIdx] = e.target.value;
                                setMaterialForm({ ...materialForm, quizData: { questions: newQs } });
                              }}
                              placeholder={`Option ${oIdx + 1}`}
                              className="h-7 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (materialForm.type as string) === 'LINK' ? (
                <div className="grid gap-2">
                  <Label htmlFor="m-url">External URL</Label>
                  <Input
                    id="m-url"
                    value={materialForm.url}
                    onChange={e => setMaterialForm({ ...materialForm, url: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="m-file">Upload File</Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      id="m-file"
                      type="file"
                      className="hidden"
                      accept={materialForm.type === 'VIDEO' ? "video/*" : ".pdf,.doc,.docx,.jpg,.jpeg,.png"}
                      onChange={e => setMaterialForm({ ...materialForm, file: e.target.files?.[0] || null })}
                    />
                    <label htmlFor="m-file" className="cursor-pointer">
                      <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {materialForm.file ? materialForm.file.name : "Click to select file"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">S3 Bucket storage will be used</p>
                    </label>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMaterialDialogOpen(false)}>Cancel</Button>
              <Button type="submit" loading={isUploading}>
                {materialForm.type === 'QUIZ' ? 'Add Quiz' : 'Upload Material'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Course Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Course Preview: {selectedCourse?.title}</DialogTitle>
            <DialogDescription>Preview the content and structure of the course.</DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <>
              <div className="flex flex-col md:flex-row h-full overflow-hidden">
                {/* Sidebar with Sections */}
                <div className="w-full md:w-80 border-r bg-gray-50 flex flex-col h-full shrink-0">
                  <div className="p-4 border-b bg-white">
                    <Badge variant="outline" className="mb-2">{selectedCourse.category}</Badge>
                    <h2 className="text-lg font-bold line-clamp-2">{selectedCourse.title}</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedCourse.sections?.map((section: any, sIdx: number) => (
                      <div key={sIdx} className="space-y-2">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{section.title}</h3>
                        <div className="space-y-1">
                          {section.materials.map((material: any, mIdx: number) => (
                            <button
                              key={mIdx}
                              onClick={() => setSelectedCourse({ ...selectedCourse, activeMaterial: material })}
                              className={cn(
                                "w-full text-left p-2 rounded-lg text-sm flex items-center gap-3 transition-colors",
                                selectedCourse.activeMaterial?._id === material._id ? "bg-blue-100 text-blue-700 font-medium" : "hover:bg-gray-200"
                              )}
                            >
                              {material.type === 'VIDEO' ? <Video className="h-4 w-4" /> :
                                material.type === 'DOCUMENT' ? <FileText className="h-4 w-4" /> :
                                  material.type === 'QUIZ' ? <GraduationCap className="h-4 w-4" /> :
                                    <LinkIcon className="h-4 w-4" />}
                              <span className="truncate">{material.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {(!selectedCourse.sections || selectedCourse.sections.length === 0) && (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500 italic">No structured chapters found.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                  {selectedCourse.activeMaterial ? (
                    <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{selectedCourse.activeMaterial.title}</h3>
                          <p className="text-sm text-gray-500">Resource type: {selectedCourse.activeMaterial.type}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.open(selectedCourse.activeMaterial.url, '_blank')}>
                          Open in New Tab
                        </Button>
                      </div>

                      <div className="flex-1 bg-black rounded-xl overflow-hidden shadow-2xl min-h-[400px]">
                        {selectedCourse.activeMaterial.type === 'VIDEO' ? (
                          <video
                            controls
                            key={selectedCourse.activeMaterial.url}
                            className="w-full h-full object-contain"
                          >
                            <source src={selectedCourse.activeMaterial.url} />
                            Your browser does not support the video tag.
                          </video>
                        ) : (selectedCourse.activeMaterial.type === 'DOCUMENT' || selectedCourse.activeMaterial.type === 'LINK') ? (
                          <iframe
                            src={selectedCourse.activeMaterial.url || 'about:blank'}
                            className="w-full h-full bg-white border-none"
                            title={selectedCourse.activeMaterial.title}
                          />
                        ) : selectedCourse.activeMaterial.type === 'QUIZ' ? (
                          <div className="w-full h-full bg-gray-50 flex overflow-hidden">
                            <QuizPlayer quiz={selectedCourse.activeMaterial.quizData} />
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 space-y-4 p-8 text-center">
                            <LinkIcon className="h-16 w-16 text-blue-500" />
                            <h4 className="text-white text-lg font-medium">Unknown material type</h4>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                      <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center">
                        <GraduationCap className="h-10 w-10 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Welcome to course preview</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-2">
                          Select a chapter from the sidebar to start viewing materials and prepare for your learning journey.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 border-t flex justify-end gap-3 bg-white relative z-10">
                <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>Close Preview</Button>
                <Button className="bg-blue-600 hover:bg-blue-700">Start Enrollment</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
