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
            let endTime = Number(req.body.endTime); // expected as timestamp (ms) or (s) number or numeric string

            if (isNaN(endTime)) {
                res.status(400).json({ error: 'endTime is required and must be a number' });
                return;
            }

            // If client sent seconds (e.g. 1759998850), convert to milliseconds
            // heuristique : timestamps in seconds are ~1e9..1e10, ms are ~1e12..
            if (endTime < 1e12) {
                endTime = endTime * 1000;
            }

            if (isNaN(partyId)) {
                res.status(400).json({ error: 'Invalid party id' });
                return;
            }

            let party = await this.partyService.getById(partyId);
            if (!party) {
                res.status(404).json({ error: 'Party not found' });
                return;
            }

            // now endTime is milliseconds number; service will convert to Date
            party = await this.partyService.startParty(partyId, endTime);
            res.status(200).json(party);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export default new PartyController();