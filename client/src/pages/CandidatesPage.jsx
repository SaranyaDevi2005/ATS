import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react';
import {
  fetchCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  updateCandidateStage,
} from '../api/candidates';
import Badge, { STAGES } from '../components/Badge';
import CandidateModal from '../components/CandidateModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { TableSkeleton } from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';

const SORT_OPTIONS = [
  { label: 'Newest Applied', value: 'createdAt:desc' },
  { label: 'Oldest Applied', value: 'createdAt:asc' },
  { label: 'Experience: High to Low', value: 'experienceYears:desc' },
  { label: 'Experience: Low to High', value: 'experienceYears:asc' },
  { label: 'Name: A to Z', value: 'name:asc' },
  { label: 'Name: Z to A', value: 'name:desc' },
];

export function CandidatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  // Search query state with debounce
  const urlSearch = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(urlSearch);
  const debouncedSearch = useDebounce(searchInput, 300);

  // Filters and pagination from URL
  const selectedStage = searchParams.get('stage') || '';
  const selectedPosition = searchParams.get('position') || '';
  const selectedSort = searchParams.get('sort') || 'createdAt:desc';
  const currentPage = Number(searchParams.get('page')) || 1;
  const pageLimit = 10;

  // Data states
  const [candidates, setCandidates] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      next.set('page', '1');
      return next;
    }, { replace: true });
  }, [debouncedSearch, setSearchParams]);

  // Keep input in sync if URL changes externally
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Update URL helper
  const updateUrlParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== 'page') {
        next.set('page', '1');
      }
      return next;
    });
  };

  // Fetch candidates from API
  const loadCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: pageLimit,
        sort: selectedSort,
      };
      if (urlSearch) params.search = urlSearch;
      if (selectedStage) params.stage = selectedStage;
      if (selectedPosition) params.position = selectedPosition;

      const res = await fetchCandidates(params);
      setCandidates(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      showToast(err.userMessage || 'Failed to load candidates', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageLimit, selectedSort, urlSearch, selectedStage, selectedPosition, showToast]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  // Extract unique positions from current candidate list or known positions
  const availablePositions = useMemo(() => {
    const defaultPositions = [
      'Senior Full Stack Engineer',
      'Senior Backend Engineer',
      'Frontend React Engineer',
      'Lead DevOps Engineer',
      'Product Designer (UI/UX)',
      'Senior Data Scientist',
      'QA Automation Engineer',
      'Engineering Manager',
      'Cloud Infrastructure Architect',
      'Mobile App Developer (iOS/Android)',
    ];
    return defaultPositions;
  }, []);

  // Handlers
  const handleCreateCandidate = async (formData) => {
    const created = await createCandidate(formData);
    showToast(`Added candidate ${created.name} successfully`);
    loadCandidates();
  };

  const handleUpdateCandidate = async (formData) => {
    if (!editingCandidate) return;
    const updated = await updateCandidate(editingCandidate.id, formData);
    showToast(`Updated candidate ${updated.name}`);
    setEditingCandidate(null);
    loadCandidates();
  };

  const handleQuickStageChange = async (candidateId, newStage, candidateName) => {
    try {
      await updateCandidateStage(candidateId, newStage);
      showToast(`Moved ${candidateName} to ${newStage}`);
      // Optimistic update locally
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, stage: newStage } : c))
      );
    } catch (err) {
      showToast(err.userMessage || 'Failed to update stage', 'error');
      loadCandidates();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!candidateToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCandidate(candidateToDelete.id);
      showToast(`Deleted ${candidateToDelete.name} successfully`);
      setCandidateToDelete(null);
      loadCandidates();
    } catch (err) {
      showToast(err.userMessage || 'Failed to delete candidate', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams({ page: '1' }));
  };

  // Avatar initial color generator
  const getAvatarBg = (name) => {
    const colors = [
      'bg-indigo-100 text-indigo-700',
      'bg-sky-100 text-sky-700',
      'bg-emerald-100 text-emerald-700',
      'bg-purple-100 text-purple-700',
      'bg-amber-100 text-amber-700',
      'bg-rose-100 text-rose-700',
    ];
    const index = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Candidates Directory</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage applicants, track review statuses, and record candidate notes
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:bg-brand-800 rounded-xl shadow-sm shadow-brand-500/25 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by candidate name, email, skills, position..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all placeholder:text-slate-400"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-200/60 rounded px-1.5 py-0.5"
              >
                Clear
              </button>
            )}
          </div>

          {/* Stage Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedStage}
              onChange={(e) => updateUrlParam('stage', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all text-slate-700"
            >
              <option value="">All Pipeline Stages</option>
              {STAGES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Position Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedPosition}
              onChange={(e) => updateUrlParam('position', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all text-slate-700"
            >
              <option value="">All Applied Roles</option>
              {availablePositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary row: Sort and active filter tags */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-600">Sort by:</span>
            <select
              value={selectedSort}
              onChange={(e) => updateUrlParam('sort', e.target.value)}
              className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer hover:text-brand-600"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {(urlSearch || selectedStage || selectedPosition) && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Filters active</span>
              <button
                onClick={clearAllFilters}
                className="font-medium text-brand-600 hover:text-brand-800 underline"
              >
                Reset all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Candidates Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : candidates.length === 0 ? (
          <EmptyState
            title="No candidates found"
            description={
              urlSearch || selectedStage || selectedPosition
                ? 'No applicants match your current filters or search term.'
                : 'Get started by adding your first applicant to the system.'
            }
            actionLabel={urlSearch || selectedStage || selectedPosition ? 'Clear Filters' : 'Add Candidate'}
            onAction={
              urlSearch || selectedStage || selectedPosition
                ? clearAllFilters
                : () => setIsAddModalOpen(true)
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-semibold tracking-wider text-slate-400 uppercase border-b border-slate-200/80 select-none">
                  <th className="py-3.5 px-6">Candidate</th>
                  <th className="py-3.5 px-6">Applied Role</th>
                  <th className="py-3.5 px-6">Stage</th>
                  <th className="py-3.5 px-6">Experience</th>
                  <th className="py-3.5 px-6">Source</th>
                  <th className="py-3.5 px-6">Applied Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {candidates.map((candidate) => {
                  const initials = candidate.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  const appliedDate = candidate.createdAt
                    ? new Date(candidate.createdAt.replace(' ', 'T')).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr
                      key={candidate.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Name & Contact */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarBg(
                              candidate.name
                            )}`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/candidates/${candidate.id}`}
                              className="font-semibold text-slate-900 hover:text-brand-600 transition-colors block truncate"
                            >
                              {candidate.name}
                            </Link>
                            <span className="text-xs text-slate-400 block truncate">
                              {candidate.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-4 px-6">
                        <span className="font-medium text-slate-800 block truncate max-w-[200px]">
                          {candidate.position}
                        </span>
                        {candidate.skills && (
                          <span className="text-xs text-slate-400 truncate block max-w-[200px]">
                            {candidate.skills}
                          </span>
                        )}
                      </td>

                      {/* Stage & Quick Changer */}
                      <td className="py-4 px-6">
                        <div className="relative inline-block">
                          <select
                            value={candidate.stage}
                            onChange={(e) =>
                              handleQuickStageChange(candidate.id, e.target.value, candidate.name)
                            }
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                            title="Click to quickly transition stage"
                          >
                            {STAGES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1 group-hover:ring-1 group-hover:ring-brand-200 rounded-full transition-all">
                            <Badge stage={candidate.stage} />
                            <ChevronDown className="w-3 h-3 text-slate-400 -ml-1 group-hover:text-brand-500" />
                          </div>
                        </div>
                      </td>

                      {/* Experience */}
                      <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {candidate.experienceYears}
                        </span>{' '}
                        {candidate.experienceYears === 1 ? 'yr' : 'yrs'}
                      </td>

                      {/* Source */}
                      <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          {candidate.source}
                        </span>
                      </td>

                      {/* Applied Date */}
                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap text-xs">
                        {appliedDate}
                      </td>

                      {/* Row Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/candidates/${candidate.id}`}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setEditingCandidate(candidate)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Candidate"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCandidateToDelete(candidate)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Candidate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={total}
          limit={pageLimit}
          onPageChange={(p) => updateUrlParam('page', p.toString())}
        />
      </div>

      {/* Add / Edit Candidate Modal */}
      <CandidateModal
        isOpen={isAddModalOpen || Boolean(editingCandidate)}
        candidate={editingCandidate}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCandidate(null);
        }}
        onSubmit={editingCandidate ? handleUpdateCandidate : handleCreateCandidate}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(candidateToDelete)}
        title="Delete Candidate"
        message={`Are you sure you want to delete ${candidateToDelete?.name}? All associated notes and stage history will be permanently removed.`}
        confirmText="Delete Candidate"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setCandidateToDelete(null)}
      />
    </div>
  );
}

export default CandidatesPage;
