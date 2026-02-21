"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  Target,
  GraduationCap,
  TrendingUp,
  MessageSquare,
  Shield,
  Settings,
  Menu,
  X,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { initializeAuth } from "../lib/auth";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Departments", href: "/departments", icon: Building2 },
  { name: "Recruitment", href: "/recruitment", icon: Briefcase },
  { name: "Payroll", href: "/payroll", icon: DollarSign },
  { name: "Leave & Attendance", href: "/leave", icon: Calendar },
  { name: "Performance", href: "/performance", icon: Target },
  { name: "Learning & Development", href: "/learning", icon: GraduationCap },
  { name: "Workforce Planning", href: "/workforce-planning", icon: TrendingUp },
  { name: "Engagement & Surveys", href: "/engagement", icon: MessageSquare },
  { name: "Compliance", href: "/compliance", icon: Shield },
  { name: "Templates", href: "/admin/templates", icon: FileText },
  { name: "Documents", href: "/admin/documents", icon: FolderOpen },
  { name: "Admin Logs", href: "/admin/logs", icon: Settings },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth().catch(console.error);
  }, []);

  // Persist sidebar state in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          sidebarCollapsed ? "w-16 lg:w-16" : "w-64 lg:w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className={cn(
              "flex items-center gap-2 transition-opacity duration-300",
              sidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">NG</span>
              </div>
              <span className="font-semibold text-gray-900 whitespace-nowrap">NG-IHRP</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2 lg:p-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative",
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-100",
                        sidebarCollapsed && "justify-center"
                      )}
                      onClick={() => setSidebarOpen(false)}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className={cn(
                        "transition-opacity duration-300 whitespace-nowrap",
                        sidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                      )}>
                        {item.name}
                      </span>
                      {sidebarCollapsed && (
                        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info */}
          <div className={cn(
            "p-4 border-t border-gray-200",
            sidebarCollapsed && "px-2"
          )}>
            <div className={cn(
              "flex items-center gap-3",
              sidebarCollapsed && "justify-center"
            )}>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-700 text-sm font-medium">AD</span>
              </div>
              <div className={cn(
                "flex-1 min-w-0 transition-opacity duration-300",
                sidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}>
                <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@company.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden mr-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {navigation.find(
                (item) =>
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href))
              )?.name || "Dashboard"}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto min-w-0">
          <div className="w-full max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
