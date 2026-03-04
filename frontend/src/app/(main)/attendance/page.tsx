"use client";

import { useState, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Plus,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { useAttendanceRecords, useTasks } from "../../lib/hooks";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../components/ui/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Card, CardContent } from "../../components/ui/card";
import { AssignTaskDialog } from "../../components/AssignTaskDialog";

interface Holiday {
  date: string;
  name: string;
}

interface AttendanceRecord {
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
}

export default function AttendancePage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [selectedDayItems, setSelectedDayItems] = useState<{
    date: Date;
    items: { type: string; content: any }[];
  } | null>(null);
  const [isMoreDialogOpen, setIsMoreDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [initialDueDate, setInitialDueDate] = useState<string | undefined>();

  const { data: rawAttendance, refetch: refetchAttendance } =
    useAttendanceRecords({
      startDate: format(startOfMonth(currentDate), "yyyy-MM-dd"),
      endDate: format(endOfMonth(currentDate), "yyyy-MM-dd"),
    });

  const { data: tasks = [], refetch: refetchTasks } = useTasks({
    filterType: "involved",
  });

  useEffect(() => {
    if (rawAttendance) {
      setAttendanceRecords(
        rawAttendance.map((record: any) => ({
          date: record.date.split("T")[0],
          status:
            record.status === "LEAVE"
              ? "Leave"
              : record.status.charAt(0).toUpperCase() +
                record.status.slice(1).toLowerCase(),
          checkIn: record.checkIn
            ? format(new Date(record.checkIn), "hh:mm a")
            : undefined,
          checkOut: record.checkOut
            ? format(new Date(record.checkOut), "hh:mm a")
            : undefined,
        })),
      );
    }
  }, [rawAttendance]);

  useEffect(() => {
    // Try fetching real SL holidays for the current year
    const fetchHolidays = async () => {
      const year = currentDate.getFullYear();
      try {
        const res = await fetch(`/api/holidays?year=${year}`);
        if (res.ok) {
          const data = await res.json();
          if (data.holidays && Array.isArray(data.holidays)) {
            setHolidays(data.holidays);
          } else {
            setHolidays([]);
          }
        } else {
          setHolidays([]);
        }
      } catch (e) {
        console.error("Holiday API Error:", e);
        setHolidays([]);
      }
    };
    fetchHolidays();
  }, [currentDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getDayStatusColor = (status: string) => {
    switch (status) {
      case "Present":
      case "PRESENT":
        return "bg-green-50 text-green-700 border-green-200";
      case "Absent":
      case "ABSENT":
        return "bg-red-50 text-red-700 border-red-200";
      case "Late":
      case "LATE":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Half Day":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Leave":
      case "LEAVE":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Holiday":
      case "HOLIDAY":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-700 border-red-200";
      case "MEDIUM":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleDayClick = (
    dayItem: Date,
    items: { type: string; content: any }[],
  ) => {
    if (items.length > 0) {
      setSelectedDayItems({ date: dayItem, items });
      setIsMoreDialogOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Attendance & Tasks
          </h1>
          <p className="text-gray-500">
            View your personal schedule, tasks, and attendance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevMonth}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium text-gray-900 min-w-[120px] text-center">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[700px]">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="py-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-200 last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 grid grid-cols-7 bg-gray-200 gap-px">
          {days.map((dayItem) => {
            const dateStr = format(dayItem, "yyyy-MM-dd");
            const holiday = holidays.find((h) => h.date === dateStr);
            const record = attendanceRecords.find((r) => r.date === dateStr);
            const dayTasks = tasks.filter(
              (t: any) =>
                t.dueDate &&
                format(new Date(t.dueDate), "yyyy-MM-dd") === dateStr,
            );

            const isToday = isSameDay(dayItem, new Date());
            const isCurrentMonth = isSameMonth(dayItem, monthStart);

            // Items to display
            const displayItems: { type: string; content: any }[] = [];
            if (holiday)
              displayItems.push({ type: "holiday", content: holiday });
            if (record && !holiday)
              displayItems.push({ type: "attendance", content: record });
            dayTasks.forEach((task) =>
              displayItems.push({ type: "task", content: task }),
            );

            const maxVisible = 2;
            const visibleItems = displayItems.slice(0, maxVisible);
            const hiddenCount = displayItems.length - maxVisible;

            return (
              <div
                key={dayItem.toString()}
                onClick={() => handleDayClick(dayItem, displayItems)}
                className={`min-h-[120px] bg-white p-1.5 relative flex flex-col group transition-all overflow-hidden
                  ${!isCurrentMonth ? "bg-gray-50/50" : ""}
                  ${isToday ? "ring-2 ring-blue-500 ring-inset z-10" : ""}
                  ${displayItems.length > 0 ? "cursor-pointer hover:bg-gray-50" : ""}
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
                      ${isToday ? "bg-blue-600 text-white shadow-sm" : isCurrentMonth ? "text-gray-700" : "text-gray-300"}
                    `}
                  >
                    {format(dayItem, "d")}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInitialDueDate(format(dayItem, "yyyy-MM-dd"));
                      setIsAssignDialogOpen(true);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex-1 flex flex-col gap-1 overflow-hidden pointer-events-none">
                  {visibleItems.map((item, idx) => (
                    <div key={idx} className="w-full">
                      {item.type === "holiday" && (
                        <div className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded border border-purple-200 truncate font-semibold">
                          🎉 {item.content.name}
                        </div>
                      )}
                      {item.type === "attendance" && (
                        <div
                          className={`text-[10px] px-1.5 py-0.5 rounded border truncate font-semibold ${getDayStatusColor(item.content.status)}`}
                        >
                          📍 {item.content.status}{" "}
                          {item.content.checkIn
                            ? `(${item.content.checkIn})`
                            : ""}
                        </div>
                      )}
                      {item.type === "task" && (
                        <div
                          className={`text-[10px] px-1.5 py-0.5 rounded border truncate font-semibold ${getPriorityColor(item.content.priority)}`}
                        >
                          📝 {item.content.title}
                        </div>
                      )}
                    </div>
                  ))}

                  {hiddenCount > 0 && (
                    <div className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-full w-fit mt-0.5">
                      + {hiddenCount} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* More Items Dialog */}
      <Dialog open={isMoreDialogOpen} onOpenChange={setIsMoreDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Schedule for</span>
              <span className="text-primary font-bold">
                {selectedDayItems &&
                  format(selectedDayItems.date, "MMMM dd, yyyy")}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            {selectedDayItems?.items.map((item, idx) => (
              <Card
                key={idx}
                className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-3">
                  {item.type === "holiday" && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                        🎉
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          Public Holiday
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.content.name}
                        </p>
                      </div>
                    </div>
                  )}
                  {item.type === "attendance" && (
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          getDayStatusColor(item.content.status),
                        )}
                      >
                        📍
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-gray-900">
                            Attendance: {item.content.status}
                          </p>
                        </div>
                        {(item.content.checkIn || item.content.checkOut) && (
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>IN: {item.content.checkIn || "--:--"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                OUT: {item.content.checkOut || "--:--"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {item.type === "task" && (
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          getPriorityColor(item.content.priority),
                        )}
                      >
                        📝
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-gray-900">
                            {item.content.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-bold",
                              getPriorityColor(item.content.priority),
                            )}
                          >
                            {item.content.priority}
                          </Badge>
                        </div>
                        {item.content.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {item.content.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                          <Badge className="text-[10px] uppercase font-bold">
                            {item.content.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>
                              Due{" "}
                              {format(
                                new Date(item.content.dueDate),
                                "hh:mm a",
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AssignTaskDialog
        open={isAssignDialogOpen}
        onOpenChange={(open) => {
          setIsAssignDialogOpen(open);
          if (!open) setInitialDueDate(undefined);
        }}
        onSuccess={refetchTasks}
        initialDueDate={initialDueDate}
      />
    </div>
  );
}
