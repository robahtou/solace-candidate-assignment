// Minimal `cn` utility compatible with shadcn imports.
// We avoid external deps (clsx/tailwind-merge) and keep a simple joiner.
export function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(' ');
}
