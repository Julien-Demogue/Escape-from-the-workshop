import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware';
import messageController from '../controllers/message.controller';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /messages/{groupId}:
 *   get:
 *     summary: Get messages for a specific group
 *     tags:
 *       - messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of messages for the group
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Invalid group id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:groupId', (req, res) => messageController.getMessagesByGroupId(req, res));

/**
 * @openapi
 * /messages/{groupId}:
 *   post:
 *     summary: Create a message in a group
 *     tags:
 *       - messages
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/:groupId', (req, res) => messageController.createMessage(req, res));

export default router;