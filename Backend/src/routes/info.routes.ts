import { Router } from 'express';
import infoController from '../controllers/info.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /info/{infoId}/illustrations:
 *   get:
 *     summary: Get illustrations for a specific info entry
 *     tags:
 *       - info
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: infoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of illustrations for the info entry
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Invalid info id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Info not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:infoId/illustrations', (req, res) => infoController.getInfoIllustrations(req, res));

export default router;
