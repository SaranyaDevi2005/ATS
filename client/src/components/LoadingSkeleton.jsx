import React from 'react';

export function TableSkeleton({ rows = 6, _cols = 6 }) {
  return (
    <div className="w-full animate-pulse">
      <div className="h-11 bg-slate-100 rounded-t-xl border-b border-slate-200" />
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 bg-white"
        >
          <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
          <div className="w-40 h-4 bg-slate-200 rounded" />
          <div className="w-32 h-4 bg-slate-100 rounded" />
          <div className="w-20 h-6 bg-slate-100 rounded-full" />
          <div className="w-16 h-4 bg-slate-100 rounded" />
          <div className="w-24 h-4 bg-slate-100 rounded" />
          <div className="ml-auto w-16 h-8 bg-slate-100 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function KanbanSkeleton({ columns = 5 }) {
  return (
    <div className="flex gap-5 overflow-x-auto pb-6 animate-pulse">
      {Array.from({ length: columns }).map((_, c) => (
        <div key={c} className="w-80 shrink-0 bg-slate-100/70 rounded-2xl p-4 border border-slate-200/60">
          <div className="flex items-center justify-between mb-4">
            <div className="w-24 h-5 bg-slate-200 rounded" />
            <div className="w-7 h-5 bg-slate-200 rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                <div className="w-3/4 h-4 bg-slate-200 rounded" />
                <div className="w-1/2 h-3.5 bg-slate-100 rounded" />
                <div className="flex gap-1.5 pt-1">
                  <div className="w-12 h-4 bg-slate-100 rounded-full" />
                  <div className="w-14 h-4 bg-slate-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-200" />
          <div className="space-y-2">
            <div className="w-48 h-6 bg-slate-200 rounded" />
            <div className="w-36 h-4 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="w-36 h-10 bg-slate-200 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-white p-6 rounded-2xl border border-slate-200" />
          <div className="h-72 bg-white p-6 rounded-2xl border border-slate-200" />
        </div>
        <div className="h-80 bg-white p-6 rounded-2xl border border-slate-200" />
      </div>
    </div>
  );
}
