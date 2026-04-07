import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export default function PerformanceFilters({
  departments = [],
  selectedDepartment,
  onDepartmentChange,
  sectors = [],
  selectedSector,
  onSectorChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onReset
}) {
  const hasActiveFilters = selectedDepartment || selectedSector || startDate || endDate;

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
      <h3 className="font-semibold text-slate-900 dark:text-white">Filters</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <Label htmlFor="dept" className="text-sm mb-1.5 block dark:text-slate-200">
             Department
           </Label>
          <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
            <SelectTrigger id="dept">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Departments</SelectItem>
              {departments.map((dept) =>
              <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sector" className="text-sm mb-1.5 block dark:text-slate-200">
             Sector
           </Label>
          <Select value={selectedSector} onValueChange={onSectorChange}>
            <SelectTrigger id="sector">
              <SelectValue placeholder="All sectors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Sectors</SelectItem>
              {sectors.map((sector) =>
              <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="startDate" className="text-sm mb-1.5 block dark:text-slate-200">
             Start Date
           </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
          />

        </div>

        <div>
          <Label htmlFor="endDate" className="text-sm mb-1.5 block dark:text-slate-200">
             End Date
           </Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
          />

        </div>

        <div className="flex items-end">
          {hasActiveFilters &&
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="w-full gap-2">

              <X className="w-4 h-4" />
              Reset
            </Button>
          }
        </div>
      </div>
    </div>);

}