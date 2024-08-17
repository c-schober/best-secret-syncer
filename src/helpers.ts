import { ALLOWED_HTML_TAGS } from "./const"
import type { Site } from "webflow-api/api"
import type { LocalesMap, WebflowLocale } from "./types"

const sanitizeHtml = require('sanitize-html')

export const wait = (delay: number) =>
  new Promise((resolve) => setTimeout(resolve, delay))

export const cleanupHtmlJson = (dirtyHtml?: string | null) => {
  if (!dirtyHtml) {
    return null
  }

  const clean = sanitizeHtml(dirtyHtml, {
    allowedTags: ALLOWED_HTML_TAGS,
    allowedSchemes: ['data'],
  })

  const noEmptyTags = clean.replace(/<(\w+)\s*[^>]*>\s*<\/\1>/g, '')

  return noEmptyTags
}

export const getSiteLocalesMap = (site: Site): LocalesMap | null => {
  const allowedTags = ['en', 'de']

  if (
    !site?.locales?.primary?.tag ||
    !allowedTags.includes(site?.locales?.primary?.tag)
  ) {
    return null
  }

  const primarySiteLocale = {
    [site.locales.primary.tag as WebflowLocale]:
      site.locales.primary.cmsLocaleId,
  }
  const secondarySiteLocales = site.locales?.secondary?.reduce(
    (acc, { tag, cmsLocaleId }) => {
      if (!tag || !cmsLocaleId || !allowedTags.includes(tag)) {
        return acc
      }

      acc[tag as WebflowLocale] = cmsLocaleId

      return acc
    },
    {} as LocalesMap
  )

  if (!secondarySiteLocales?.de) {
    return null
  }

  return { ...primarySiteLocale, ...secondarySiteLocales }
}
