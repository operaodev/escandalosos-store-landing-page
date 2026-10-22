import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";

import ffBackground from "../assets/ff-welcome.webp";
import ffLogo from "../assets/ff-logo.webp";
import mlbbBackground from "../assets/mlbb-welcome.webp";
import mlbbLogo from "../assets/mlbb-logo.webp";

export interface HeroImage {
    /** URL de la variante principal (fallback para navegadores sin srcset). */
    src: string;
    /** Lista de variantes para que el navegador elija segun el viewport. */
    srcset: string;
    sizes: string;
    width: number;
    height: number;
    type: string;
}

/**
 * Los fondos originales son enormes: mlbb-welcome.webp mide 8192x4602 (2 MB)
 * y ff-welcome.webp 3840x2160 (464 KB). Decodificados ocupan 150 MB y 33 MB
 * de RAM, muy por encima de la cache de imagenes de Chrome: al hacer scroll
 * el navegador los descarta y hay que volver a decodificarlos, por eso el
 * fondo aparece negro y "se regenera" al volver al hero.
 *
 * Astro genera las variantes con sharp durante el build y el navegador
 * descarga solo la que corresponde al viewport, dejando el bitmap decodificado
 * dentro de la cache.
 */
const BACKGROUND_WIDTHS = [640, 1280, 1920, 2560];
const LOGO_WIDTHS = [200, 400, 800];

const BACKGROUND_SIZES = "100vw";
const LOGO_SIZES = "(min-width: 768px) 384px, 200px";

/**
 * El ancho mayor de `widths` fija el `src` de reserva: si no, Astro emitiria
 * ademas la imagen original (2 MB) y algunos navegadores la descargarian.
 */
function maxWidth(widths: number[], source: ImageMetadata): number {
    return Math.min(Math.max(...widths), source.width);
}

async function toHeroImage(
    source: ImageMetadata,
    widths: number[],
    sizes: string,
    quality: number,
): Promise<HeroImage> {
    const width = maxWidth(widths, source);
    const height = Math.round((width * source.height) / source.width);

    const image = await getImage({
        src: source,
        widths,
        sizes,
        width,
        height,
        quality,
        format: "webp",
    });

    return {
        src: image.src,
        srcset: image.srcSet.attribute,
        sizes,
        width,
        height,
        type: "image/webp",
    };
}

export interface HeroGameAssets {
    id: "mlbb" | "ff";
    background: HeroImage;
    logo: HeroImage;
}

export async function getHeroAssets(): Promise<HeroGameAssets[]> {
    const [mlbbBg, ffBg, mlbbLg, ffLg] = await Promise.all([
        toHeroImage(mlbbBackground, BACKGROUND_WIDTHS, BACKGROUND_SIZES, 68),
        toHeroImage(ffBackground, BACKGROUND_WIDTHS, BACKGROUND_SIZES, 68),
        toHeroImage(mlbbLogo, LOGO_WIDTHS, LOGO_SIZES, 82),
        toHeroImage(ffLogo, LOGO_WIDTHS, LOGO_SIZES, 82),
    ]);

    return [
        { id: "mlbb", background: mlbbBg, logo: mlbbLg },
        { id: "ff", background: ffBg, logo: ffLg },
    ];
}
