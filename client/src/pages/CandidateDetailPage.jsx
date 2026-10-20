import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  Compass,
  Calendar,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  MessageSquare,
  Edit2,
  ChevronRight,
  GitCommit,
} from 'lucide-react';
import {
  fetchCandidateById,
  updateCandidate,
  deleteCandidate,
  updateCandidateStage,
  addCandidateNote,
  deleteCandidateNote,
} from '../api/candidates';
import Badge, { STAGES } from '../components/Badge';
import CandidateModal from '../components/CandidateModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { DetailSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';

export function CandidateDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [candidate, setCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Notes state
  const [noteContent, setNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  // Candidate delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);

  // Stage change loading state
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  const loadCandidateData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCandidateById(id);
      setCandidate(data);
    } catch (err) {
      showToast(err.userMessage || 'Candidate not found', 'error');
      navigate('/candidates');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    loadCandidateData();
  }, [loadCandidateData]);

  // Handle stage change
  const handleStageSelect = async (newStage) => {
    if (!candidate || candidate.stage === newStage || isUpdatingStage) return;
    setIsUpdatingStage(true);
    try {
      const updated = await updateCandidateStage(candidate.id, newStage);
      setCandidate(updated);
      showToast(`Updated stage to ${newStage}`);
    } catch (err) {
      showToast(err.userMessage || 'Failed to update stage', 'error');
    } finally {
      setIsUpdatingStage(false);
    }
  };

  // Handle Candidate Update via Modal
  const handleEditSubmit = async (formData) => {
    const updated = await updateCandidate(candidate.id, formData);
    setCandidate(updated);
    showToast('Candidate details updated');
    setIsEditModalOpen(false);
  };

  // Handle Delete Candidate
  const handleDeleteCandidate = async () => {
    setIsDeletingCandidate(true);
    try {
      await deleteCandidate(candidate.id);
      showToast(`Candidate ${candidate.name} deleted`);
      navigate('/candidates');
    } catch (err) {
      showToast(err.userMessage || 'Failed to delete candidate', 'error');
    } finally {
      setIsDeletingCandidate(false);
    }
  };

  // Handle Add Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim() || isAddingNote) return;

    setIsAddingNote(true);
    try {
      const createdNote = await addCandidateNote(candidate.id, noteContent.trim());
      setCandidate((prev) => ({
        ...prev,
        notes: [createdNote, ...(prev.notes || [])],
      }));
      setNoteContent('');
      showToast('Note added successfully');
    } catch (err) {
      showToast(err.userMessage || 'Failed to add note', 'error');
    } finally {
      setIsAddingNote(false);
    }
  };

  // Handle Delete Note
  const handleDeleteNoteConfirm = async () => {
    if (!noteToDelete) return;
    setIsDeletingNote(true);
    try {
      await deleteCandidateNote(noteToDelete.id);
      setCandidate((prev) => ({
        ...prev,
        notes: (prev.notes || []).filter((n) => n.id !== noteToDelete.id),
      }));
      showToast('Note deleted');
      setNoteToDelete(null);
    } catch (err) {
      showToast(err.userMessage || 'Failed to delete note', 'error');
    } finally {
      setIsDeletingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        <DetailSkeleton />
      </div>
    );
  }

  if (!candidate) return null;

  const initials = candidate.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const skillsList = candidate.skills
    ? candidate.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const appliedDate = candidate.createdAt
    ? new Date(candidate.createdAt.replace(' ', 'T')).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Navigation Breadcrumb / Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/candidates"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Candidates</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-brand-500/20 shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {candidate.name}
              </h2>
              <Badge stage={candidate.stage} size="md" />
            </div>
            <p className="text-sm font-medium text-slate-600 mt-1 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>{candidate.position}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">{candidate.experienceYears} years experience</span>
            </p>
          </div>
        </div>

        {/* Resume link button */}
        {candidate.resumeUrl && (
          <a
            href={candidate.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-brand-700 bg-brand-50 border border-brand-200/60 rounded-xl hover:bg-brand-100 transition-colors shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Resume</span>
          </a>
        )}
      </div>

      {/* Stage Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
          <span>Hiring Pipeline Stage</span>
          {isUpdatingStage && (
            <span className="text-brand-600 flex items-center gap-1 font-medium normal-case">
              <span className="w-3 h-3 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
              Updating stage...
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {STAGES.map((st) => {
            const isActive = candidate.stage === st;
            return (
              <button
                key={st}
                onClick={() => handleStageSelect(st)}
                disabled={isUpdatingStage}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {isActive && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                <span>{st}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Info + Timeline | Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Candidate Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-slate-400">Email Address</div>
                  <a
                    href={`mailto:${candidate.email}`}
                    className="font-medium text-slate-800 hover:text-brand-600 truncate block"
                  >
                    {candidate.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-400">Phone Number</div>
                  <div className="font-medium text-slate-800">
                    {candidate.phone || 'Not provided'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Compass className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-400">Candidate Source</div>
                  <div className="font-medium text-slate-800">{candidate.source}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-slate-400">Application Date</div>
                  <div className="font-medium text-slate-800">{appliedDate}</div>
                </div>
              </div>
            </div>

            {/* Skills Chips */}
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Identified Skills & Expertise
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skillsList.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Timeline of Stage History */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Stage Transition Timeline
              </h3>
              <span className="text-xs text-slate-400">
                {candidate.stageHistory?.length || 0} transitions logged
              </span>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {candidate.stageHistory?.map((history, idx) => {
                const isLatest = idx === candidate.stageHistory.length - 1;
                const formattedTime = history.changedAt
                  ? new Date(history.changedAt.replace(' ', 'T')).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A';

                return (
                  <div key={history.id || idx} className="relative group">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isLatest
                          ? 'bg-brand-600 border-white ring-4 ring-brand-100 text-white'
                          : 'bg-white border-slate-300 text-slate-400'
                      }`}
                    >
                      <GitCommit className="w-3 h-3" />
                    </div>

                    <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {history.fromStage ? (
                            <>
                              <Badge stage={history.fromStage} size="xs" showDot={false} />
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                              <Badge stage={history.toStage} size="xs" />
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                              <span>Initial Application:</span>
                              <Badge stage={history.toStage} size="xs" />
                            </div>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {formattedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Recruiter Notes */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-600" />
                <span>Recruiter Notes</span>
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {candidate.notes?.length || 0}
              </span>
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-2.5">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write interview impressions, compensation notes, screening feedback..."
                rows={3}
                className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100 transition-all resize-none placeholder:text-slate-400"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!noteContent.trim() || isAddingNote}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors disabled:opacity-40 shadow-xs"
                >
                  {isAddingNote ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Post Note</span>
                </button>
              </div>
            </form>

            {/* Notes List (Newest First) */}
            <div className="space-y-3 pt-2">
              {!candidate.notes || candidate.notes.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No notes recorded yet. Add the first recruiter note above.
                </div>
              ) : (
                candidate.notes.map((note) => {
                  const noteDate = note.createdAt
                    ? new Date(note.createdAt.replace(' ', 'T')).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Just now';

                  return (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1.5 group hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{noteDate}</span>
                        <button
                          onClick={() => setNoteToDelete(note)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-all rounded"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Candidate Details Modal */}
      <CandidateModal
        isOpen={isEditModalOpen}
        candidate={candidate}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
      />

      {/* Delete Candidate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Candidate Profile"
        message={`Are you sure you want to delete ${candidate.name}? This will delete all notes and history records immediately.`}
        confirmText="Yes, Delete"
        isLoading={isDeletingCandidate}
        onConfirm={handleDeleteCandidate}
        onClose={() => setIsDeleteDialogOpen(false)}
      />

      {/* Delete Note Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(noteToDelete)}
        title="Delete Note"
        message="Are you sure you want to delete this recruiter note? This action cannot be reversed."
        confirmText="Delete Note"
        isLoading={isDeletingNote}
        onConfirm={handleDeleteNoteConfirm}
        onClose={() => setNoteToDelete(null)}
      />
    </div>
  );
}

export default CandidateDetailPage;
