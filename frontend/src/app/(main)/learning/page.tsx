"use client";

import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { GraduationCap, BookOpen, Eye, Clock, Calendar } from "lucide-react";
import { WorkdayTable, WorkdayTableColumn, TableToolbarActions } from "../../components/ui/WorkdayTable";

export default function Learning() {
  // Required for You courses
  const requiredCourses = [
    {
      id: "1",
      title: "Information Security Awareness",
      type: "Course",
      duration: "15 minutes",
      dueDate: "2026-03-15",
      image: null,
    },
    {
      id: "2",
      title: "Code of Conduct",
      type: "Course",
      duration: "30 minutes",
      dueDate: "2026-03-20",
      image: null,
    },
    {
      id: "3",
      title: "Data Privacy & GDPR",
      type: "Course",
      duration: "45 minutes",
      dueDate: "2026-03-01",
      image: null,
    },
  ];

  // Transcript data
  const notStarted: any[] = [];
  const inProgress: any[] = [];
  const learningHistory: any[] = [];

  const transcriptColumns: WorkdayTableColumn<any>[] = [
    {
      key: "title",
      header: "Course Title",
      align: "left",
      render: (row) => row.title || "N/A",
    },
    {
      key: "type",
      header: "Type",
      align: "left",
      render: (row) => row.type || "N/A",
    },
    {
      key: "duration",
      header: "Duration",
      align: "left",
      render: (row) => row.duration || "N/A",
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (row) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          {row.status || "N/A"}
        </Badge>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      align: "right",
      render: (row) => row.progress ? `${row.progress}%` : "N/A",
    },
    {
      key: "completedDate",
      header: "Completed Date",
      align: "left",
      render: (row) =>
        row.completedDate
          ? new Date(row.completedDate).toLocaleDateString()
          : "N/A",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Learning Home */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          What will you learn today?
        </h1>

        {/* Required for You */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Required for You</h2>
          <div className="space-y-4">
            {requiredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    {/* Course Image/Icon */}
                    <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-white" />
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              <Calendar className="h-3 w-3 mr-1" />
                              Due: {new Date(course.dueDate).toLocaleDateString()}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {course.title}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>{course.type}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {course.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      <Button variant="outline" className="flex items-center gap-2">
                        <span>View Course</span>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Most Popular */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Most Popular</h2>
            <Button variant="outline" className="rounded-full">
              View More
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            Popular courses will be displayed here.
          </div>
        </div>
      </div>

      {/* My Transcript */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900">My Transcript</h2>

        {/* Not Started */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Not Started</h3>
          <WorkdayTable
            columns={transcriptColumns}
            data={notStarted}
            getRowKey={(row, index) => row.id || `not-started-${index}`}
            itemCountLabel={`${notStarted.length} item${notStarted.length !== 1 ? "s" : ""}`}
            emptyMessage="No items available."
            headerActions={<TableToolbarActions />}
          />
        </div>

        {/* In Progress */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">In Progress</h3>
          <WorkdayTable
            columns={transcriptColumns}
            data={inProgress}
            getRowKey={(row, index) => row.id || `in-progress-${index}`}
            itemCountLabel={`${inProgress.length} item${inProgress.length !== 1 ? "s" : ""}`}
            emptyMessage="No items available."
            headerActions={<TableToolbarActions />}
          />
        </div>

        {/* Learning History */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning History</h3>
          <WorkdayTable
            columns={transcriptColumns}
            data={learningHistory}
            getRowKey={(row, index) => row.id || `history-${index}`}
            itemCountLabel={`${learningHistory.length} item${learningHistory.length !== 1 ? "s" : ""}`}
            emptyMessage="No items available."
            headerActions={<TableToolbarActions />}
          />
        </div>
      </div>
    </div>
  );
}
