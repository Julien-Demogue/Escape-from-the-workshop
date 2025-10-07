import { PrismaClient, Challenge, Info } from "../generated/prisma";

export class ChallengeService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getById(id: number): Promise<Challenge | null> {
        return this.prisma.challenge.findUnique({ where: { id } });
    }

    async getChallengeInfo(challengeId: number): Promise<Info | null> {
        return this.prisma.info.findFirst({ where: { challengeId } });
    }

    async getAllChallenges(): Promise<Challenge[]> {
        return this.prisma.challenge.findMany();
    }
}