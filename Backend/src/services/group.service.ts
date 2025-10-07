import { PrismaClient, Group, GroupUser } from "../generated/prisma";
import { generateCode } from "../utils/codeGenerator";

export class GroupService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getById(id: number): Promise<Group | null> {
        return this.prisma.group.findUnique({ where: { id } });
    }

    async getGroupsByPartyId(partyId: number): Promise<Group[]> {
        return this.prisma.group.findMany({ where: { partyId } });
    }

    async getGroupUsers(groupId: number): Promise<GroupUser[]> {
        return this.prisma.groupUser.findMany({ where: { groupId } });
    }

    async createGroup(partyId: number): Promise<Group> {
        const code = generateCode(4);

        return this.prisma.group.create({
            data: {
                partyId,
                code,
                name: `Group ${code}`,
            },
        });
    }

    async joinGroup(groupId: number, userId: number): Promise<GroupUser> {
        return this.prisma.groupUser.create({
            data: {
                groupId,
                userId,
            },
        });
    }

    async updateGroupName(groupId: number, name: string): Promise<Group> {
        return this.prisma.group.update({
            where: { id: groupId },
            data: { name },
        });
    }

    async deleteGroup(groupId: number): Promise<Group> {
        return this.prisma.group.delete({
            where: { id: groupId },
        });
    }
}