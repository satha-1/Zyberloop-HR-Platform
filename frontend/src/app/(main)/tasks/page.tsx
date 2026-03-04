"use client";

import { useState, Suspense, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { useTasks } from "@/app/lib/hooks";
import {
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  ListTodo,
  History,
  LayoutGrid,
  List,
} from "lucide-react";
import { AssignTaskDialog } from "@/app/components/AssignTaskDialog";
import { TaskCalendar } from "@/app/components/TaskCalendar";
import { format } from "date-fns";
import { cn } from "@/app/components/ui/utils";

// Force dynamic rendering
export const dynamic = "force-dynamic";

function TasksContent() {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [initialDueDate, setInitialDueDate] = useState<string | undefined>();

  // Fetch tasks assigned BY the current user (Task Management view)
  const {
    data: managedTasks = [],
    loading,
    refetch,
  } = useTasks({ filterType: "assigned" });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "NEW":
        return "bg-purple-100 text-purple-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTasks = managedTasks.filter((task: any) => {
    if (activeTab === "all") return true;
    return task.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-600 mt-1">
            Assign tasks to employees and track their completion status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 p-1 rounded-lg">
            <Button
              variant={viewMode === "list" ? "outline" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn(
                "h-8 gap-2 px-3",
                viewMode === "list" && "bg-white shadow-sm",
              )}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </Button>
            <Button
              variant={viewMode === "calendar" ? "outline" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className={cn(
                "h-8 gap-2 px-3",
                viewMode === "calendar" && "bg-white shadow-sm",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
          </div>
          <Button
            onClick={() => setIsAssignDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Assign Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-purple-50 border-purple-100 shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
                <ListTodo className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">
                  Active Tasks
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {
                    managedTasks.filter((t: any) => t.status !== "COMPLETED")
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100 shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg text-green-700">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-900">
                  {
                    managedTasks.filter((t: any) => t.status === "COMPLETED")
                      .length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100 shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Assigned by Me
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {managedTasks.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">Assignment History</TabsTrigger>
            <TabsTrigger value="NEW">New</TabsTrigger>
            <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
          </TabsList>
        </div>

        {viewMode === "list" ? (
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <div className="rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="w-[300px]">Task Details</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-20 text-gray-500"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p>Loading your assigned tasks...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredTasks.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-20 text-gray-500"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <History className="h-10 w-10 text-gray-200" />
                            <p className="text-lg font-medium text-gray-400">
                              No task history found
                            </p>
                            <p className="text-sm text-gray-400">
                              Assign a new task to get started
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTasks.map((task: any) => (
                        <TableRow
                          key={task._id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-900">
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-gray-500 font-normal line-clamp-1">
                                  {task.description}
                                </p>
                              )}
                              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Created{" "}
                                {format(
                                  new Date(task.createdAt),
                                  "MMM dd, hh:mm a",
                                )}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-bold">
                                {task.userId?.slice(-2).toUpperCase() || "UN"}
                              </div>
                              <span className="text-sm text-gray-600">
                                User: {task.userId?.slice(-6)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] font-bold",
                                getPriorityColor(task.priority),
                              )}
                            >
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "text-sm",
                                task.dueDate &&
                                  new Date(task.dueDate) < new Date() &&
                                  task.status !== "COMPLETED"
                                  ? "text-red-600 font-medium"
                                  : "text-gray-600",
                              )}
                            >
                              {task.dueDate
                                ? format(new Date(task.dueDate), "MMM dd, yyyy")
                                : "No deadline"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "text-[10px] uppercase font-bold",
                                getStatusColor(task.status),
                              )}
                            >
                              {task.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="min-h-[600px]">
            {loading ? (
              <Card className="h-[600px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-gray-500">Loading calendar...</p>
                </div>
              </Card>
            ) : (
              <TaskCalendar
                tasks={filteredTasks}
                onAddTaskClick={(date) => {
                  setInitialDueDate(format(date, "yyyy-MM-dd"));
                  setIsAssignDialogOpen(true);
                }}
              />
            )}
          </div>
        )}
      </Tabs>

      <AssignTaskDialog
        open={isAssignDialogOpen}
        onOpenChange={(open) => {
          setIsAssignDialogOpen(open);
          if (!open) setInitialDueDate(undefined);
        }}
        onSuccess={refetch}
        initialDueDate={initialDueDate}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div>Loading Task Management...</div>}>
      <TasksContent />
    </Suspense>
  );
}
