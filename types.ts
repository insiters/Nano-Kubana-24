
export type AspectRatio = "1:1" | "16:9" | "9:16" | "3:4" | "4:3";

export interface HistoryState {
  image: string;
}

export interface AIResponse {
  imageUrl: string;
  text?: string;
  error?: string;
}
