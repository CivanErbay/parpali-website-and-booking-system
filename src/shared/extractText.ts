import type { ReactNode } from 'react';

export const extractText = (node: ReactNode | unknown): string => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (typeof node === 'object' && 'props' in (node as object)) {
    const children = (node as { props?: { children?: ReactNode } }).props?.children;
    return extractText(children);
  }
  return '';
};

export const parseJson = <T>(node: ReactNode | unknown, fallback: T): T => {
  const text = extractText(node).trim();
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
};
