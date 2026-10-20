import express from 'express';
import {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  updateCandidateStage,
} from '../controllers/candidateController.js';
import { addNote } from '../controllers/noteController.js';
import { validate } from '../middleware/validate.js';
import {
  candidateQuerySchema,
  createCandidateSchema,
  updateCandidateSchema,
  updateStageSchema,
} from '../validators/candidateValidator.js';
import { createNoteSchema } from '../validators/noteValidator.js';

const router = express.Router();

// Candidate list & creation
router.get('/', validate(candidateQuerySchema, 'query'), getCandidates);
router.post('/', validate(createCandidateSchema, 'body'), createCandidate);

// Candidate details, update, delete
router.get('/:id', getCandidateById);
router.put('/:id', validate(updateCandidateSchema, 'body'), updateCandidate);
router.delete('/:id', deleteCandidate);

// Candidate stage update
router.patch('/:id/stage', validate(updateStageSchema, 'body'), updateCandidateStage);

// Candidate notes
router.post('/:id/notes', validate(createNoteSchema, 'body'), addNote);

export default router;
