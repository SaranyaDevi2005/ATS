import { z } from 'zod';
import { ALLOWED_STAGES } from '../utils/caseConverter.js';

export const stageEnum = z.enum(ALLOWED_STAGES, {
  errorMap: () => ({
    message: `Stage must be one of: ${ALLOWED_STAGES.join(', ')}`,
  }),
});

// Helper for parsing skills whether sent as array or comma-separated string
const skillsSchema = z
  .union([
    z.string().min(1, 'Skills must not be empty'),
    z.array(z.string().min(1)).min(1, 'Skills array must not be empty'),
  ])
  .transform((val) => {
    if (Array.isArray(val)) {
      return val.map((s) => s.trim()).filter(Boolean).join(', ');
    }
    return val.trim();
  });

// Schema for creating candidate
export const createCandidateSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    phone: z.string().trim().nullable().optional().or(z.literal('')),
    position: z.string().trim().min(1, 'Position is required'),
    skills: skillsSchema,
    experienceYears: z.coerce.number().int().min(0, 'Experience years must be >= 0').default(0),
    experience_years: z.coerce.number().int().min(0).optional(),
    source: z.string().trim().min(1, 'Source is required'),
    resumeUrl: z.string().trim().url('Invalid resume URL format').nullable().optional().or(z.literal('')),
    resume_url: z.string().trim().url('Invalid resume URL format').nullable().optional().or(z.literal('')),
    stage: stageEnum.default('APPLIED'),
  })
  .transform((data) => {
    // Normalize snake_case / camelCase aliases
    const experienceYears = data.experience_years !== undefined ? data.experience_years : data.experienceYears;
    const resumeUrl = data.resume_url !== undefined ? data.resume_url : data.resumeUrl;
    const phone = data.phone === '' ? null : data.phone ?? null;
    const finalResumeUrl = resumeUrl === '' ? null : resumeUrl ?? null;

    return {
      name: data.name,
      email: data.email,
      phone,
      position: data.position,
      skills: data.skills,
      experienceYears,
      source: data.source,
      resumeUrl: finalResumeUrl,
      stage: data.stage,
    };
  });

// Schema for updating candidate
export const updateCandidateSchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be empty').optional(),
    email: z.string().trim().toLowerCase().email('Invalid email address').optional(),
    phone: z.string().trim().nullable().optional().or(z.literal('')),
    position: z.string().trim().min(1, 'Position cannot be empty').optional(),
    skills: skillsSchema.optional(),
    experienceYears: z.coerce.number().int().min(0, 'Experience years must be >= 0').optional(),
    experience_years: z.coerce.number().int().min(0).optional(),
    source: z.string().trim().min(1, 'Source cannot be empty').optional(),
    resumeUrl: z.string().trim().url('Invalid resume URL format').nullable().optional().or(z.literal('')),
    resume_url: z.string().trim().url('Invalid resume URL format').nullable().optional().or(z.literal('')),
    stage: stageEnum.optional(),
  })
  .transform((data) => {
    const result = {};
    if (data.name !== undefined) result.name = data.name;
    if (data.email !== undefined) result.email = data.email;
    if (data.phone !== undefined) result.phone = data.phone === '' ? null : data.phone;
    if (data.position !== undefined) result.position = data.position;
    if (data.skills !== undefined) result.skills = data.skills;
    if (data.experience_years !== undefined) {
      result.experienceYears = data.experience_years;
    } else if (data.experienceYears !== undefined) {
      result.experienceYears = data.experienceYears;
    }
    if (data.source !== undefined) result.source = data.source;
    if (data.resume_url !== undefined) {
      result.resumeUrl = data.resume_url === '' ? null : data.resume_url;
    } else if (data.resumeUrl !== undefined) {
      result.resumeUrl = data.resumeUrl === '' ? null : data.resumeUrl;
    }
    if (data.stage !== undefined) result.stage = data.stage;
    return result;
  });

// Schema for updating candidate stage
export const updateStageSchema = z.object({
  stage: stageEnum,
});

// Schema for candidate search / filter / pagination query parameters
export const candidateQuerySchema = z.object({
  search: z.string().trim().optional().default(''),
  stage: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val === '' ? undefined : val))
    .refine((val) => val === undefined || ALLOWED_STAGES.includes(val), {
      message: `Stage filter must be one of: ${ALLOWED_STAGES.join(', ')}`,
    }),
  position: z.string().trim().optional().default(''),
  sort: z.string().trim().optional().default('createdAt:desc'),
  page: z.coerce.number().int().min(1, 'Page must be >= 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be >= 1').max(100, 'Limit cannot exceed 100').default(10),
});
