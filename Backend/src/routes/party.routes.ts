import { Router } from 'express';
import partyController from '../controllers/party.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /parties/code/{code}:
 *   get:
 *     summary: Get a party by its code (Not working for now)
 *     tags:
 *       - parties
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Party found
 *       404:
 *         description: Party not found
 */
router.get('/code/:code', (req, res) => partyController.getByCode(req, res));

/**
 * @openapi
 * /parties:
 *   post:
 *     summary: Create a new party
 *     tags:
 *       - parties
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Party created
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', (req, res) => partyController.createParty(req, res));

/**
 * @openapi
 * /parties/{id}/start:
 *   post:
 *     summary: Start a party by setting its end date
 *     tags:
 *       - parties
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Party started
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/start', (req, res) => partyController.startParty(req, res));

export default router;
