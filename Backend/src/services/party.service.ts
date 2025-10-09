import { PrismaClient, Party } from "../generated/prisma";
import { generateCode } from "../utils/codeGenerator";

export class PartyService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getById(id: number): Promise<Party | null> {
        return this.prisma.party.findUnique({ where: { id } });
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

    async startParty(partyId: number, endTimeTimestamp: number): Promise<Party> {
        // endTimeTimestamp is expected in milliseconds.
        // Convert to a JS Date so Prisma writes a DATETIME/TIMESTAMP value.
        const endDate = new Date(endTimeTimestamp);
        return this.prisma.party.update({
            where: { id: partyId },
            data: { endTime: endDate },
        });
    }
}