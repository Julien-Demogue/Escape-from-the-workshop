<<<<<<< HEAD
import { PrismaClient, Group, GroupUser } from "../generated/prisma";
import { CreateMessageDto } from "../models/message.model";
import { UserService } from "./user.service";

interface Message {
  id: number;
  groupId: number;
  content: string;
  senderId: number;
  sendDate: Date;
}

export class MessageService {
  private prisma: PrismaClient;
  private userService: UserService;

  constructor() {
    this.prisma = new PrismaClient();
    this.userService = new UserService();
  }

  async sendMessage(message: CreateMessageDto): Promise<Message> {

    const newMessage = await this.prisma.message.create({
      data: {
        groupId: message.groupId,
        content: message.content,
        senderId: Number(message.senderId),
        sendDate: new Date()
      },
    });

    return {
      id: newMessage.id,
      groupId: newMessage.groupId,
      content: newMessage.content,
      senderId: newMessage.senderId,
      sendDate: newMessage.sendDate
    };
  }

  async getMessagesFromGroup(groupId: string): Promise<Message[]> {
    const groupMessages =  this.prisma.message.findMany({
      where: { groupId: Number(groupId) },
      orderBy: { sendDate: 'asc' }
    });

    const groupUsers = await this.userService.getUsersFromGroup(Number(groupId));

    const messagesConvertedInTypeMessage: Message[] = (await groupMessages).map(msg => ({
      id: msg.id,
      groupId: msg.groupId,
      content: msg.content,
      senderId: msg.senderId,
      senderName: groupUsers.find(user => user.id === msg.senderId)?.username,
      senderColor: groupUsers.find(user => user.id === msg.senderId)?.color,
      sendDate: new Date(msg.sendDate)
    }));
    return messagesConvertedInTypeMessage;
  }

  async joinGroup(groupId: number, userId: number): Promise<GroupUser> {
    return this.prisma.groupUser.create({
      data: {
        groupId,
        userId,
      },
    });
  }
=======
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
>>>>>>> fc4bc8ffea447689ef9c576de09ad90c46989a4a
}