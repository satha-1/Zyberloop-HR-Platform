"use client";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import { GraduationCap, BookOpen, Award, TrendingUp } from "lucide-react";

export default function Learning() {
  const recommendedCourses = [
    { title: "Advanced React Patterns", skill: "React", proficiency: "+25%", duration: "8 hours", status: "Recommended" },
    { title: "Leadership Fundamentals", skill: "Leadership", proficiency: "+30%", duration: "12 hours", status: "Recommended" },
    { title: "Data Analytics with Python", skill: "Analytics", proficiency: "+40%", duration: "16 hours", status: "Recommended" },
  ];

  const inProgress = [
    { title: "TypeScript Deep Dive", progress: 65, deadline: "2026-03-15" },
    { title: "Project Management Basics", progress: 40, deadline: "2026-03-20" },
  ];

  const mandatoryTraining = [
    { title: "Information Security Awareness", status: "Completed", completedDate: "2026-01-15" },
    { title: "Code of Conduct", status: "Completed", completedDate: "2026-01-10" },
    { title: "Data Privacy & GDPR", status: "Due", deadline: "2026-03-01" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Learning & Development</h2>
          <p className="text-gray-600 mt-1">Courses, skills, and career growth</p>
        </div>
        <Button>
          <GraduationCap className="h-4 w-4 mr-2" />
          Browse Catalog
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Courses In Progress</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Courses Completed</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Skills Improved</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-lg">
                <GraduationCap className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Learning Hours</p>
                <p className="text-2xl font-bold text-gray-900">84</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended for You</CardTitle>
          <p className="text-sm text-gray-600">Based on your skill gaps and career path</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendedCourses.map((course, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-500 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{course.title}</h4>
                    <div className="flex gap-3 mt-1 text-sm text-gray-600">
                      <span>Skill: {course.skill}</span>
                      <span>•</span>
                      <span>Duration: {course.duration}</span>
                      <span>•</span>
                      <span className="text-green-600 font-medium">{course.proficiency} proficiency gain</span>
                    </div>
                  </div>
                </div>
                <Button>Enroll</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* In Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Courses in Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inProgress.map((course, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{course.title}</h4>
                  <span className="text-sm text-gray-600">
                    Due: {new Date(course.deadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={course.progress} className="flex-1" />
                  <span className="text-sm font-medium">{course.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mandatory Training */}
      <Card>
        <CardHeader>
          <CardTitle>Mandatory Compliance Training</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mandatoryTraining.map((training, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${training.status === "Completed" ? "bg-green-100" : "bg-orange-100"} rounded-lg flex items-center justify-center`}>
                    {training.status === "Completed" ? (
                      <Award className="h-5 w-5 text-green-600" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{training.title}</h4>
                    <p className="text-sm text-gray-600">
                      {training.status === "Completed"
                        ? `Completed: ${new Date(training.completedDate!).toLocaleDateString()}`
                        : `Due: ${new Date(training.deadline!).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <Badge variant={training.status === "Completed" ? "default" : "secondary"}>
                  {training.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skill Graph */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Proficiency Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {["React", "TypeScript", "Leadership", "Communication", "Analytics"].map((skill, idx) => {
              const proficiency = [85, 75, 60, 80, 45][idx];
              return (
                <div key={skill} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{skill}</span>
                    <span className="text-sm text-gray-600">{proficiency}%</span>
                  </div>
                  <Progress value={proficiency} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
