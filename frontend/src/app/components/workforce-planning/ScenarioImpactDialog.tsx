"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { Card, CardContent } from "../../components/ui/card";
import { Loader2, Users, DollarSign, TrendingUp, Calendar, AlertTriangle } from "lucide-react";
import { api } from "../../lib/api";
import { ScenarioImpact } from "../../lib/types/workforcePlanning";

interface ScenarioImpactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenarioId: string;
}

export function ScenarioImpactDialog({
  open,
  onOpenChange,
  scenarioId,
}: ScenarioImpactDialogProps) {
  const [loading, setLoading] = useState(false);
  const [impact, setImpact] = useState<ScenarioImpact | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && scenarioId) {
      loadImpact();
    } else {
      setImpact(null);
      setError(null);
    }
  }, [open, scenarioId]);

  const loadImpact = async () => {
    setLoading(true);
    setError(null);
    try {
      // API client automatically extracts data from { success: true, data: {...} }
      const impactData = await api.getWorkforcePlanningScenarioImpact(scenarioId) as ScenarioImpact;
      setImpact(impactData);
    } catch (err: any) {
      setError(err.message || "Failed to load impact data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scenario Impact Analysis</DialogTitle>
          <DialogDescription>
            Calculated impact summary for this workforce planning scenario
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-600 py-4">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        ) : impact ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <p className="text-sm text-gray-600">Current Headcount</p>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(impact.currentHeadcount)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-gray-600" />
                    <p className="text-sm text-gray-600">Target Headcount</p>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(impact.targetHeadcount)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-gray-600" />
                    <p className="text-sm text-gray-600">Net Change</p>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      impact.netChange >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {impact.netChange >= 0 ? "+" : ""}
                    {formatNumber(impact.netChange)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    <p className="text-sm text-gray-600">Cost Per Head</p>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(impact.costPerHead)}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <p className="text-sm text-gray-600">Annual Cost</p>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(impact.annualCost)}</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <p className="text-sm text-gray-600">Monthly Hiring Capacity</p>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatNumber(impact.monthlyHiringCapacityRange.min)} -{" "}
                    {formatNumber(impact.monthlyHiringCapacityRange.max)} per month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-gray-600" />
                    <p className="text-sm text-gray-600">Attrition Impact Estimate</p>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatNumber(impact.attritionImpactEstimate)} employees
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
