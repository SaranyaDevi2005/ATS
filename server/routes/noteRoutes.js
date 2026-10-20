import express from 'express';
import { deleteNote } from '../controllers/noteController.js';

const router = express.Router();

// Delete a note by its ID
router.delete('/:noteId', deleteNote);

export default router;
