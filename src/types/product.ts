export type ProductType =
  | "diamantes"
  | "pase"
  | "paquete"
  | "dobles";

export type Game = "Mobile Legends" | "Free Fire";

export const ML = "Mobile Legends"
export const FF = "Free Fire"

export interface Product {
    name: string;
    price: number;
    bonoxsPrice?: number;
    officialPrice?: number;
    description: string;
    type: ProductType;
    game: Game;
    isPopular?: boolean
}
