import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Phone, Briefcase, Code, Award, Compass, Link as LinkIcon } from 'lucide-react';
import { STAGES } from './Badge';

const SOURCES = ['LinkedIn', 'Referral', 'Website', 'Indeed', 'GitHub', 'AngelList', 'Career Fair', 'Other'];

const INITIAL_FORM_STATE = {
  name: '',
  email: '',
  phone: '',
  position: '',
  skills: '',
  experienceYears: 0,
  source: 'LinkedIn',
  resumeUrl: '',
  stage: 'APPLIED',
};

export function CandidateModal({
  isOpen,
  candidate = null, // null for Add, candidate object for Edit
  onClose,
  onSubmit, // async function (data) => Promise
}) {
  const isEditing = Boolean(candidate);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (candidate) {
      setFormData({
        name: candidate.name || '',
        email: candidate.email || '',
        phone: candidate.phone || '',
        position: candidate.position || '',
        skills: candidate.skills || '',
        experienceYears: candidate.experienceYears ?? 0,
        source: candidate.source || 'LinkedIn',
        resumeUrl: candidate.resumeUrl || '',
        stage: candidate.stage || 'APPLIED',
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
    setErrors({});
  }, [candidate, isOpen]);

  // Keyboard accessibility: Escape to close & Tab focus trap
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'input, select, textarea, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    // Auto-focus first input field
    const timer = setTimeout(() => {
      const firstInput = modalRef.current?.querySelector('input[type="text"]');
      firstInput?.focus();
    }, 60);

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  function validate() {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Candidate name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.position.trim()) errs.position = 'Position is required';
    if (!formData.skills.trim()) errs.skills = 'At least one skill is required';
    if (formData.experienceYears === '' || Number(formData.experienceYears) < 0) {
      errs.experienceYears = 'Experience must be 0 or greater';
    }
    if (!formData.source.trim()) errs.source = 'Source is required';
    if (formData.resumeUrl && formData.resumeUrl.trim()) {
      try {
        new URL(formData.resumeUrl.trim());
      } catch {
        errs.resumeUrl = 'Please enter a valid URL (e.g. https://...)';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        experienceYears: Number(formData.experienceYears),
        phone: formData.phone.trim() || null,
        resumeUrl: formData.resumeUrl.trim() || null,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      // If duplicate email 409
      if (err.response?.status === 409 || err.message?.includes('already exists')) {
        setErrors((prev) => ({ ...prev, email: 'A candidate with this email already exists' }));
      } else if (err.response?.data?.details) {
        const fieldErrors = {};
        for (const item of err.response.data.details) {
          fieldErrors[item.field] = item.message;
        }
        setErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div 
        ref={modalRef}
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Candidate Details' : 'Add New Candidate'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? 'Update profile information and hiring stage' : 'Enter the candidate information to begin tracking'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      errors.name
                        ? 'border-rose-300 focus:ring-rose-200 text-rose-900'
                        : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'
                    }`}
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="sarah@example.com"
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      errors.email
                        ? 'border-rose-300 focus:ring-rose-200 text-rose-900'
                        : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
              </div>
            </div>

            {/* Phone & Position */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+1-415-555-0199"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Applied Position *
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleChange('position', e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className={`w-full pl-9 pr-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      errors.position
                        ? 'border-rose-300 focus:ring-rose-200 text-rose-900'
                        : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'
                    }`}
                  />
                </div>
                {errors.position && <p className="mt-1 text-xs text-rose-600">{errors.position}</p>}
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Key Skills (comma-separated) *
              </label>
              <div className="relative">
                <Code className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => handleChange('skills', e.target.value)}
                  placeholder="React, TypeScript, Tailwind, Node.js"
                  className={`w-full pl-9 pr-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.skills
                      ? 'border-rose-300 focus:ring-rose-200 text-rose-900'
                      : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'
                  }`}
                />
              </div>
              {errors.skills && <p className="mt-1 text-xs text-rose-600">{errors.skills}</p>}
            </div>

            {/* Experience, Source, Stage */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Experience (Years)
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={formData.experienceYears}
                    onChange={(e) => handleChange('experienceYears', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                  />
                </div>
                {errors.experienceYears && (
                  <p className="mt-1 text-xs text-rose-600">{errors.experienceYears}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Source *
                </label>
                <div className="relative">
                  <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    value={formData.source}
                    onChange={(e) => handleChange('source', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pipeline Stage
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => handleChange('stage', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all font-medium"
                >
                  {STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resume URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Resume Link / Portfolio URL
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="url"
                  value={formData.resumeUrl}
                  onChange={(e) => handleChange('resumeUrl', e.target.value)}
                  placeholder="https://storage.example.com/resumes/candidate.pdf"
                  className={`w-full pl-9 pr-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    errors.resumeUrl
                      ? 'border-rose-300 focus:ring-rose-200 text-rose-900'
                      : 'border-slate-200 focus:border-brand-500 focus:ring-brand-100'
                  }`}
                />
              </div>
              {errors.resumeUrl && <p className="mt-1 text-xs text-rose-600">{errors.resumeUrl}</p>}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-sm shadow-brand-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isEditing ? 'Save Changes' : 'Create Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CandidateModal;
