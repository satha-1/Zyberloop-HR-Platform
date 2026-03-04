"use client";

import React, { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Clock,
  Plus,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate: string;
  userId: string;
  createdAt: string;
}

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onAddTaskClick?: (date: Date) => void;
}

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

export function TaskCalendar({
  tasks,
  onTaskClick,
  onAddTaskClick,
}: TaskCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isMoreDialogOpen, setIsMoreDialogOpen] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), day);
    });
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleMoreClick = (day: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDay(day);
    setIsMoreDialogOpen(true);
  };

  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex items-center bg-gray-50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="h-8 px-3 text-xs font-medium"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 bg-gray-50/50 border-b border-gray-100">
        {dayLabels.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map((day, idx) => {
          const dayTasks = getTasksForDay(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthStart);
          const displayTasks = dayTasks.slice(0, 2);
          const moreCount = dayTasks.length - displayTasks.length;

          return (
            <div
              key={day.toString()}
              onClick={() =>
                dayTasks.length > 0 && handleMoreClick(day, {} as any)
              }
              className={cn(
                "min-h-[120px] p-2 border-r border-b border-gray-100 flex flex-col gap-1 transition-all",
                dayTasks.length > 0 && "cursor-pointer hover:bg-gray-50",
                !isCurrentMonth && "bg-gray-50/30 text-gray-400",
                idx % 7 === 6 && "border-r-0",
              )}
            >
              <div className="flex justify-between items-center mb-1">
                <span
                  className={cn(
                    "text-sm font-semibold h-7 w-7 flex items-center justify-center rounded-full transition-colors",
                    isToday
                      ? "bg-primary text-white shadow-sm"
                      : isCurrentMonth
                        ? "text-gray-700 hover:bg-gray-100"
                        : "text-gray-400",
                  )}
                >
                  {format(day, "d")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTaskClick?.(day);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex flex-col gap-1 overflow-hidden">
                {displayTasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick?.(task);
                    }}
                    className={cn(
                      "px-2 py-1 text-[10px] rounded border cursor-pointer truncate font-medium transition-all hover:brightness-95 active:scale-[0.98]",
                      getPriorityColor(task.priority),
                    )}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {moreCount > 0 && (
                  <div className="text-[10px] text-primary font-bold px-2 py-0.5 mt-0.5 bg-primary/5 rounded-full w-fit">
                    + {moreCount} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* More Tasks Dialog */}
      <Dialog open={isMoreDialogOpen} onOpenChange={setIsMoreDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Tasks for</span>
              <span className="text-primary font-bold">
                {selectedDay && format(selectedDay, "MMMM dd, yyyy")}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {selectedDayTasks.length > 0 ? (
              selectedDayTasks.map((task) => (
                <Card
                  key={task._id}
                  className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary"
                  onClick={() => {
                    onTaskClick?.(task);
                    setIsMoreDialogOpen(false);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-gray-900 leading-tight">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold shrink-0",
                          getPriorityColor(task.priority),
                        )}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={cn(
                            "text-[10px] uppercase font-bold",
                            getStatusColor(task.status),
                          )}
                        >
                          {task.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(task.createdAt), "hh:mm a")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-10 text-center text-gray-400 italic">
                No tasks for this day
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
