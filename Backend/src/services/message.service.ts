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

  async getMessagesFromGroup(groupId: number): Promise<Message[]> {
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
}