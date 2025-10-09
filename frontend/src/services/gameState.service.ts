type GameState = 'completed' | 'failed' | 'unvisited' | 'in_progress';

interface GameStates {
  [key: string]: GameState;
}

const STORAGE_KEY = 'gamesState';

class GameStateServiceClass {
  private listeners: Array<(states: GameStates) => void> = [];

  getStates(): GameStates {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  }

  setState(gameId: string, state: GameState): void {
    const states = this.getStates();
    states[gameId] = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    this.notifyListeners(states);
  }

  subscribe(listener: (states: GameStates) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(states: GameStates): void {
    this.listeners.forEach(listener => listener(states));
  }
}

export const GameStateService = new GameStateServiceClass();
export type { GameState, GameStates };
export default GameStateService;