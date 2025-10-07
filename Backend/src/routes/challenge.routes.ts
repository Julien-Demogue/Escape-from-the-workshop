import { Router } from 'express';
import { ChallengeController } from '../controllers/challenge.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

const challengeController = new ChallengeController();

/**
 * @openapi
 * /challenges:
 *   get:
 *     summary: Get all challenges
 *     tags:
 *       - challenges
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of challenges
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get('/', (req, res) => challengeController.getAllChallenges(req, res));

/**
 * @openapi
 * /challenges/{challengeId}/info:
 *   get:
 *     summary: Get info for a challenge
 *     tags:
 *       - challenges
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Challenge info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid challenge id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Challenge not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:challengeId/info', (req, res) => challengeController.getChallengeInfo(req, res));

/**
 * @openapi
 * /challenges/{challengeId}:
 *   get:
 *     summary: Get a challenge by id
 *     tags:
 *       - challenges
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: challengeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Challenge object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid challenge id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Challenge not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:challengeId', (req, res) => challengeController.getById(req, res));

export default router;
