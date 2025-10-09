import express from 'express';
import ChallengeController from '../controllers/challenge.controller';

const router = express.Router();

// Obtenir tous les challenges
router.get('/', ChallengeController.getAllChallenges.bind(ChallengeController));

// Obtenir un challenge spécifique
router.get('/:challengeId', ChallengeController.getById.bind(ChallengeController));

// Obtenir les infos d'un challenge
router.get('/:challengeId/info', ChallengeController.getChallengeInfo.bind(ChallengeController));

// Obtenir la progression d'un groupe
router.get('/group/:groupId/progress', ChallengeController.getGroupProgress.bind(ChallengeController));

// Valider un challenge pour un groupe
router.post('/group/:groupId/challenge/:challengeId/validate', ChallengeController.validateChallenge.bind(ChallengeController));

export default router;