'use client'

import React from 'react'

import { HeroPage } from '../components/HeroPage/HeroPage'
import { Intro } from '../components/Intro/Intro'
import { CtaBlock } from '../components/CtaBlock/CtaBlock'
import { Chapter } from '../components/Chapter/Chapter'

/**
 * Block-renderer dispatcher. Receives a `layout` array from a Pages document
 * (Payload's `blocks` field shape: `{ id, blockType, ...fields }[]`) and
 * renders each instance via the registered component.
 */
type BlockInstance = { id?: string; blockType: string; [key: string]: unknown }

export function Blocks({ layout }: { layout: BlockInstance[] | null | undefined }) {
  if (!layout?.length) return null
  return (
    <>
      {layout.map((block, i) => (
        <BlockRenderer key={block.id ?? `${block.blockType}-${i}`} block={block} />
      ))}
    </>
  )
}

function BlockRenderer({ block }: { block: BlockInstance }) {
  switch (block.blockType) {
    case 'hero-page': {
      const b = block as BlockInstance & {
        eyebrow: string
        heading: string
        sub: string
        ctaText?: string
        ctaHref?: string
      }
      return (
        <HeroPage
          eyebrow={b.eyebrow}
          heading={b.heading}
          sub={<p>{b.sub}</p>}
          ctaText={b.ctaText}
          ctaHref={b.ctaHref}
        />
      )
    }
    case 'intro': {
      const b = block as BlockInstance & {
        surface?: 'tight' | 'elev'
        eyebrowNum: string
        eyebrowLabel: string
        heading: string
        body: string
      }
      return (
        <Intro
          surface={b.surface}
          eyebrowNum={b.eyebrowNum}
          eyebrowLabel={b.eyebrowLabel}
          heading={b.heading}
          body={<p>{b.body}</p>}
        />
      )
    }
    case 'cta-block': {
      const b = block as BlockInstance & {
        meta: string
        heading: string
        body: string
        ctaText: string
        ctaHref: string
      }
      return (
        <CtaBlock
          meta={b.meta}
          heading={b.heading}
          body={<p>{b.body}</p>}
          ctaText={b.ctaText}
          ctaHref={b.ctaHref}
        />
      )
    }
    case 'chapter': {
      const b = block as BlockInstance & {
        num: string
        label: string
        counter?: string
        pin?: boolean
        anchor?: string
        content: BlockInstance[]
      }
      return (
        <Chapter num={b.num} label={b.label} counter={b.counter} pin={b.pin} id={b.anchor}>
          <Blocks layout={b.content} />
        </Chapter>
      )
    }
    default:
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[Blocks] Unknown blockType: "${block.blockType}". Add a renderer.`)
      }
      return null
  }
}
