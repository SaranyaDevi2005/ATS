import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Briefcase,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { fetchDashboardData } from '../api/dashboard';
import Badge, { STAGES } from '../components/Badge';

// Stage styling for charts & funnel
const STAGE_COLORS = {
  APPLIED: '#0284c7',    // sky-600
  SCREENING: '#9333ea',  // purple-600
  INTERVIEW: '#d97706',  // amber-600
  OFFER: '#0d9488',      // teal-600
  HIRED: '#059669',      // emerald-600
  REJECTED: '#e11d48',   // rose-600
};

// Donut chart color palette
const SOURCE_PALETTE = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#64748b', // Slate
  '#3b82f6', // Blue
];

/** Custom Tooltip for Stage & Position Bar Charts */
function CustomBarTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg border border-slate-800 space-y-0.5">
        <p className="font-semibold text-slate-200">{label || item.payload?.name}</p>
        <p className="text-brand-300 font-medium">
          {item.value} {item.value === 1 ? 'candidate' : 'candidates'}
        </p>
      </div>
    );
  }
  return null;
}

/** Custom Tooltip for Source Donut Chart */
function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg border border-slate-800 space-y-0.5">
        <p className="font-semibold text-slate-200">{item.name}</p>
        <p className="text-brand-300 font-medium">
          {item.value} candidates ({item.payload?.percentage || '0'}%)
        </p>
      </div>
    );
  }
  return null;
}

