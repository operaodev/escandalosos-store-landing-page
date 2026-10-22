const API_BASE = "https://api.isan.eu.org/nickname";
const STORAGE_KEY = "validatorid:player";

export type ValidatorGame = "ml" | "ff";

export interface Player {
    success: boolean;
    game: string;
    id: number;
    name: string;
    server?: number;
    country?: string;
}

/** Motivo por el que falló la validación. */
export type ValidatorErrorCode =
    | "not_found"
    | "invalid_input"
    | "network"
    | "service";

export class ValidatorError extends Error {
    readonly code: ValidatorErrorCode;

    constructor(code: ValidatorErrorCode, message: string) {
        super(message);
        this.name = "ValidatorError";
        this.code = code;
    }
}

/** Con decode=false el nombre puede venir codificado en la URL. */
function decodeName(name: string): string {
    try {
        return decodeURIComponent(name);
    } catch {
        return name;
    }
}

function storageKey(game: ValidatorGame): string {
    return `${STORAGE_KEY}:${game}`;
}

/**
 * Comprueba si el servidor llegó a responder, sin importar el código HTTP.
 * En modo no-cors una respuesta 500 llega como "opaque" (no se puede leer
 * el cuerpo, pero sabemos que hubo respuesta); un fallo real de red lanza.
 */
async function probeServer(url: string): Promise<boolean> {
    try {
        await fetch(url, { mode: "no-cors", cache: "no-store" });
        return true;
    } catch {
        return false;
    }
}

export function getPlayer(
    game: "ml",
    id: number | string,
    server: number | string,
): Promise<Player>;
export function getPlayer(game: "ff", id: number | string): Promise<Player>;
export async function getPlayer(
    game: ValidatorGame,
    id: number | string,
    server?: number | string,
): Promise<Player> {
    const cleanId = String(id).trim();
    const cleanServer = String(server ?? "").trim();

    if (!cleanId) {
        throw new ValidatorError(
            "invalid_input",
            "Ingresa tu ID de jugador para continuar.",
        );
    }

    if (game === "ml" && !cleanServer) {
        throw new ValidatorError(
            "invalid_input",
            "Mobile Legends necesita el servidor de tu cuenta.",
        );
    }

    const params = new URLSearchParams({ id: cleanId, decode: "false" });
    if (game === "ml") {
        params.set("server", cleanServer);
    }

    const url = `${API_BASE}/${game}?${params.toString()}`;

    let response: Response;

    try {
        response = await fetch(url);
    } catch {
        // La API responde 500 SIN cabeceras CORS cuando la cuenta no existe:
        // el navegador bloquea esa respuesta y fetch falla igual que si no
        // hubiera red. Se sondea en modo no-cors para distinguir ambos casos:
        // si el servidor responde (opaque) es que la cuenta no existe.
        const reached = await probeServer(url);

        if (reached) {
            throw new ValidatorError(
                "not_found",
                "No encontramos ninguna cuenta con ese ID y servidor. Revisa que los hayas escrito correctamente.",
            );
        }

        throw new ValidatorError(
            "network",
            "No pudimos conectar con el servidor de validación. Revisa tu conexión e inténtalo de nuevo.",
        );
    }

    if (!response.ok) {
        throw new ValidatorError(
            "not_found",
            "No encontramos ninguna cuenta con ese ID y servidor. Revisa que los hayas escrito correctamente.",
        );
    }

    const data = await response.json();

    // Free Fire responde 200 aunque el ID no exista: llega sin nombre.
    if (!data?.success || !data?.name) {
        throw new ValidatorError(
            "not_found",
            "Ese ID de jugador no existe en el juego. Revisa los dígitos e inténtalo otra vez.",
        );
    }

    const player: Player = {
        success: data.success,
        game: data.game,
        id: data.id,
        name: decodeName(data.name ?? ""),
        server: data.server,
        country: data.country,
    };

    if (typeof localStorage !== "undefined") {
        localStorage.setItem(storageKey(game), JSON.stringify(player));
    }

    return player;
}

export function getStoredPlayer(game: ValidatorGame): Player | null {
    if (typeof localStorage === "undefined") return null;

    const stored = localStorage.getItem(storageKey(game));
    if (!stored) return null;

    try {
        return JSON.parse(stored) as Player;
    } catch {
        return null;
    }
}

export function clearStoredPlayer(game?: ValidatorGame): void {
    if (typeof localStorage === "undefined") return;

    if (game) {
        localStorage.removeItem(storageKey(game));
        return;
    }

    localStorage.removeItem(storageKey("ml"));
    localStorage.removeItem(storageKey("ff"));
}
