import { PrismaClient, Info, Illustration } from "../generated/prisma";

export class InfoService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getById(id: number): Promise<Info | null> {
        return this.prisma.info.findUnique({ where: { id } });
    }

    async getInfoIllustrations(infoId: number): Promise<Illustration[]> {
        return this.prisma.illustration.findMany({ where: { infoId } });
    }
}