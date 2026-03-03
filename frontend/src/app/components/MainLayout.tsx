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
  ChevronDown,
  FileText,
  FolderOpen,
  Home,
  Search,
  Printer,
} from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { TaskDropdown } from "./TaskDropdown";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { initializeAuth } from "../lib/auth";

// Navigation structure with grouped sections
interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string; // Optional href for sections that can navigate directly (like Home)
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    title: "Home",
    icon: Home,
    href: "/", // Home section navigates directly to Dashboard
    items: [{ name: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    title: "Workforce Management",
    icon: Users,
    items: [
      { name: "Employees", href: "/employees", icon: Users },
      { name: "Departments", href: "/departments", icon: Building2 },
    ],
  },
  {
    title: "Talent Management",
    icon: Briefcase,
    items: [
      { name: "Recruitment", href: "/recruitment", icon: Briefcase },
      { name: "Performance Management", href: "/performance", icon: Target },
      {
        name: "Learning & Development",
        href: "/learning",
        icon: GraduationCap,
      },
      {
        name: "Workforce Planning",
        href: "/workforce-planning",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Attendance & Compensation",
    icon: DollarSign,
    items: [
      { name: "Compensation & Payroll", href: "/payroll", icon: DollarSign },
      { name: "Leave", href: "/leave", icon: Calendar },
      { name: "Attendance", href: "/attendance", icon: Calendar },
    ],
  },
  {
    title: "Engagement & Experience",
    icon: MessageSquare,
    items: [
      {
        name: "Engagement & Surveys",
        href: "/engagement",
        icon: MessageSquare,
      },
    ],
  },
  {
    title: "Compliance & Administration",
    icon: Shield,
    items: [
      { name: "Regulatory Compliance", href: "/compliance", icon: Shield },
      { name: "Document Templates", href: "/admin/templates", icon: FileText },
      {
        name: "Documents & Letters",
        href: "/admin/documents",
        icon: FolderOpen,
      },
      { name: "System Audit Logs", href: "/admin/logs", icon: Settings },
    ],
  },
];

// Flattened navigation for header title lookup (backward compatibility)
const navigation: NavItem[] = navigationSections.flatMap(
  (section) => section.items,
);

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Track expanded/collapsed state for each section
  // Initialize with default collapsed state (hydration-safe)
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(() => {
    // Default: all sections collapsed
    const initialState: Record<string, boolean> = {};
    navigationSections.forEach((section) => {
      initialState[section.title] = false;
    });
    return initialState;
  });

  // Load from localStorage after mount (client-side only, prevents hydration mismatch)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sidebarExpandedSections");
        if (saved) {
          const parsed = JSON.parse(saved);
          setExpandedSections(parsed);
        }
      } catch {
        // If parsing fails, keep defaults
      }
    }
  }, []);

  // Auto-expand section if it contains the active item (on initial load and route change)
  useEffect(() => {
    navigationSections.forEach((section) => {
      const hasActiveItem = section.items.some(
        (item) =>
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href)),
      );
      if (hasActiveItem) {
        setExpandedSections((prev) => ({
          ...prev,
          [section.title]: true,
        }));
      }
    });
  }, [pathname]);

  // Persist expanded sections state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "sidebarExpandedSections",
        JSON.stringify(expandedSections),
      );
    }
  }, [expandedSections]);

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth().catch(console.error);
  }, []);

  // Persist sidebar state in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarCollapsed");
      if (saved !== null) {
        setSidebarCollapsed(JSON.parse(saved));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "sidebarCollapsed",
        JSON.stringify(sidebarCollapsed),
      );
    }
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
          sidebarCollapsed ? "w-16 lg:w-16" : "w-[260px] lg:w-[260px]",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div
              className={cn(
                "flex items-center gap-2 transition-opacity duration-300",
                sidebarCollapsed
                  ? "opacity-0 w-0 overflow-hidden"
                  : "opacity-100",
              )}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">ZJ</span>
              </div>
              <span className="font-semibold text-gray-900 whitespace-nowrap">
                ZyberJR
              </span>
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
            <div className="space-y-1">
              {navigationSections.map((section) => {
                // Check if any child item in this section is active
                const hasActiveChild = section.items.some(
                  (item) =>
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href)),
                );

                const isExpanded = expandedSections[section.title] ?? false;
                const isHome = section.title === "Home";
                // All sections except Home are collapsible accordions (even with single child)
                const isCollapsible = !isHome;

                return (
                  <div key={section.title} className="space-y-1">
                    {/* Section Header */}
                    {isHome && section.href ? (
                      // Home section: direct link to Dashboard
                      <Link
                        href={section.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative",
                          hasActiveChild
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-100",
                          sidebarCollapsed && "justify-center",
                        )}
                        onClick={() => setSidebarOpen(false)}
                        title={section.title}
                        aria-current={hasActiveChild ? "page" : undefined}
                      >
                        <section.icon className="h-5 w-5 flex-shrink-0" />
                        <span
                          className={cn(
                            "transition-opacity duration-300 whitespace-nowrap truncate min-w-0",
                            sidebarCollapsed
                              ? "opacity-0 w-0 overflow-hidden"
                              : "opacity-100",
                          )}
                          title={section.title}
                        >
                          {section.title}
                        </span>
                        {sidebarCollapsed && (
                          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                            {section.title}
                          </span>
                        )}
                      </Link>
                    ) : (
                      // Other sections: accordion header (non-routable, toggle only)
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleSection(section.title);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative",
                          // Neutral hover, never active highlight for parent headers
                          "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                          sidebarCollapsed && "justify-center",
                        )}
                        title={section.title}
                        type="button"
                        aria-expanded={isExpanded}
                      >
                        <section.icon className="h-5 w-5 flex-shrink-0 text-gray-500" />
                        <span
                          className={cn(
                            "flex-1 text-left transition-opacity duration-300 whitespace-nowrap truncate min-w-0",
                            sidebarCollapsed
                              ? "opacity-0 w-0 overflow-hidden"
                              : "opacity-100",
                          )}
                          title={section.title}
                        >
                          {section.title}
                        </span>
                        {!sidebarCollapsed && (
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 transition-transform duration-200 flex-shrink-0 text-gray-400 ml-auto",
                              isExpanded && "transform rotate-90",
                            )}
                          />
                        )}
                        {sidebarCollapsed && (
                          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                            {section.title}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Section Items - Only shown when expanded (or when sidebar is collapsed) */}
                    {!isHome && (!sidebarCollapsed ? isExpanded : true) && (
                      <ul
                        className={cn(
                          "space-y-1 transition-all duration-200",
                          !sidebarCollapsed && "ml-6 pl-2", // Indent child items with padding
                        )}
                      >
                        {section.items.map((item) => {
                          const isActive =
                            pathname === item.href ||
                            (item.href !== "/" &&
                              pathname.startsWith(item.href));
                          return (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative",
                                  isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-700 hover:bg-gray-100",
                                  sidebarCollapsed && "justify-center",
                                )}
                                onClick={() => setSidebarOpen(false)}
                                title={item.name}
                                aria-current={isActive ? "page" : undefined}
                              >
                                <item.icon className="h-5 w-5 flex-shrink-0" />
                                <span
                                  className={cn(
                                    "transition-opacity duration-300 whitespace-nowrap truncate min-w-0",
                                    sidebarCollapsed
                                      ? "opacity-0 w-0 overflow-hidden"
                                      : "opacity-100",
                                  )}
                                  title={item.name}
                                >
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
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* User info */}
          <div
            className={cn(
              "p-4 border-t border-gray-200",
              sidebarCollapsed && "px-2",
            )}
          >
            <div
              className={cn(
                "flex items-center gap-3",
                sidebarCollapsed && "justify-center",
              )}
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-700 text-sm font-medium">AD</span>
              </div>
              <div
                className={cn(
                  "flex-1 min-w-0 transition-opacity duration-300",
                  sidebarCollapsed
                    ? "opacity-0 w-0 overflow-hidden"
                    : "opacity-100",
                )}
              >
                <p className="text-sm font-medium text-gray-900 truncate">
                  Admin User
                </p>
                <p className="text-xs text-gray-500 truncate">
                  admin@company.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-gray-50">
        {/* Workday-style Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center shrink-0">
          <div className="w-full max-w-[1920px] mx-auto px-6 flex items-center gap-6">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Logo placeholder */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">ZJ</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                ZyberJR
              </span>
            </div>

            {/* Search bar - full width, pill-shaped */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <NotificationDropdown />
              <TaskDropdown />
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                title="Print"
              >
                <Printer className="h-5 w-5 text-gray-600" />
              </Button>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center ml-2">
                <span className="text-gray-700 text-xs font-medium">AD</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content with max-width and generous padding */}
        <main className="flex-1 overflow-auto min-w-0">
          <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
