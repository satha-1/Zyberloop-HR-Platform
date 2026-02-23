"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { WorkdayTable, WorkdayTableColumn, TableToolbarActions } from "@/app/components/ui/WorkdayTable";
import { api } from "@/app/lib/api";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/app/components/ui/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications({
        onlyUnread: filter === 'unread',
        limit: 100,
        offset: 0,
      }) as any;
      setNotifications(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId || n.id === notificationId)
          ? { ...n, isRead: true }
          : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id || notification.id);
    }

    // Navigate based on entity type
    if (notification.entityType === 'REQUISITION' && notification.entityId) {
      router.push(`/recruitment/requisitions/${notification.entityId}`);
    } else if (notification.entityType === 'CANDIDATE' && notification.entityId) {
      router.push(`/recruitment/candidates/${notification.entityId}`);
    } else if (notification.entityType === 'TASK' && notification.entityId) {
      router.push(`/tasks`);
    }
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
  };

  const columns: WorkdayTableColumn<any>[] = [
    {
      key: "read",
      header: "",
      align: "left",
      width: "40px",
      render: (row) => (
        <div className="flex items-center justify-center">
          {!row.isRead && (
            <div className="w-2 h-2 bg-blue-600 rounded-full" />
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
          <p className="text-xs text-gray-600 mt-0.5">{row.message}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      align: "left",
      render: (row) => (
        <Badge variant="outline" className="text-xs">
          {row.type.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Time",
      align: "left",
      render: (row) => (
        <span className="text-sm text-gray-600">
          {formatTimeAgo(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex gap-2 justify-end">
          {!row.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsRead(row._id || row.id);
              }}
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
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
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">View and manage your notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={notifications.filter(n => !n.isRead).length === 0}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 -mb-px">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as 'all' | 'unread')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors relative",
                filter === tab.id
                  ? "text-blue-700 border-b-2 border-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <Card>
        <CardContent className="p-0">
          <WorkdayTable
            columns={columns}
            data={notifications}
            getRowKey={(row) => row._id || row.id}
            isLoading={loading}
            emptyMessage="No notifications found"
            headerActions={<TableToolbarActions />}
            onRowClick={handleNotificationClick}
          />
        </CardContent>
      </Card>
    </div>
  );
}
