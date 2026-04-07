import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ArrowUpDown } from "lucide-react";
import RankBadge from "./RankBadge";

const SORT_OPTIONS = [
  { label: "Score",           value: "score" },
  { label: "Completion Rate", value: "completion_rate" },
  { label: "Tasks Completed", value: "completed" },
  { label: "Avg. Member Rate",value: "avg_member_rate" },
  { label: "Total Tasks",     value: "total" },
];

export default function DepartmentsLeaderboard({ departments = [] }) {
  const [sortBy, setSortBy] = useState("score");
  const [limit, setLimit] = useState(10);

  const sorted = [...departments].sort((a, b) => b[sortBy] - a[sortBy]).slice(0, limit);

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          Top Performing Departments
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={String(limit)} onValueChange={v => setLimit(Number(v))}>
            <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Top 5</SelectItem>
              <SelectItem value="10">Top 10</SelectItem>
              <SelectItem value="999">All</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <ArrowUpDown className="w-3 h-3 mr-1" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {sorted.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8">No data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 w-12">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Department</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Members</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Completed</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Completion Rate</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Delayed</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Score</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((d, idx) => (
                  <tr key={d.name} className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3"><RankBadge rank={idx + 1} /></td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 dark:text-white">{d.name}</p>
                      {d.sector && <p className="text-xs text-slate-500 dark:text-slate-400">{d.sector}</p>}
                    </td>
                    <td className="px-3 py-3 text-center text-slate-700 dark:text-slate-300 font-medium">{d.member_count}</td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-900 dark:text-white">
                      {d.completed}<span className="text-xs text-slate-400 font-normal">/{d.total}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`font-semibold ${d.completion_rate >= 80 ? 'text-green-600' : d.completion_rate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{d.completion_rate}%</span>
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${d.completion_rate >= 80 ? 'bg-green-500' : d.completion_rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${d.completion_rate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {d.delayed > 0
                        ? <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-0">{d.delayed}</Badge>
                        : <span className="text-green-600 text-xs font-medium">None</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge className="bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-0">{d.score}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}