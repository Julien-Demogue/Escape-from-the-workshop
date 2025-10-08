import { PrismaClient, Message } from "../generated/prisma";

export class MessageService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getById(id: number): Promise<Message | null> {
        return this.prisma.message.findUnique({ where: { id } });
    }

    async getMessagesByGroupId(groupId: number): Promise<Message[]> {
        return this.prisma.message.findMany({
            where: { groupId },
            orderBy: { sendDate: 'asc' },
        });
    }

    async createMessage(groupId: number, senderId: number, content: string): Promise<Message> {
        return this.prisma.message.create({
            data: {
                groupId,
                senderId,
                content,
                sendDate: new Date(),
            },
        });
    }
}