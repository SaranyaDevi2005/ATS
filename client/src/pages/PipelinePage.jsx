import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Search,
  ExternalLink,
  GripVertical,
  Award,
} from 'lucide-react';
import { fetchCandidates, updateCandidateStage } from '../api/candidates';
import { STAGES } from '../components/Badge';
import { KanbanSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';

const STAGE_HEADER_COLORS = {
  APPLIED: 'border-t-sky-500 bg-sky-50/50 text-sky-950',
  SCREENING: 'border-t-purple-500 bg-purple-50/50 text-purple-950',
  INTERVIEW: 'border-t-amber-500 bg-amber-50/50 text-amber-950',
  OFFER: 'border-t-teal-500 bg-teal-50/50 text-teal-950',
  HIRED: 'border-t-emerald-500 bg-emerald-50/50 text-emerald-950',
  REJECTED: 'border-t-rose-500 bg-rose-50/50 text-rose-950',
};

export function PipelinePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const urlSearch = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 300);

  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync debounced search to URL
  useEffect(() => {
    setSearchParams((prev) => {
      const currentInUrl = prev.get('search') || '';
      const trimmed = debouncedSearch.trim();
      if (currentInUrl === trimmed) return prev;

      const next = new URLSearchParams(prev);
      if (trimmed) {
        next.set('search', trimmed);
      } else {
        next.delete('search');
      }
      return next;
    }, { replace: true });
  }, [debouncedSearch, setSearchParams]);

  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Load all candidates for the Kanban board
  const loadPipelineCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all candidates (limit 100)
      const res = await fetchCandidates({ limit: 100 });
      setCandidates(res.data || []);
    } catch (err) {
      showToast(err.userMessage || 'Failed to load pipeline candidates', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPipelineCandidates();
  }, [loadPipelineCandidates]);

  // Filter candidates based on search
  const filteredCandidates = useMemo(() => {
    if (!urlSearch.trim()) return candidates;
    const term = urlSearch.trim().toLowerCase();
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.position.toLowerCase().includes(term) ||
        (c.skills && c.skills.toLowerCase().includes(term))
    );
  }, [candidates, urlSearch]);

  // Group candidates by stage
  const columnsData = useMemo(() => {
    const grouped = {};
    for (const stage of STAGES) {
      grouped[stage] = [];
    }
    for (const candidate of filteredCandidates) {
      if (grouped[candidate.stage]) {
        grouped[candidate.stage].push(candidate);
      }
    }
    return grouped;
  }, [filteredCandidates]);

  // Handle Drag and Drop
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const candidateId = Number(draggableId);
    const toStage = destination.droppableId;

    const targetCandidate = candidates.find((c) => c.id === candidateId);
    if (!targetCandidate) return;

    // Snapshot state for potential rollback
    const previousCandidates = [...candidates];

    // Optimistic Update
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage: toStage } : c))
    );

    try {
      await updateCandidateStage(candidateId, toStage);
      showToast(`Moved ${targetCandidate.name} to ${toStage}`);
    } catch (err) {
      // Rollback to previous state
      setCandidates(previousCandidates);
      showToast(err.userMessage || `Failed to move ${targetCandidate.name}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hiring Pipeline</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Interactive Kanban board. Drag candidates across stages to trigger status updates.
          </p>
        </div>

        {/* Pipeline Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Filter pipeline candidates..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all shadow-xs"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 rounded px-1.5 py-0.5"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Container */}
      {isLoading ? (
        <KanbanSkeleton columns={6} />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-6 pt-1 select-none min-h-[calc(100vh-250px)]">
            {STAGES.map((stage) => {
              const columnCandidates = columnsData[stage] || [];
              const headerColor = STAGE_HEADER_COLORS[stage] || 'border-t-slate-400 bg-slate-50';

              return (
                <div
                  key={stage}
                  className="w-72 sm:w-80 shrink-0 flex flex-col bg-slate-100/70 rounded-2xl border border-slate-200/70 overflow-hidden"
                >
                  {/* Column Header */}
                  <div className={`p-3.5 border-t-4 border-b border-slate-200/60 ${headerColor} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider">
                        {stage}
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 border border-slate-200/60 text-slate-700 shadow-2xs">
                      {columnCandidates.length}
                    </span>
                  </div>

                  {/* Droppable Area */}
                  <Droppable droppableId={stage}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-3 space-y-3 transition-colors min-h-[300px] overflow-y-auto max-h-[calc(100vh-320px)] ${
                          snapshot.isDraggingOver ? 'bg-brand-50/40 ring-2 ring-brand-300 ring-inset rounded-b-2xl' : ''
                        }`}
                      >
                        {columnCandidates.length === 0 ? (
                          <div className="h-36 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-200/80 rounded-xl">
                            <span className="text-xs font-medium text-slate-400">
                              Drop candidates here
                            </span>
                          </div>
                        ) : (
                          columnCandidates.map((candidate, index) => {
                            const skillsArray = candidate.skills
                              ? candidate.skills.split(',').map((s) => s.trim()).filter(Boolean)
                              : [];

                            return (
                              <Draggable
                                key={candidate.id.toString()}
                                draggableId={candidate.id.toString()}
                                index={index}
                              >
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    className={`bg-white rounded-xl p-4 border transition-all ${
                                      dragSnapshot.isDragging
                                        ? 'border-brand-500 shadow-xl ring-2 ring-brand-400/20 rotate-1'
                                        : 'border-slate-200 hover:border-slate-300 shadow-xs'
                                    }`}
                                  >
                                    {/* Card Header: Grip & Name */}
                                    <div className="flex items-start justify-between gap-2">
                                      <Link
                                        to={`/candidates/${candidate.id}`}
                                        className="font-bold text-sm text-slate-900 hover:text-brand-600 transition-colors line-clamp-1"
                                      >
                                        {candidate.name}
                                      </Link>
                                      <div
                                        {...dragProvided.dragHandleProps}
                                        className="text-slate-400 hover:text-slate-600 p-0.5 cursor-grab active:cursor-grabbing -mr-1 -mt-1"
                                        title="Drag candidate"
                                      >
                                        <GripVertical className="w-4 h-4" />
                                      </div>
                                    </div>

                                    {/* Position */}
                                    <p className="text-xs font-medium text-slate-600 mt-1 line-clamp-1">
                                      {candidate.position}
                                    </p>

                                    {/* Experience & Source */}
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
                                      <span className="flex items-center gap-1 font-medium text-slate-600">
                                        <Award className="w-3 h-3 text-slate-400" />
                                        {candidate.experienceYears}y exp
                                      </span>
                                      <span>•</span>
                                      <span>{candidate.source}</span>
                                    </div>

                                    {/* Skill chips */}
                                    {skillsArray.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-3">
                                        {skillsArray.slice(0, 3).map((skill, sIdx) => (
                                          <span
                                            key={sIdx}
                                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60"
                                          >
                                            {skill}
                                          </span>
                                        ))}
                                        {skillsArray.length > 3 && (
                                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-400">
                                            +{skillsArray.length - 3}
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* Card Footer action */}
                                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                      <span className="text-slate-400">
                                        {candidate.email}
                                      </span>
                                      <Link
                                        to={`/candidates/${candidate.id}`}
                                        className="text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-0.5"
                                      >
                                        View
                                        <ExternalLink className="w-3 h-3" />
                                      </Link>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}

export default PipelinePage;
