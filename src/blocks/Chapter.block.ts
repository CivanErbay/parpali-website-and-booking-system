import type { Block } from 'payload'

import { IntroBlock } from './Intro.block'
import { CtaBlockBlock } from './CtaBlock.block'

/**
 * Chapter is a wrapping block for scroll-storytelling sections.
 * Its `content` field is a nested blocks array so editors can compose
 * sub-blocks (Intro, CtaBlock) inside a single chapter.
 *
 * HeroPage and Chapter itself are intentionally excluded from `content`
 * to prevent nesting madness — Hero goes at page-top, Chapters don't
 * nest in Chapters.
 */
export const ChapterBlock: Block = {
  slug: 'chapter',
  labels: { singular: 'Chapter', plural: 'Chapters' },
  fields: [
    { name: 'num', type: 'text', required: true },
    { name: 'label', type: 'text', required: true },
    { name: 'counter', type: 'text' },
    { name: 'pin', type: 'checkbox', defaultValue: false },
    { name: 'anchor', type: 'text' },
    {
      name: 'content',
      type: 'blocks',
      required: true,
      minRows: 1,
      blocks: [IntroBlock, CtaBlockBlock],
    },
  ],
}
