import { PrismaClient, Challenge, Info, ChallengeProgress } from "../generated/prisma";

export class ChallengeService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getById(id: number): Promise<Challenge | null> {
        return this.prisma.challenge.findUnique({ 
            where: { id },
            include: {
                Info: {
                    include: {
                        illustrations: true
                    }
                }
            }
        });
    }

    async getChallengeInfo(challengeId: number): Promise<Info | null> {
        return this.prisma.info.findFirst({
            where: { challengeId },
            include: {
                illustrations: true
            }
        });
    }

    async getAllChallenges(): Promise<Challenge[]> {
        return this.prisma.challenge.findMany({
            include: {
                Info: {
                    include: {
                        illustrations: true
                    }
                }
            }
        });
    }

    // Récupérer la progression d'un groupe pour tous les challenges
    async getGroupProgress(groupId: number): Promise<{
        id: number;
        flag: string;
        hint: string;
        points: number;
        status: "unvisited" | "completed" | "failed" | "in_progress";
        info?: Info;
    }[]> {
        const challenges = await this.prisma.challenge.findMany({
            include: {
                progresses: {
                    where: {
                        groupId: groupId
                    }
                },
                Info: {
                    include: {
                        illustrations: true
                    }
                }
            }
        });

        return challenges.map(challenge => ({
            id: challenge.id,
            flag: challenge.flag,
            hint: challenge.hint,
            points: challenge.points,
            info: challenge.Info[0],
            status: this.determineStatus(challenge.progresses[0])
        }));
    }

    // Déterminer le statut d'un challenge
    private determineStatus(progress?: ChallengeProgress): "unvisited" | "completed" | "failed" | "in_progress" {
        if (!progress) return "unvisited";
        if (progress.isCompleted) return "completed";
        return "in_progress";
    }

    // Mettre à jour la progression d'un challenge
    async updateProgress(groupId: number, challengeId: number, isCompleted: boolean): Promise<ChallengeProgress> {
        const existingProgress = await this.prisma.challengeProgress.findFirst({
            where: {
                groupId,
                challengeId
            }
        });

        if (existingProgress) {
            return this.prisma.challengeProgress.update({
                where: { id: existingProgress.id },
                data: { isCompleted }
            });
        }

        return this.prisma.challengeProgress.create({
            data: {
                groupId,
                challengeId,
                isCompleted
            }
        });
    }

    // Mettre à jour le score du groupe
    async updateGroupScore(groupId: number, points: number): Promise<void> {
        await this.prisma.group.update({
            where: { id: groupId },
            data: {
                score: {
                    increment: points
                }
            }
        });
    }

    // Valider la réponse d'un challenge
    async validateChallenge(groupId: number, challengeId: number, submittedFlag: string): Promise<{
        success: boolean;
        message: string;
        points?: number;
    }> {
        const challenge = await this.getById(challengeId);
        if (!challenge) {
            return {
                success: false,
                message: "Challenge non trouvé"
            };
        }

        const isCorrect = challenge.flag.toLowerCase() === submittedFlag.toLowerCase();

        await this.updateProgress(groupId, challengeId, isCorrect);

        if (isCorrect) {
            await this.updateGroupScore(groupId, challenge.points);
            return {
                success: true,
                message: "Bravo ! Challenge réussi",
                points: challenge.points
            };
        }

        return {
            success: false,
            message: "Ce n'est pas la bonne réponse"
        };
    }
}