import { Request, Response } from 'express';
import { PartyService } from '../services/party.service';

export class PartyController {
    private partyService: PartyService;

    constructor() {
        this.partyService = new PartyService();
    }

    async getById(req: Request, res: Response): Promise<void> {
        try {
            const partyId = parseInt(req.params.id, 10);

            if (isNaN(partyId)) {
                res.status(400).json({ error: 'Invalid party id' });
                return;
            }

            const party = await this.partyService.getById(partyId);
            if (!party) {
                res.status(404).json({ error: 'Party not found' });
                return;
            }

            res.status(200).json(party);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getByCode(req: Request, res: Response): Promise<void> {
        try {
            const code = req.params.code;

            const party = await this.partyService.getByCode(code);
            if (!party) {
                res.status(404).json({ error: 'Party not found' });
                return;
            }

            res.status(200).json(party);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async createParty(req: Request, res: Response): Promise<void> {
        try {
            const adminUserId = (req as any).user?.id;

            if (!adminUserId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const party = await this.partyService.createParty(adminUserId);
            res.status(201).json(party);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async startParty(req: Request, res: Response): Promise<void> {
        try {
            const partyId = parseInt(req.params.id, 10);
            const { endDate } = req.body; // expected as timestamp (ms) number or numeric string

            if (isNaN(partyId)) {
                res.status(400).json({ error: 'Invalid party id' });
                return;
            }

            let party = await this.partyService.getById(partyId);
            if (!party) {
                res.status(404).json({ error: 'Party not found' });
                return;
            }

            if (endDate === undefined || endDate === null) {
                res.status(400).json({ error: 'endDate is required' });
                return;
            }

            const parsed = typeof endDate === 'string' ? Number(endDate) : endDate;
            if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
                res.status(400).json({ error: 'Invalid endDate; expected integer timestamp (ms)' });
                return;
            }

            party = await this.partyService.startParty(partyId, parsed); // service will convert to BigInt
            res.status(200).json(party);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export default new PartyController();