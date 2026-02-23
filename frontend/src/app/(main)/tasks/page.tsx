"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { WorkdayTable, WorkdayTableColumn, TableToolbarActions } from "@/app/components/ui/WorkdayTable";
import { api } from "@/app/lib/api";
import { Inbox, CheckCircle2, Circle, Clock, AlertCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/app/components/ui/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [overdueFilter, setOverdueFilter] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter, overdueFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await api.getTasks({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        overdue: overdueFilter || undefined,
        limit: 100,
        offset: 0,
      }) as any;
      setTasks(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task: any) => {
    // Navigate based on related entity
    if (task.relatedEntityType === 'REQUISITION' && task.relatedEntityId) {
      router.push(`/recruitment/requisitions/${task.relatedEntityId}`);
    } else if (task.relatedEntityType === 'CANDIDATE' && task.relatedEntityId) {
      router.push(`/recruitment/candidates/${task.relatedEntityId}`);
    } else {
      // Show task detail in a modal or navigate to task detail page
      // For now, just show alert
      alert(`Task: ${task.title}\n\n${task.description || 'No description'}`);
    }
  };

  const handleMarkComplete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.updateTask(taskId, { status: 'COMPLETED' });
      setTasks(prev =>
        prev.map(t => (t._id === taskId || t.id === taskId)
          ? { ...t, status: 'COMPLETED' }
          : t
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'MEDIUM':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const isOverdue = (dueDate: string | Date | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const columns: WorkdayTableColumn<any>[] = [
    {
      key: "status",
      header: "",
      align: "left",
      width: "40px",
      render: (row) => (
        <div className="flex items-center justify-center">
          {row.status === 'COMPLETED' ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      key: "title",
      header: "Title",
      align: "left",
      render: (row) => (
        <div>
          <p className="font-medium text-sm text-gray-900">{row.title}</p>
          {row.description && (
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
              {row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "relatedEntity",
      header: "Related To",
      align: "left",
      render: (row) => (
        <Badge variant="outline" className="text-xs">
          {row.relatedEntityType}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      align: "left",
      render: (row) => (
        <div className="flex items-center gap-1">
          {getPriorityIcon(row.priority)}
          <span className="text-sm text-gray-600">{row.priority}</span>
        </div>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      align: "left",
      render: (row) => (
        <span className={cn(
          "text-sm",
          isOverdue(row.dueDate) && row.status !== 'COMPLETED'
            ? "text-red-600 font-medium"
            : "text-gray-600"
        )}>
          {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : 'No due date'}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "left",
      render: (row) => (
        <Badge
          className={cn(
            "text-xs",
            row.status === 'NEW' && "bg-blue-100 text-blue-700",
            row.status === 'IN_PROGRESS' && "bg-yellow-100 text-yellow-700",
            row.status === 'COMPLETED' && "bg-green-100 text-green-700",
            row.status === 'CANCELLED' && "bg-gray-100 text-gray-700"
          )}
        >
          {row.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex gap-2 justify-end">
          {row.status !== 'COMPLETED' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleMarkComplete(row._id || row.id, e)}
              title="Mark as completed"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600 mt-1">Manage your assigned tasks</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <CardTitle>Filters</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={overdueFilter ? "default" : "outline"}
              size="sm"
              onClick={() => setOverdueFilter(!overdueFilter)}
            >
              Overdue Only
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <WorkdayTable
            columns={columns}
            data={tasks}
            getRowKey={(row) => row._id || row.id}
            isLoading={loading}
            emptyMessage="No tasks found"
            headerActions={<TableToolbarActions />}
            onRowClick={handleTaskClick}
          />
        </CardContent>
      </Card>
    </div>
  );
}
