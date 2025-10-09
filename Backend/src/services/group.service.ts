import { PrismaClient, Group, GroupUser, User } from "../generated/prisma";
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

    async createGroup(partyId: number): Promise<Group> {
        const code = generateCode(4);

        const newGroup = await this.prisma.group.create({
            data: {
                partyId,
                code,
                name: `Group ${code}`,
            },
        });

        // Initialise challenge progress
        const challenges = await this.prisma.challenge.findMany();
        for (const challenge of challenges) {
            await this.prisma.challengeProgress.create({
                data: {
                    challengeId: challenge.id,
                    groupId: newGroup.id,
                    isCompleted: false,
                },
            });
        }

        return newGroup;
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

    async addPoints(groupId: number, points: number): Promise<Group> {
        return this.prisma.group.update({
            where: { id: groupId },
            data: { score: { increment: points } },
        });
    }

    async completeChallengeForGroup(groupId: number, challengeId: number): Promise<void> {
        await this.prisma.challengeProgress.updateMany({
            where: { groupId, challengeId },
            data: { isCompleted: true },
        });
    }

    async deleteGroup(groupId: number): Promise<Group> {
        return this.prisma.$transaction(async (tx) => {
            await tx.groupUser.deleteMany({ where: { groupId } });
            await tx.message.deleteMany({ where: { groupId } });
            await tx.challengeProgress.deleteMany({ where: { groupId } });
            return tx.group.delete({ where: { id: groupId } });
        });
    }
}