"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Badge } from "../../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import {
  Plus, Search, Edit, Trash2, Copy, Eye, Loader2, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../lib/api";

interface Template {
  _id: string;
  name: string;
  cycleId?: string | null;
  reusable: boolean;
  sections: Array<{ id: string; title: string; questions: any[] }>;
  settings: { anonymous: boolean; minResponsesToShow: number };
  createdAt: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cycleId = searchParams.get("cycleId");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterReusable, setFilterReusable] = useState<string>("all");

  useEffect(() => {
    if (cycleId) loadTemplates();
  }, [cycleId]);

  const loadTemplates = async () => {
    if (!cycleId) return;
    setLoading(true);
    try {
      const data = await api.get360Templates(cycleId) as Template[];
      setTemplates(data || []);
    } catch (e: any) {
      toast.error("Failed to load templates: " + (e.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete360Template(id);
      toast.success("Template deleted");
      loadTemplates();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete template");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.duplicate360Template(id);
      toast.success("Template duplicated");
      loadTemplates();
    } catch (e: any) {
      toast.error(e.message || "Failed to duplicate template");
    }
  };

  const filtered = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filterReusable === "all" ||
      (filterReusable === "yes" && t.reusable) ||
      (filterReusable === "no" && !t.reusable);
    return matchesSearch && matchesFilter;
  });

  if (!cycleId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold">360 Feedback Templates</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">Please select a performance cycle first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">360 Feedback Templates</h1>
            <p className="text-gray-500 mt-0.5 text-sm">Create and manage feedback questionnaires</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/performance/360/templates/new?cycleId=${cycleId}`)}>
          <Plus className="h-4 w-4 mr-2" /> New Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterReusable}
              onChange={(e) => setFilterReusable(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="all">All Templates</option>
              <option value="yes">Reusable Only</option>
              <option value="no">Cycle-Specific Only</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Templates ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No templates found.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/performance/360/templates/new?cycleId=${cycleId}`)}
              >
                <Plus className="h-4 w-4 mr-2" /> Create First Template
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Reusable</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Settings</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => {
                  const totalQuestions = t.sections.reduce((sum, s) => sum + s.questions.length, 0);
                  return (
                    <TableRow key={t._id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>
                        <Badge variant={t.reusable ? "default" : "secondary"}>
                          {t.reusable ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.sections.length}</TableCell>
                      <TableCell>{totalQuestions}</TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-500">
                          {t.settings.anonymous ? "Anonymous" : "Named"} • Min {t.settings.minResponsesToShow} responses
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/performance/360/templates/${t._id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/performance/360/templates/${t._id}/edit?cycleId=${cycleId}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(t._id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(t._id, t.name)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
