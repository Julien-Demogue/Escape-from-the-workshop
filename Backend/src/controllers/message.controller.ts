import { Request, Response } from 'express';
import { MessageService } from '../services/message.service';
import { GroupService } from '../services/group.service';
import { CreateMessageDto } from '../models/message.model';
import jwt from 'jsonwebtoken';
interface JwtPayload {
    id: number;           // ✅ Votre token utilise 'id', pas 'userId'
    hashedEmail: string;
    iat?: number;
    exp?: number;
}

export class MessageController {
    private messageService: MessageService;
    private groupService: GroupService;

    constructor() {
        this.messageService = new MessageService();
        this.groupService = new GroupService();
    }

    async getMessagesByGroupId(req: Request, res: Response): Promise<void> {
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

            const messages = await this.messageService.getMessagesByGroupId(groupId);
            res.status(200).json(messages);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async createMessage(req: Request, res: Response): Promise<void> {
        try {
            const groupId = parseInt(req.params.groupId, 10);
            const content = req.body.content;
            const senderId = (req as any).user?.id;

            if (isNaN(groupId) || !content || !senderId) {
                res.status(400).json({ error: 'Invalid input' });
                return;
            }

            const group = await this.groupService.getById(groupId);
            if (!group) {
                res.status(404).json({ error: 'Group not found' });
                return;
            }

            const messageSent: CreateMessageDto = {
                groupId: groupId,
                content: content,
                senderId: senderId,
                sendDate: new Date()
            }


            const message = await this.messageService.sendMessage(messageSent);
            res.status(201).json(message);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export default new MessageController();