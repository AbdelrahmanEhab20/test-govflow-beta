import React, { useState, useMemo } from "react";
import { getLeaderboardData, getLeaderboardFilterOptions } from "@/api/analyticsApi";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Loader, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeaderboardFilters from "@/components/leaderboard/LeaderboardFilters";
import MembersLeaderboard from "@/components/leaderboard/MembersLeaderboard";
import DepartmentsLeaderboard from "@/components/leaderboard/DepartmentsLeaderboard";
import SectorsLeaderboard from "@/components/leaderboard/SectorsLeaderboard";

export default function Leaderboard() {
  const [filters, setFilters] = useState({ preset: "all", sector: "", department: "", startDate: "", endDate: "" });

  const { data: filterOptions = {} } = useQuery({
    queryKey: ['leaderboardFilterOptions'],
    queryFn: () => getLeaderboardFilterOptions(),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['leaderboard', filters],
    queryFn: () => getLeaderboardData({
      startDate:  filters.startDate,
      endDate:    filters.endDate,
      sector:     filters.sector,
      department: filters.department,
    }),
    staleTime: 60 * 1000,
  });

  // Use canonical backend filter options to avoid mismatched values.
  const sectors = useMemo(() => {
    return Array.isArray(filterOptions?.sectors) ? filterOptions.sectors : [];
  }, [filterOptions?.sectors]);

  const departments = useMemo(() => {
    return Array.isArray(filterOptions?.departments) ? filterOptions.departments : [];
  }, [filterOptions?.departments]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Leaderboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-300">Top performers across team members, departments & sectors</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="self-start sm:self-auto">
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <LeaderboardFilters
        filters={filters}
        onChange={setFilters}
        sectors={sectors}
        departments={departments}
      />

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Calculating leaderboard data…</p>
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/40 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Failed to load leaderboard</p>
                <p className="text-sm text-red-700 dark:text-red-300/90 mt-1">
                  {error?.message || "Something went wrong while loading leaderboard data."}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary stats */}
          {data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Team Members", value: data.teamMembers?.length ?? 0, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
                { label: "Departments",  value: data.departments?.length ?? 0,  color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
                { label: "Sectors",      value: data.sectors?.length ?? 0,      color: "text-green-600 dark:text-green-400",  bg: "bg-green-50 dark:bg-green-900/20" },
                {
                  label: "Top Completion",
                  value: data.teamMembers?.[0] ? `${data.teamMembers[0].completion_rate}%` : "—",
                  color: "text-yellow-600 dark:text-yellow-400",
                  bg: "bg-yellow-50 dark:bg-yellow-900/20",
                  sub: data.teamMembers?.[0]?.name
                },
              ].map(stat => (
                <div key={stat.label} className={`rounded-xl p-4 ${stat.bg}`}>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  {stat.sub && <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{stat.sub}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Team Members */}
          <MembersLeaderboard members={data?.teamMembers ?? []} />

          {/* Departments */}
          <DepartmentsLeaderboard departments={data?.departments ?? []} />

          {/* Sectors */}
          <SectorsLeaderboard sectors={data?.sectors ?? []} />
        </div>
      )}
    </div>
  );
}