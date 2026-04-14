import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ArrowUpDown } from "lucide-react";
import RankBadge from "./RankBadge";
import UserAvatar from "@/components/shared/UserAvatar";

const SORT_OPTIONS = [
  { label: "Score",           value: "score" },
  { label: "Completion Rate", value: "completion_rate" },
  { label: "Tasks Completed", value: "completed" },
  { label: "Avg. Progress",   value: "avg_completion_percent" },
  { label: "On-Time Rate",    value: "on_time_rate" },
];

export default function MembersLeaderboard({ members = [] }) {
  const [sortBy, setSortBy] = useState("score");
  const [limit, setLimit] = useState(10);

  const sorted = [...members].sort((a, b) => b[sortBy] - a[sortBy]).slice(0, limit);

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          Top Performing Team Members
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={String(limit)} onValueChange={v => setLimit(Number(v))}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Top 5</SelectItem>
              <SelectItem value="10">Top 10</SelectItem>
              <SelectItem value="20">Top 20</SelectItem>
              <SelectItem value="999">All</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              <SelectValue />
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Member</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Completed</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Completion Rate</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">On-Time</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Progress</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Score</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m, idx) => (
                  <tr key={m.name} className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <RankBadge rank={idx + 1} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          user={{
                            full_name: m.name,
                            email: m.email,
                            avatar_url: m.avatar_url,
                            avatar: m.avatar,
                            photo_url: m.photo_url,
                          }}
                          size="sm"
                          showTooltip={false}
                        />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{m.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{m.job_title || m.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-slate-900 dark:text-white">{m.completed}<span className="text-xs text-slate-400 font-normal">/{m.total}</span></td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`font-semibold ${m.completion_rate >= 80 ? 'text-green-600' : m.completion_rate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{m.completion_rate}%</span>
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${m.completion_rate >= 80 ? 'bg-green-500' : m.completion_rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${m.completion_rate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-medium ${m.on_time_rate >= 80 ? 'text-green-600' : m.on_time_rate >= 50 ? 'text-amber-600' : 'text-slate-500'}`}>{m.on_time_rate}%</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{m.avg_completion_percent}%</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-0">{m.score}</Badge>
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