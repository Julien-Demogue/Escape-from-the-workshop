import { Request, Response } from 'express';
import { GroupService } from '../services/group.service';
import { PartyService } from '../services/party.service';

export class GroupController {
    private groupService: GroupService;
    private partyService: PartyService;

    constructor() {
        this.groupService = new GroupService();
        this.partyService = new PartyService();
    }

    async getGroupsByPartyId(req: Request, res: Response): Promise<void> {
        try {
            const partyId = parseInt(req.params.partyId, 10);

            if (isNaN(partyId)) {
                res.status(400).json({ error: 'Invalid party id' });
                return;
            }

            const groups = await this.groupService.getGroupsByPartyId(partyId);
            res.status(200).json(groups);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getGroupUsers(req: Request, res: Response): Promise<void> {
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

            const groupUsers = await this.groupService.getGroupUsers(groupId);
            res.status(200).json(groupUsers);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async createGroups(req: Request, res: Response): Promise<void> {
        try {
            const partyId = parseInt(req.body.partyId, 10);
            const amount = parseInt(req.body.amount, 10) || 1;

            if (isNaN(amount) || amount <= 0) {
                res.status(400).json({ error: 'Invalid amount' });
                return;
            }

            if (isNaN(partyId)) {
                res.status(400).json({ error: 'Invalid party id' });
                return;
            }

            const party = await this.partyService.getById(partyId);
            if (!party) {
                res.status(404).json({ error: 'Party not found' });
                return;
            }

            const groupPromises = [];
            for (let i = 0; i < amount; i++) {
                groupPromises.push(this.groupService.createGroup(partyId));
            }
            const groups = await Promise.all(groupPromises);
            res.status(201).json(groups);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async joinGroup(req: Request, res: Response): Promise<void> {
        try {
            const groupId = parseInt(req.params.groupId, 10);
            const userId = (req as any).user?.id;

            if (isNaN(groupId) || isNaN(userId)) {
                res.status(400).json({ error: 'Invalid group id or user id' });
                return;
            }

            const group = await this.groupService.getById(groupId);
            if (!group) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            const groupUser = await this.groupService.joinGroup(groupId, userId);
            res.status(201).json(groupUser);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async updateGroupName(req: Request, res: Response): Promise<void> {
        try {
            const groupId = parseInt(req.params.groupId, 10);
            const { name } = req.body;

            if (isNaN(groupId)) {
                res.status(400).json({ error: 'Invalid group id' });
                return;
            }

            const group = await this.groupService.getById(groupId);
            if (!group) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            if (typeof name !== 'string' || name.trim().length === 0) {
                res.status(400).json({ error: 'Invalid group name' });
                return;
            }

            const updatedGroup = await this.groupService.updateGroupName(groupId, name.trim());
            res.status(200).json(updatedGroup);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async addPoints(req: Request, res: Response): Promise<void> {
        try {
            const groupId = parseInt(req.params.groupId, 10);
            const points = parseInt(req.body.points, 10);

            if (isNaN(groupId) || isNaN(points)) {
                res.status(400).json({ error: 'Invalid group id or points' });
                return;
            }

            const group = await this.groupService.getById(groupId);
            if (!group) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            const updatedGroup = await this.groupService.addPoints(groupId, points);
            res.status(200).json(updatedGroup);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async deleteGroup(req: Request, res: Response): Promise<void> {
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

            const deletedGroup = await this.groupService.deleteGroup(groupId);
            res.status(200).json(deletedGroup);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export default new GroupController();
