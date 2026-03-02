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
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { useAttendanceRecords } from "../../lib/hooks";

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

  const { data: rawAttendance, refetch: refetchAttendance } =
    useAttendanceRecords({
      startDate: format(startOfMonth(currentDate), "yyyy-MM-dd"),
      endDate: format(endOfMonth(currentDate), "yyyy-MM-dd"),
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
      let mappedHolidays: Holiday[] = [];

      try {
        // Fetching the Sri Lankan holidays from our own robust Next.js server API
        const res = await fetch(`/api/holidays?year=${year}`);

        if (res.ok) {
          const data = await res.json();
          if (data.holidays && Array.isArray(data.holidays)) {
            setHolidays(data.holidays);
          } else {
            console.warn(
              "Invalid API format received from our internal API",
              data,
            );
            setHolidays([]);
          }
        } else {
          console.error("Internal API failed with status:", res.status);
          setHolidays([]);
        }
      } catch (e) {
        console.error("Holiday API Error:", e);
        setHolidays([]); // Ensure calendar renders cleanly rather than crashing if fetching fails
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Attendance Calendar
          </h1>
          <p className="text-gray-500">
            View your daily attendance and upcoming holidays.
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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[600px]">
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
        <div className="flex-1 grid grid-cols-7 grid-auto-rows-fr bg-gray-200 gap-px">
          {days.map((dayItem) => {
            const dateStr = format(dayItem, "yyyy-MM-dd");
            const holiday = holidays.find((h) => h.date === dateStr);
            const record = attendanceRecords.find((r) => r.date === dateStr);
            const isToday = isSameDay(dayItem, new Date());
            const isCurrentMonth = isSameMonth(dayItem, monthStart);
            const isWeekend = dayItem.getDay() === 0 || dayItem.getDay() === 6;

            return (
              <div
                key={dayItem.toString()}
                className={`min-h-[100px] bg-white p-2 relative flex flex-col group transition-colors overflow-hidden
                  ${!isCurrentMonth ? "bg-gray-50/50" : ""}
                  ${isToday ? "ring-2 ring-blue-500 ring-inset" : ""}
                  ${isWeekend && !holiday ? "bg-gray-50/20" : ""}
                `}
              >
                <div className="flex justify-between items-start mb-1">
                  <span
                    className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                      ${isToday ? "bg-blue-600 text-white" : isCurrentMonth ? "text-gray-900" : "text-gray-400"}
                    `}
                  >
                    {format(dayItem, "d")}
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[100px] no-scrollbar">
                  {holiday && (
                    <div
                      className="text-[11px] px-1.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded flex items-start gap-1 leading-tight"
                      title={holiday.name}
                    >
                      <CalendarIcon className="h-3 w-3 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{holiday.name}</span>
                    </div>
                  )}

                  {record && !holiday && (
                    <div
                      className={`text-xs px-2 py-1.5 border rounded-md flex flex-col gap-0.5 ${getDayStatusColor(record.status)}`}
                    >
                      <span className="font-medium">{record.status}</span>
                      {(record.checkIn || record.checkOut) && (
                        <div className="flex items-center gap-1 opacity-80 mt-0.5 text-[10px]">
                          <Clock className="w-3 h-3" />
                          <span>
                            {record.checkIn || "--"} - {record.checkOut || "--"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
