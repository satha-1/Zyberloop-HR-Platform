"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { WorkdayTable, WorkdayTableColumn, TableToolbarActions } from "@/app/components/ui/WorkdayTable";
import { api } from "@/app/lib/api";
import { useDepartments } from "@/app/lib/hooks";
import { Plus, ExternalLink, Users, Eye, Pencil, Filter, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { cn } from "@/app/components/ui/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

type RequisitionView = 'showAll' | 'byHiringManager' | 'byLocation';

interface RequisitionsTabProps {
  onCreateRequisition: () => void;
  onViewRequisition: (id: string) => void;
  onEditRequisition: (req: any) => void;
  onCopyPortalLink: (id: string) => void;
}

const PIPELINE_STAGES = [
  { key: 'review', label: 'Review' },
  { key: 'screen', label: 'Screen' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'hiringManagerInterview', label: 'Hiring Manager Interview' },
  { key: 'preEmploymentCheck', label: 'Pre-Employment' },
  { key: 'employmentAgreement', label: 'Employment Agreement' },
  { key: 'offer', label: 'Offer' },
  { key: 'backgroundCheck', label: 'Background Check' },
  { key: 'readyForHire', label: 'Ready for Hire' },
];

export function RequisitionsTab({
  onCreateRequisition,
  onViewRequisition,
  onEditRequisition,
  onCopyPortalLink,
}: RequisitionsTabProps) {
  const [view, setView] = useState<RequisitionView>('showAll');
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [hiringManagerFilter, setHiringManagerFilter] = useState("all");
  const [hiringManagers, setHiringManagers] = useState<any[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const { data: departments = [] } = useDepartments();
  const router = useRouter();

  useEffect(() => {
    loadHiringManagers();
    loadLocations();
  }, []);

  useEffect(() => {
    loadRequisitions();
  }, [view, departmentFilter, locationFilter, hiringManagerFilter]);

  const loadHiringManagers = async () => {
    try {
      const data = await api.getHiringManagers() as any;
      setHiringManagers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading hiring managers:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await api.getLocations() as any;
      setLocations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadRequisitions = async () => {
    try {
      setLoading(true);
      const params: any = {
        status: "open",
        view: view === 'showAll' ? undefined : view,
        page: 1,
        pageSize: 100,
      };
      
      if (departmentFilter !== "all") params.department = departmentFilter;
      if (locationFilter !== "all") params.location = locationFilter;
      if (hiringManagerFilter !== "all") params.hiringManagerId = hiringManagerFilter;

      const data = await api.getRequisitions(params) as any;
      setRequisitions(Array.isArray(data) ? data : (data?.data || []));
    } catch (error) {
      console.error('Error loading requisitions:', error);
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === "open" || statusLower === "published") return "bg-green-100 text-green-800";
    if (statusLower === "closed") return "bg-gray-100 text-gray-800";
    if (statusLower === "draft") return "bg-yellow-100 text-yellow-800";
    return "bg-orange-100 text-orange-800";
  };

  const renderShowAllView = () => {
    const columns: WorkdayTableColumn<any>[] = [
      {
        key: "title",
        header: "Position",
        align: "left",
        render: (row) => (
        <div>
          <button
            onClick={() => router.push(`/recruitment/requisitions/${row._id || row.id}`)}
            className="text-blue-600 hover:underline font-medium text-left"
          >
            {row.title}
          </button>
          <div className="text-xs text-gray-500 mt-0.5">
            REQ-{String(row._id || row.id).slice(-6).toUpperCase()}
          </div>
        </div>
        ),
      },
      {
        key: "hiringManager",
        header: "Hiring Manager",
        align: "left",
        render: (row) => (
          <div>
            <div className="font-medium text-sm">{row.hiringManagerName || 'N/A'}</div>
            {row.hiringManagerTitle && (
              <div className="text-xs text-gray-500">{row.hiringManagerTitle}</div>
            )}
          </div>
        ),
      },
      {
        key: "department",
        header: "Department",
        align: "left",
        render: (row) => row.departmentId?.name || row.department || "N/A",
      },
      {
        key: "location",
        header: "Location",
        align: "left",
      },
      {
        key: "type",
        header: "Type",
        align: "left",
        render: (row) => (
          <Badge variant="outline" className="text-xs">
            {row.type?.replace("_", " ") || row.type}
          </Badge>
        ),
      },
      {
        key: "candidates",
        header: "Candidates",
        align: "center",
        render: (row) => (
          <button
            onClick={() => router.push(`/recruitment/requisitions/${row._id || row.id}`)}
            className="flex items-center gap-2 justify-center hover:text-blue-600 transition-colors"
          >
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">{row.candidates || 0}</span>
          </button>
        ),
      },
      {
        key: "status",
        header: "Status",
        align: "left",
        render: (row) => (
          <Badge className={getStatusColor(row.status)}>
            {row.status}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        render: (row) => (
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/recruitment/requisitions/${row._id || row.id}`)} title="View Details">
              <Eye className="h-4 w-4" />
            </Button>
            {(row.status === 'DRAFT' || row.status === 'MANAGER_APPROVED') && (
              <Button variant="ghost" size="sm" onClick={() => onEditRequisition(row)} title="Edit Requisition">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                const link = `${window.location.origin}/portal/jobs/${row._id || row.id}`;
                window.open(link, '_blank');
              }} 
              title="Open Job Portal"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onCopyPortalLink(row._id || row.id)} 
              title="Copy Portal Link"
            >
              <Globe className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ];

    return (
      <WorkdayTable
        columns={columns}
        data={requisitions}
        getRowKey={(row) => row._id || row.id}
        isLoading={loading}
        emptyMessage="No requisitions found. Create your first requisition to get started."
        headerActions={<TableToolbarActions />}
      />
    );
  };

  const renderByHiringManagerView = () => {
    if (loading) {
      return <div className="text-center py-12 text-gray-500">Loading...</div>;
    }

    if (requisitions.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No requisitions found.</p>
          <Button onClick={onCreateRequisition}>
            <Plus className="h-4 w-4 mr-2" />
            Create Requisition
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {requisitions.map((req: any) => (
          <Card key={req._id || req.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {/* Left Section - Hiring Manager Info */}
                <div className="flex-1 min-w-0" style={{ maxWidth: '35%' }}>
                  <div className="font-semibold text-base text-gray-900 mb-1">
                    {req.hiringManagerName || 'N/A'}
                  </div>
                  {req.hiringManagerTitle && (
                    <div className="text-sm text-gray-600 mb-3">
                      {req.hiringManagerTitle}
                    </div>
                  )}
                  <button
                    onClick={() => router.push(`/recruitment/requisitions/${req._id || req.id}`)}
                    className="text-blue-600 hover:underline font-medium text-sm text-left"
                  >
                    {req.title}
                  </button>
                </div>

                {/* Middle Section - Status & Location */}
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <Badge className={getStatusColor(req.status)}>
                      {req.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Location</div>
                    <div className="text-sm font-medium">{req.location}</div>
                  </div>
                </div>

                {/* Right Section - Pipeline Steps */}
                <div className="flex-1 overflow-x-auto">
                  <div className="flex gap-4 min-w-max">
                    {PIPELINE_STAGES.map((stage) => {
                      const count = req.pipelineCounts?.[stage.key] || 0;
                      return (
                        <div key={stage.key} className="text-center min-w-[80px]">
                          <div className="text-xs text-gray-500 mb-1">{stage.label}</div>
                          <div className="text-lg font-bold text-gray-900">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/recruitment/requisitions/${req._id || req.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(req.status === 'DRAFT' || req.status === 'MANAGER_APPROVED') && (
                      <Button variant="ghost" size="sm" onClick={() => onEditRequisition(req)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderByLocationView = () => {
    if (loading) {
      return <div className="text-center py-12 text-gray-500">Loading...</div>;
    }

    if (requisitions.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No requisitions found.</p>
          <Button onClick={onCreateRequisition}>
            <Plus className="h-4 w-4 mr-2" />
            Create Requisition
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {requisitions.map((req: any) => (
          <Card key={req._id || req.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {/* Left Section - Location Info */}
                <div className="flex-1 min-w-0" style={{ maxWidth: '35%' }}>
                  <div className="font-semibold text-base text-gray-900 mb-3">
                    {req.location}
                  </div>
                  <button
                    onClick={() => router.push(`/recruitment/requisitions/${req._id || req.id}`)}
                    className="text-blue-600 hover:underline font-medium text-sm text-left block mb-2"
                  >
                    {req.title}
                  </button>
                  {req.hiringManagerName && (
                    <div className="text-sm text-gray-600">
                      {req.hiringManagerName}
                    </div>
                  )}
                </div>

                {/* Middle Section - Status */}
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <Badge className={getStatusColor(req.status)}>
                      {req.status}
                    </Badge>
                  </div>
                </div>

                {/* Right Section - Pipeline Steps */}
                <div className="flex-1 overflow-x-auto">
                  <div className="flex gap-4 min-w-max">
                    {PIPELINE_STAGES.map((stage) => {
                      const count = req.pipelineCounts?.[stage.key] || 0;
                      return (
                        <div key={stage.key} className="text-center min-w-[80px]">
                          <div className="text-xs text-gray-500 mb-1">{stage.label}</div>
                          <div className="text-lg font-bold text-gray-900">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/recruitment/requisitions/${req._id || req.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(req.status === 'DRAFT' || req.status === 'MANAGER_APPROVED') && (
                      <Button variant="ghost" size="sm" onClick={() => onEditRequisition(req)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1 -mb-px">
          {[
            { id: 'showAll', label: 'Show All' },
            { id: 'byHiringManager', label: 'By Hiring Manager' },
            { id: 'byLocation', label: 'By Location' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as RequisitionView)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors relative",
                view === tab.id
                  ? "text-blue-700 border-b-2 border-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:border-gray-300 border-b-2 border-transparent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-4">
            <CardTitle className="flex-1">Job Requisitions</CardTitle>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept: any) => {
                  const deptId = dept._id || dept.id;
                  if (!deptId) return null;
                  return (
                    <SelectItem key={String(deptId)} value={String(deptId)}>
                      {dept.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {view === 'byLocation' && (
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {view === 'byHiringManager' && (
              <Select value={hiringManagerFilter} onValueChange={setHiringManagerFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Hiring Manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Managers</SelectItem>
                  {hiringManagers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {view === 'showAll' && renderShowAllView()}
          {view === 'byHiringManager' && renderByHiringManagerView()}
          {view === 'byLocation' && renderByLocationView()}
        </CardContent>
      </Card>
    </div>
  );
}
