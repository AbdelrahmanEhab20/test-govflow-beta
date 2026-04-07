import React, { useState, useMemo } from "react";
import { getCurrentUser } from "@/api/authApi";
import { listTasks } from "@/api/tasksApi";
import { listUsers } from "@/api/usersApi";
import { listDepartments, listTeams } from "@/api/departmentsApi";
import { analyzeTeamPerformance } from "@/api/analyticsApi";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader, Search, Sparkles, X, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import PerformanceFilters from "../components/dashboard/PerformanceFilters";
import MemberContributionChart from "../components/dashboard/MemberContributionChart";
import PerformanceAlerts from "../components/dashboard/PerformanceAlerts";
import PerformanceInsights from "../components/dashboard/PerformanceInsights";
import PerformanceRecommendations from "../components/dashboard/PerformanceRecommendations";
import {
  CompletionRateCard,
  AverageProgressCard,
  OverdueTasksCard,
  DueThisWeekCard,
  StatusDistributionChart,
  ProgressTrendChart,
  PriorityBreakdownChart,
} from "../components/dashboard/TeamPerformanceMetrics";

export default function TeamPerformanceDashboard() {
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: initiatives = [], isLoading: initiativesLoading } = useQuery({
    queryKey: ['initiatives'],
    queryFn: () => listTasks(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['databaseDepartments'],
    queryFn: () => listDepartments(),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => listTeams(),
  });

  // Only allow admins
  if (user && user.role !== 'admin') {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate(createPageUrl('Dashboard'))}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Derive departments from team members
  const derivedDepartments = Array.from(new Map(
    teamMembers.map(member => [
      member.department_name,
      {
        id: member.department_name,
        name: member.department_name,
        sector: member.sector_name,
        description: '',
        manager_name: member.reporting_to || 'TBD',
        member_count: teamMembers.filter(m => m.department_name === member.department_name).length,
        email: '',
        phone: '',
        is_active: true
      }
    ])
  ).values())
    .filter(d => d.name);

  // Derive sectors from team members
  const derivedSectors = Array.from(new Set(
    teamMembers.map(member => member.sector_name).filter(s => s)
  )).sort();

  // Filter initiatives based on selected criteria
  const filteredInitiatives = useMemo(() => {
    let filtered = [...initiatives];

    // Filter by sector
    if (selectedSector) {
      const sectorMembers = teamMembers.filter(m => m.sector_name === selectedSector);
      const sectorMemberNames = sectorMembers.map(m => m.name);
      filtered = filtered.filter(init =>
        sectorMemberNames.includes(init.lead_user_name) ||
        (init.support_user_names && init.support_user_names.some(name => sectorMemberNames.includes(name)))
      );
    }

    // Filter by department (by manager or members)
    if (selectedDepartment) {
      const deptMembers = teamMembers.filter(m => m.department_name === selectedDepartment);
      const deptMemberNames = deptMembers.map(m => m.name);
      filtered = filtered.filter(init =>
        deptMemberNames.includes(init.lead_user_name) ||
        (init.support_user_names && init.support_user_names.some(name => deptMemberNames.includes(name)))
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(init =>
        init.pillar?.toLowerCase().includes(query) ||
        init.brief_description?.toLowerCase().includes(query) ||
        init.lead_user_name?.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(init => new Date(init.created_date) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(init => new Date(init.created_date) <= end);
    }

    return filtered;
  }, [initiatives, selectedDepartment, selectedSector, startDate, endDate, teamMembers, searchQuery]);

  const handleResetFilters = () => {
    setSelectedDepartment('');
    setSelectedSector('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const handleOpenAiPanel = async () => {
    setAiPanelOpen(true);
    if (aiAnalysis || isAnalyzing) return;
    if (filteredInitiatives.length === 0) return;

    setIsAnalyzing(true);
    try {
      const data = await analyzeTeamPerformance({
        initiatives: filteredInitiatives.slice(0, 50),
        teamMembers,
        departments: derivedDepartments,
        selectedSector,
        selectedDepartment
      });
      setAiAnalysis(data);
    } catch (error) {
      console.error('Error analyzing performance:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (initiativesLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full">
      {/* Main Content */}
      <div className={`flex-1 p-6 lg:p-8 space-y-6 transition-all duration-300 ${aiPanelOpen ? 'mr-[420px]' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Performance Dashboard</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Analytics and insights into team productivity</p>
            </div>
          </div>

          {/* AI Insights Button */}
          <Button
            onClick={handleOpenAiPanel}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md gap-2 flex-shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            AI Insights
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search initiatives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <PerformanceFilters
            departments={derivedDepartments}
            selectedDepartment={selectedDepartment}
            onDepartmentChange={setSelectedDepartment}
            sectors={derivedSectors}
            selectedSector={selectedSector}
            onSectorChange={setSelectedSector}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            onReset={handleResetFilters}
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CompletionRateCard initiatives={filteredInitiatives} />
          <AverageProgressCard initiatives={filteredInitiatives} />
          <OverdueTasksCard initiatives={filteredInitiatives} />
          <DueThisWeekCard initiatives={filteredInitiatives} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatusDistributionChart initiatives={filteredInitiatives} />
          <PriorityBreakdownChart initiatives={filteredInitiatives} />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <ProgressTrendChart initiatives={filteredInitiatives} />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <MemberContributionChart initiatives={filteredInitiatives} users={users} />
        </div>

        {filteredInitiatives.length === 0 && (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <p className="text-slate-500 dark:text-slate-400">No initiatives found for the selected filters.</p>
          </div>
        )}

        {/* Department Summary */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{derivedDepartments.length}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Departments</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{teamMembers.length}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Team Members</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{filteredInitiatives.length}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Initiatives</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Slide-in Panel */}
      <div className={`fixed top-0 right-0 h-full w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${aiPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-violet-600 to-indigo-600">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white" />
            <h2 className="font-semibold text-white">AI Performance Analysis</h2>
          </div>
          <div className="flex items-center gap-2">
            {!isAnalyzing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setAiAnalysis(null); handleOpenAiPanel(); }}
                className="text-white/80 hover:text-white hover:bg-white/20 text-xs h-7 px-2"
              >
                Refresh
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setAiPanelOpen(false)} className="text-white hover:bg-white/20 h-7 w-7">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-violet-600 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-medium text-slate-800 dark:text-white">Analyzing performance…</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This may take a few seconds</p>
              </div>
            </div>
          )}

          {!isAnalyzing && !aiAnalysis && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {filteredInitiatives.length === 0
                  ? 'No initiatives to analyze. Adjust your filters.'
                  : 'Click "Refresh" to generate AI insights.'}
              </p>
            </div>
          )}

          {!isAnalyzing && aiAnalysis && (
            <>
              {aiAnalysis.alerts?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">🚨 Alerts</h3>
                  <PerformanceAlerts alerts={aiAnalysis.alerts} />
                </div>
              )}
              {aiAnalysis.insights?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">💡 Insights</h3>
                  <PerformanceInsights insights={aiAnalysis.insights} />
                </div>
              )}
              {aiAnalysis.recommendations?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">✅ Recommendations</h3>
                  <PerformanceRecommendations recommendations={aiAnalysis.recommendations} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Backdrop for mobile */}
      {aiPanelOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setAiPanelOpen(false)} />
      )}
    </div>
  );
}