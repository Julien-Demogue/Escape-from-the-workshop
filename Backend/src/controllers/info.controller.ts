import { Request, Response } from 'express';
import { InfoService } from '../services/info.service';

export class InfoController {
    private infoService: InfoService;

    constructor() {
        this.infoService = new InfoService();
    }

    async getInfoIllustrations(req: Request, res: Response): Promise<void> {
        try {
            const infoId = parseInt(req.params.infoId, 10);

            if (isNaN(infoId)) {
                res.status(400).json({ error: 'Invalid info id' });
                return;
            }

            const info = await this.infoService.getById(infoId);
            if (!info) {
                res.status(404).json({ error: 'Info not found' });
                return;
            }

            const illustrations = await this.infoService.getInfoIllustrations(infoId);
            res.status(200).json(illustrations);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default new InfoController();