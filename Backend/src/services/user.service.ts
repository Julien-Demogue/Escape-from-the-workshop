import { PrismaClient, User } from "../generated/prisma";

export class UserService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getById(id: number): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async getByEmail(hashedEmail: string): Promise<User | null> {
        return this.prisma.user.findFirst({ where: { hashedEmail } });
    }

    async createUser(hashedEmail: string, username: string, color: string): Promise<User> {
        return this.prisma.user.create({
            data: { hashedEmail, username, color }
        });
    }

    async getUsersByGroupId(groupId: number): Promise<User[]> {
        const groupUsers = await this.prisma.groupUser.findMany({
            where: { groupId },
            include: { user: true }
        });
        return groupUsers.map(gu => gu.user);
    }
}

export default new UserService();