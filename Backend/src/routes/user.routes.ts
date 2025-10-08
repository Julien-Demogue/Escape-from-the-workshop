import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import authMiddleware from '../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

router.use(authMiddleware);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Get a user by id
 *     tags:
 *       - users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Numeric ID of the user to retrieve
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 hashedEmail:
 *                   type: string
 *                 color:
 *                   type: string
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id', (req, res) => userController.getUserById(req, res));

/**
 * @openapi
 * /groups/{groupId}/users:
 *   get:
 *     summary: Get users of a specific group
 *     tags:
 *       - users
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
 *       400:
 *         description: Invalid group id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 *       500:
 *         description: Internal Server Error
 */
router.get('/groups/:groupId/users', (req, res) => userController.getUsersByGroupId(req, res));

export default router;