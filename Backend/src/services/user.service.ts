import { PrismaClient, User } from "../generated/prisma";

export class UserService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getAll(): Promise<User[]> {
        return this.prisma.user.findMany();
    }

    async getById(id: number): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }
}

export default new UserService();