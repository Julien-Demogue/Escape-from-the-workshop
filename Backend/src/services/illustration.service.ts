import { PrismaClient, Illustration } from "../generated/prisma";

export class IllustrationService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getById(id: number): Promise<Illustration | null> {
        return this.prisma.illustration.findUnique({ where: { id } });
    }
}