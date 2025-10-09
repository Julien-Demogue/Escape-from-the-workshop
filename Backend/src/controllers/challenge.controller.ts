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

    // Récupérer la progression d'un groupe
    async getGroupProgress(req: Request, res: Response): Promise<void> {
        try {
            const groupId = parseInt(req.params.groupId, 10);

            if (isNaN(groupId)) {
                res.status(400).json({ error: 'Invalid group id' });
                return;
            }

            const progress = await this.challengeService.getGroupProgress(groupId);
            res.status(200).json(progress);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Valider un challenge
    async validateChallenge(req: Request, res: Response): Promise<void> {
        try {
            const groupId = parseInt(req.params.groupId, 10);
            const challengeId = parseInt(req.params.challengeId, 10);
            const { flag } = req.body;

            if (isNaN(groupId) || isNaN(challengeId)) {
                res.status(400).json({ error: 'Invalid group or challenge id' });
                return;
            }

            if (!flag) {
                res.status(400).json({ error: 'Flag is required' });
                return;
            }

            const result = await this.challengeService.validateChallenge(groupId, challengeId, flag);
            res.status(200).json(result);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default new ChallengeController();