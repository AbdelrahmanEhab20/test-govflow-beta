import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";

const DATE_PRESETS = [
  { label: "All Time",     value: "all" },
  { label: "This Week",    value: "week" },
  { label: "This Month",   value: "month" },
  { label: "This Quarter", value: "quarter" },
];

function getDateRange(preset) {
  const now = new Date();
  const fmt = d => d.toISOString().split("T")[0];
  if (preset === "week") {
    const start = new Date(now); start.setDate(now.getDate() - 7);
    return { startDate: fmt(start), endDate: fmt(now) };
  }
  if (preset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: fmt(start), endDate: fmt(now) };
  }
  if (preset === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), q * 3, 1);
    return { startDate: fmt(start), endDate: fmt(now) };
  }
  return { startDate: "", endDate: "" };
}

export default function LeaderboardFilters({ filters, onChange, sectors, departments }) {
  const handlePreset = (preset) => {
    const range = getDateRange(preset);
    onChange({ ...filters, preset, ...range });
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Date presets */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        {DATE_PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => handlePreset(p.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filters.preset === p.value
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Sector filter */}
      <Select value={filters.sector || "all"} onValueChange={v => onChange({ ...filters, sector: v === "all" ? "" : v })}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All Sectors" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sectors</SelectItem>
          {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Department filter */}
      <Select value={filters.department || "all"} onValueChange={v => onChange({ ...filters, department: v === "all" ? "" : v })}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All Departments" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Reset */}
      {(filters.sector || filters.department || filters.preset !== "all") && (
        <Button variant="ghost" size="sm" onClick={() => onChange({ preset: "all", sector: "", department: "", startDate: "", endDate: "" })}>
          <X className="w-4 h-4 mr-1" /> Reset
        </Button>
      )}
    </div>
  );
}