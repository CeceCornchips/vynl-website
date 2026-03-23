import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ColorScheme } from "@/types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function schemeClasses(scheme: ColorScheme): string {
  const map: Record<ColorScheme, string> = {
    light: "bg-vynl-white text-vynl-black",
    dark: "bg-vynl-black text-vynl-white",
    smoke: "bg-vynl-smoke text-vynl-black",
    champagne: "bg-vynl-champagne-light text-vynl-black",
  };
  return map[scheme] ?? map.light;
}
