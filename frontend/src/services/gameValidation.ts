import { api } from '../config/axios.config';

export type GameStatus = 'unvisited' | 'completed' | 'failed';

export interface GameValidation {
  gameId: string;
  status: GameStatus;
  timestamp: number;
}

export const validateGame = async (gameId: string, score: number): Promise<GameStatus> => {
  try {
    const response = await api.post('/challenges/validate', {
      gameId,
      score
    });
    
    return response.data.status;
  } catch (error) {
    console.error('Error validating game:', error);
    return 'failed';
  }
};

export const syncGameProgress = async (): Promise<Record<string, GameStatus>> => {
  try {
    const response = await api.get('/challenges/progress');
    return response.data.progress;
  } catch (error) {
    console.error('Error syncing game progress:', error);
    // En cas d'erreur, on retourne les données du localStorage
    const localProgress = localStorage.getItem('gamesState');
    return localProgress ? JSON.parse(localProgress) : {};
  }
};