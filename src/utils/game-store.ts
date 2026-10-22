export const GAME_IDS = ["mlbb", "ff"] as const;

export type GameId = (typeof GAME_IDS)[number];

export const GAME_NAMES: Record<GameId, string> = {
    mlbb: "Mobile Legends",
    ff: "Free Fire",
};

type Listener = (game: GameId) => void;

const listeners = new Set<Listener>();
const catalogListeners = new Set<Listener>();

let currentGame: GameId = "mlbb";
let currentCatalogGame: GameId = "mlbb";

/** Juego del checkout (recarga). */
export function getGame(): GameId {
    return currentGame;
}

/** Juego del filtro del catálogo ("Todos los paquetes"). */
export function getCatalogGame(): GameId {
    return currentCatalogGame;
}

export function setGame(game: GameId): void {
    if (currentGame === game) return;
    currentGame = game;
    listeners.forEach((listener) => listener(game));
}

export function setCatalogGame(game: GameId): void {
    if (currentCatalogGame === game) return;
    currentCatalogGame = game;
    catalogListeners.forEach((listener) => listener(game));
}

export function onGameChange(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function onCatalogGameChange(listener: Listener): () => void {
    catalogListeners.add(listener);
    return () => {
        catalogListeners.delete(listener);
    };
}
