/**
 * Block schemas — Payload field definitions for each component in the block palette.
 *
 * To add a new component as a block:
 *   1. Create `<Name>.block.ts` here exporting a `Block` config.
 *   2. Add it to the array exported below.
 *   3. Register the React component in `./Blocks.tsx` if needed.
 */
import { HeroPageBlock } from './HeroPage.block'
import { IntroBlock } from './Intro.block'
import { CtaBlockBlock } from './CtaBlock.block'
import { ChapterBlock } from './Chapter.block'
import { EditorialHeroBlock } from './EditorialHero.block'
import { HomeMarqueeBlock } from './HomeMarquee.block'
import { HomeIntroBlock } from './HomeIntro.block'
import { PullQuoteBlock } from './PullQuoteBlock.block'
import { AtmosphereMosaicBlock } from './AtmosphereMosaicBlock.block'
import { FaqEditorialBlock } from './FaqEditorialBlock.block'
import { CtaBandBlock } from './CtaBandBlock.block'

/** Page-layout blocks — used by the Pages collection's `layout` field. */
export const ALL_BLOCKS = [
  // Generic blocks (existing)
  HeroPageBlock,
  IntroBlock,
  CtaBlockBlock,
  ChapterBlock,
  // Home-page editorial blocks
  EditorialHeroBlock,
  HomeMarqueeBlock,
  HomeIntroBlock,
  PullQuoteBlock,
  AtmosphereMosaicBlock,
  FaqEditorialBlock,
  CtaBandBlock,
]
