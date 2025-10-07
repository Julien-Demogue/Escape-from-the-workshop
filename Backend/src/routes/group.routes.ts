import { Router } from 'express';
import groupController from '../controllers/group.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

/**
 * @openapi
 * /groups/party/{partyId}:
 *   get:
 *     summary: Get groups for a specific party
 *     tags:
 *       - groups
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of groups for the party
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   partyId:
 *                     type: integer
 *       400:
 *         description: Invalid party id
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 */
router.get('/party/:partyId', (req, res) => groupController.getGroupsByPartyId(req, res));

/**
 * @openapi
 * /groups/{groupId}/users:
 *   get:
 *     summary: Get users of a specific group
 *     tags:
 *       - groups
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
 *         description: List of users in the group
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Invalid group id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/:groupId/users', (req, res) => groupController.getGroupUsers(req, res));

/**
 * @openapi
 * /groups:
 *   post:
 *     summary: Create multiple groups for a party
 *     tags:
 *       - groups
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - partyId
 *             properties:
 *               partyId:
 *                 type: integer
 *                 example: 1
 *               amount:
 *                 type: integer
 *                 description: Number of groups to create (default 1)
 *                 example: 3
 *     responses:
 *       201:
 *         description: Groups created
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   partyId:
 *                     type: integer
 *       400:
 *         description: Invalid request (missing/invalid fields)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Party not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/', (req, res) => groupController.createGroups(req, res));

/**
 * @openapi
 * /groups/{groupId}/join:
 *   post:
 *     summary: Join a group
 *     tags:
 *       - groups
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
 *         description: Successfully joined the group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groupId:
 *                   type: integer
 *                 memberId:
 *                   type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request (invalid group id)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/:groupId/join', (req, res) => groupController.joinGroup(req, res));

/**
 * @openapi
 * /groups/{groupId}:
 *   put:
 *     summary: Update a group's name
 *     tags:
 *       - groups
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Team A"
 *     responses:
 *       200:
 *         description: Group updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 partyId:
 *                   type: integer
 *       400:
 *         description: Invalid request (invalid group id or name)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal Server Error
 */
router.put('/:groupId', (req, res) => groupController.updateGroupName(req, res));

/**
 * @openapi
 * /groups/{groupId}/points:
 *   patch:
 *     summary: Add points to a group
 *     tags:
 *       - groups
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
 *               - points
 *             properties:
 *               points:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Group updated with added points
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 partyId:
 *                   type: integer
 *                 points:
 *                   type: integer
 *       400:
 *         description: Invalid request (invalid group id or points)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal Server Error
 */
router.patch('/:groupId/points', (req, res) => groupController.addPoints(req, res));

/**
 * @openapi
 * /groups/{groupId}/complete-challenge:
 *   post:
 *     summary: Mark a challenge as completed for a group
 *     tags:
 *       - groups
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
 *               - challengeId
 *             properties:
 *               challengeId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Challenge marked as completed for the group
 *       400:
 *         description: Invalid request (invalid group id or challenge id)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group or challenge not found
 *       500:
 *         description: Internal Server Error
 */
router.post('/:groupId/complete-challenge', (req, res) => groupController.completeChallengeForGroup(req, res));

/**
 * @openapi
 * /groups/{groupId}:
 *   delete:
 *     summary: Delete a group
 *     tags:
 *       - groups
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
 *         description: Group deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *       400:
 *         description: Invalid request (invalid group id)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal Server Error
 */
router.delete('/:groupId', (req, res) => groupController.deleteGroup(req, res));

export default router;