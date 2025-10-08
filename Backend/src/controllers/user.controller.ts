import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { GroupService } from '../services/group.service';

export class UserController {
    private userService: UserService;
    private groupService: GroupService;

    constructor() {
        this.userService = new UserService();
        this.groupService = new GroupService();
    }

    async getUserById(req: Request, res: Response): Promise<void> {
        const id = parseInt(req.params.id, 10);
        try {
            const user = await this.userService.getById(id);
            if (user) {
                res.status(200).json(user);
            }
            else {
                res.status(404).json({ error: 'User not found' });
            }
        }
        catch (error) {
            res.status(500).json({ error: 'Internal Server Error ' + error });
        }
    }

    async getUsersByGroupId(req: Request, res: Response): Promise<void> {
        try {
            const groupId = parseInt(req.params.groupId, 10);

            if (isNaN(groupId)) {
                res.status(400).json({ error: 'Invalid group id' });
                return;
            }

            const group = await this.groupService.getById(groupId);
            if (!group) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            const users = await this.userService.getUsersByGroupId(groupId);
            res.status(200).json(users);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export default new UserController();