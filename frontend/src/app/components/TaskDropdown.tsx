"use client";

import { useState, useEffect, useRef } from "react";
import { Inbox, X, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { api } from "../lib/api";
import { useRouter } from "next/navigation";
import { cn } from "./ui/utils";

export function TaskDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    loadTasks();
    loadActiveCount();

    // Poll for new tasks every 30 seconds
    const interval = setInterval(() => {
      loadActiveCount();
      if (isOpen) {
        loadTasks();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await api.getTasks({ status: 'all', limit: 10, offset: 0 }) as any;
      setTasks(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveCount = async () => {
    try {
      const data = await api.getActiveTaskCount() as any;
      setActiveCount(data?.count || 0);
    } catch (error) {
      console.error('Error loading active task count:', error);
    }
  };

  const handleTaskClick = (task: any) => {
    router.push('/tasks');
    setIsOpen(false);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'MEDIUM':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      default:
        return <Circle className="h-3 w-3 text-gray-400" />;
    }
  };

  const isOverdue = (dueDate: string | Date | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 relative"
        title="Tasks"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Inbox className="h-5 w-5 text-gray-600" />
        {activeCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-500 text-white border-0">
            {activeCount > 9 ? '9+' : activeCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">My Tasks</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : tasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Inbox className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No tasks</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <button
                    key={task._id || task.id}
                    onClick={() => handleTaskClick(task)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {task.title}
                          </p>
                          {getPriorityIcon(task.priority)}
                        </div>
                        {task.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              task.status === 'NEW' && "bg-blue-50 text-blue-700",
                              task.status === 'IN_PROGRESS' && "bg-yellow-50 text-yellow-700",
                              task.status === 'COMPLETED' && "bg-green-50 text-green-700"
                            )}
                          >
                            {task.status.replace('_', ' ')}
                          </Badge>
                          {task.dueDate && (
                            <span className={cn(
                              isOverdue(task.dueDate) && "text-red-600 font-medium"
                            )}>
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {tasks.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  router.push('/tasks');
                  setIsOpen(false);
                }}
              >
                View all tasks
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
