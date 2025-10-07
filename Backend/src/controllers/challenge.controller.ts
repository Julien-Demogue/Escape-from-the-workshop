import { Request, Response } from 'express';
import { ChallengeService } from '~/services/challenge.service';

export class ChallengeController {
    private challengeService: ChallengeService;

    constructor() {
        this.challengeService = new ChallengeService();
    }

    async getById(req: Request, res: Response): Promise<void> {
        try {
            const challengeId = parseInt(req.params.challengeId, 10);

            if (isNaN(challengeId)) {
                res.status(400).json({ error: 'Invalid challenge id' });
                return;
            }

            const challenge = await this.challengeService.getById(challengeId);
            if (!challenge) {
                res.status(404).json({ error: 'Challenge not found' });
                return;
            }

            res.status(200).json(challenge);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getChallengeInfo(req: Request, res: Response): Promise<void> {
        try {
            const challengeId = parseInt(req.params.challengeId, 10);

            if (isNaN(challengeId)) {
                res.status(400).json({ error: 'Invalid challenge id' });
                return;
            }

            const challenge = await this.challengeService.getById(challengeId);
            if (!challenge) {
                res.status(404).json({ error: 'Challenge not found' });
                return;
            }

            const infos = await this.challengeService.getChallengeInfo(challengeId);
            res.status(200).json(infos);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getAllChallenges(req: Request, res: Response): Promise<void> {
        try {
            const challenges = await this.challengeService.getAllChallenges();
            res.status(200).json(challenges);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

export default new ChallengeController();