/** Dashboard Loading Skeleton */
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Welcome Banner Skeleton */}
      <div className="h-44 bg-slate-200/80 rounded-3xl" />

      {/* 5 KPI Skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="w-8 h-8 rounded-xl bg-slate-100" />
            </div>
            <div className="h-7 w-14 bg-slate-200 rounded" />
            <div className="h-3 w-28 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Funnel Skeleton */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="h-5 w-44 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-white rounded-2xl border border-slate-200 p-6" />
        <div className="h-80 bg-white rounded-2xl border border-slate-200 p-6" />
      </div>

      {/* Bottom Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-white rounded-2xl border border-slate-200 p-6" />
        <div className="h-96 bg-white rounded-2xl border border-slate-200 p-6" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardData();
      setData(result);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.userMessage || 'Unable to connect to the ATS backend server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Transform candidates by stage for BarChart
  const stageChartData = useMemo(() => {
    if (!data?.countPerStage) return [];
    return STAGES.map((st) => ({
      stage: st.charAt(0) + st.slice(1).toLowerCase(),
      rawStage: st,
      count: data.countPerStage[st] || 0,
      fill: STAGE_COLORS[st] || '#6366f1',
    }));
  }, [data]);

  // Transform candidates by source for Donut Chart with percentages
  const sourceChartData = useMemo(() => {
    if (!data?.countPerSource || data.countPerSource.length === 0) return [];
    const totalSourceCount = data.countPerSource.reduce((acc, curr) => acc + curr.count, 0);
    return data.countPerSource.map((s, idx) => ({
      name: s.source,
      value: s.count,
      percentage: totalSourceCount > 0 ? Math.round((s.count / totalSourceCount) * 100) : 0,
      color: SOURCE_PALETTE[idx % SOURCE_PALETTE.length],
    }));
  }, [data]);

  // Transform top positions for horizontal BarChart
  const positionChartData = useMemo(() => {
    if (!data?.countPerPosition) return [];
    // Take top 6 positions for clean readability
    return data.countPerPosition.slice(0, 6).map((p) => ({
      name: p.position,
      shortName: p.position.length > 22 ? p.position.slice(0, 20) + '…' : p.position,
      count: p.count,
    }));
  }, [data]);

  // Loading State
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Error State with Retry
  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto my-16 bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Dashboard Unavailable</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {error || 'Could not retrieve recruiting metrics from http://localhost:5000/api/dashboard.'}
        </p>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  const {
    totalCandidates = 0,
    countPerStage = {},
    candidatesAddedLast7Days = 0,
    hiredCount = 0,
    rejectedCount = 0,
    conversionFunnel = { stages: [], overallHiredRate: '0%' },
    latestCandidates = [],
  } = data;

  const inInterviewCount = countPerStage['INTERVIEW'] || 0;

  return (
    <div className="space-y-8">
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-brand-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Recruiting Intelligence • Active Workspace</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Talent Pipeline Overview
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Real-time applicant progression, conversion funnel efficiency, source attribution, and
            candidate status distribution.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/candidates"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-900 hover:bg-slate-100 transition-all shadow-md active:scale-95"
            >
              <Users className="w-4 h-4 text-brand-600" />
              <span>Manage Candidates</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              to="/pipeline"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-brand-600/70 hover:bg-brand-600 border border-brand-400/30 text-white transition-all shadow-sm active:scale-95"
            >
              <Layers className="w-4 h-4" />
              <span>Interactive Pipeline</span>
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-brand-600/20 to-transparent pointer-events-none" />
      </div>

      {/* 1. KPI Cards Row (5 cards: Total, New this week, In interview, Hired, Rejected) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* KPI 1: Total Candidates */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Candidates
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {totalCandidates}
          </div>
          <div className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            <span>Overall candidate pool</span>
          </div>
        </div>

        {/* KPI 2: New This Week */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              New This Week
            </span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-sky-600">
            {candidatesAddedLast7Days}
          </div>
          <div className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            <span>Inflow past 7 days</span>
          </div>
        </div>

        {/* KPI 3: In Interview */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              In Interview
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-amber-600">
            {inInterviewCount}
          </div>
          <div className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            <span>Active evaluation stage</span>
          </div>
        </div>

        {/* KPI 4: Hired */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Hired
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {hiredCount}
          </div>
          <div className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            <span>Successfully closed</span>
          </div>
        </div>

        {/* KPI 5: Rejected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Rejected
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-rose-600">
            {rejectedCount}
          </div>
          <div className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            <span>Archived applicants</span>
          </div>
        </div>
      </div>

      {/* 2. Conversion Funnel with Percentages between Stages */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Hiring Pipeline Conversion Funnel
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unique candidate volume and pass-through rates progressing through each interview gate
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto bg-brand-50 border border-brand-200/60 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-brand-700 font-medium">Overall Conversion Rate:</span>
            <span className="text-xs font-bold text-brand-900">
              {conversionFunnel.overallHiredRate}
            </span>
          </div>
        </div>

        {/* Funnel Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {conversionFunnel.stages.map((stageItem, index) => {
            const isFirst = index === 0;
            const rawStage = stageItem.stage;
            const badgeColor = STAGE_COLORS[rawStage] || '#6366f1';

            return (
              <div
                key={rawStage}
                className="relative p-4 rounded-xl border border-slate-200/70 bg-gradient-to-b from-white to-slate-50/50 flex flex-col justify-between space-y-3 group hover:border-slate-300 transition-all shadow-2xs"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between">
                  <Badge stage={rawStage} size="xs" />
                  <span className="text-[10px] font-bold text-slate-400">
                    Step {index + 1}
                  </span>
                </div>

                {/* Candidate Count */}
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {stageItem.count}
                  </div>
                  <div className="text-[11px] text-slate-400">candidates reached</div>
                </div>

                {/* Conversion percentages */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">Pass rate:</span>
                    <span className="font-semibold text-slate-700">
                      {isFirst ? '100% baseline' : stageItem.conversionFromPrevious}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">From top:</span>
                    <span className="font-semibold text-slate-600">
                      {stageItem.conversionFromTop}
                    </span>
                  </div>
                </div>

                {/* Funnel relative width bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: stageItem.conversionFromTop || '10%',
                      backgroundColor: badgeColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Middle Charts Row: Stage Bar Chart & Source Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Candidates per Stage Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Candidates per Stage
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Current applicant volume across active pipeline phases
              </p>
            </div>
            <Link
              to="/pipeline"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View Kanban</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stageChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="stage"
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                  {stageChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Stage Count Pills */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
            {stageChartData.map((item) => (
              <div key={item.rawStage} className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">
                  {item.stage}
                </span>
                <span className="font-bold text-slate-800 text-sm">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Candidates by Source Donut Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Candidates by Source
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Attribution channels attracting prospective hires
            </p>
          </div>

          <div className="relative w-full h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {sourceChartData.map((entry, index) => (
                    <Cell key={`source-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center stat in Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-2xl font-extrabold text-slate-800">
                {totalCandidates}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Applicants
              </span>
            </div>
          </div>

          {/* Source Legend Pills */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 max-h-36 overflow-y-auto">
            {sourceChartData.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-1.5 truncate pr-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="truncate text-slate-600 font-medium">{s.name}</span>
                </div>
                <span className="font-bold text-slate-800 shrink-0">
                  {s.value} <span className="text-slate-400 text-[10px]">({s.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Candidates per Position (Bar Chart) & Latest 5 Candidates List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Candidates per Position Bar Chart (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Candidates per Role / Position
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Applicant demand distribution across high-priority job openings
              </p>
            </div>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={positionChartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="shortName"
                  type="category"
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  width={140}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#4f46e5"
                  radius={[0, 6, 6, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Candidates List (Latest 5) (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent Candidates
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Latest 5 applicants added to the hiring workflow
              </p>
            </div>
            <Link
              to="/candidates"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All ({totalCandidates})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {latestCandidates.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No applicants registered in the system yet.
              </div>
            ) : (
              latestCandidates.map((c) => {
                const initials = c.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                const formattedDate = c.createdAt
                  ? new Date(c.createdAt.replace(' ', 'T')).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'N/A';

                return (
                  <Link
                    key={c.id}
                    to={`/candidates/${c.id}`}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-200 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0 border border-brand-200/50">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                          {c.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {c.position} • {c.experienceYears}y exp
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge stage={c.stage} size="xs" />
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        {formattedDate}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Direct link to candidate profiles and history notes</span>
            <Link
              to="/candidates"
              className="text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
            >
              <span>Explore candidates directory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
