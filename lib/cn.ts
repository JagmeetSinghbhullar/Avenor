import { twMerge } from "tailwind-merge";

type ClassValue = string | number | boolean | null | undefined;

/**
 * Joins conditional class names and resolves conflicting Tailwind
 * utilities (e.g. a consumer-supplied `className="w-32"` correctly
 * overriding a component's default `w-full`) so the last one wins instead
 * of both landing in the generated stylesheet.
 */
export function cn(...classes: ClassValue[]): string {
  return twMerge(classes.filter(Boolean).join(" "));
}
