import { PrismaClient, Party } from "../generated/prisma";
import { generateCode } from "../utils/codeGenerator";

export class PartyService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getByCode(code: string): Promise<Party | null> {
        return this.prisma.party.findFirst({ where: { code } });
    }

    async createParty(adminUserId: number): Promise<Party> {
        const code = generateCode();

        return this.prisma.party.create({
            data: {
                code,
                adminUserId,
            },
        });
    }

    async startParty(partyId: number, endTime: Date): Promise<Party> {
        return this.prisma.party.update({
            where: { id: partyId },
            data: { endTime },
        });
    }
}