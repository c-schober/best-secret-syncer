import { SAP_APPLY_BASE_URL, SAP_COMPANY_ID, LOCALES } from './const'
import { nonNullable } from './guards'
import { cleanupHtmlJson } from './helpers'
import type {
  LocaleData,
  NormalizedSapJob,
  RawSapFilterData,
  RawSapJob,
  RawSapLocalizedTextData,
  RawSapLocationData,
  SapTextElement,
  SapTextType,
  WebflowLocale,
} from './types'

export const getModifiedDateTime = (sapDateString: string) => {
  const match = sapDateString.match(/\/Date\((\d+)([+-]\d{4})?\)\//)
  const defaultDate = '1970-01-01T00:00:00.000Z'

  if (!match) {
    return defaultDate
  }

  const timestamp = parseInt(match[1], 10)

  if (isNaN(timestamp)) {
    return defaultDate
  }

  return new Date(timestamp).toISOString()
}

export const getSapText = (
  jobReqLocaleData: RawSapLocalizedTextData[],
  type: SapTextType
): SapTextElement | null => {
  const validTypes: SapTextType[] = [
    'externalJobDescription',
    'extJobDescHeader',
    'extJobDescFooter',
    'externalTitle',
  ]

  if (!validTypes.includes(type)) {
    console.log(`Unsupported text type: ${type}`)

    return null
  }

  let firstFoundText: string | null = null

  const locales = jobReqLocaleData.reduce<{
    default: string
    locales: LocaleData
  } | null>((acc, localeObj) => {
    const localeCode = localeObj.locale.substring(0, 2) as WebflowLocale
    const text = cleanupHtmlJson(localeObj[type])
    const isAllowedLocale = LOCALES.allowed.includes(localeObj.locale)

    if (text && !firstFoundText) {
      firstFoundText = text
    }

    if (!text) {
      return acc
    }

    if (acc === null) {
      acc = {
        default: '',
        locales: {
          de: '',
          en: '',
        },
      }
    }

    if (isAllowedLocale) {
      acc.locales[localeCode] = text
    }

    if (localeObj.locale === LOCALES.default || acc.default === '') {
      acc.default = text
    }

    return acc
  }, null)

  if (locales === null || locales.default === '') {
    return null
  }

  for (const locale of Object.keys(locales.locales) as Array<
    keyof LocaleData
  >) {
    if (locales.locales[locale] === '') {
      locales.locales[locale] = locales.default
    }
  }

  return locales
}

export const getSapLocations = (
  sapLocations: RawSapLocationData[],
  updated: string
) => {
  const translationsIdentifier = 'value_'

  const normalizedLocations = sapLocations.map(({ value: { results } }) => {
    const { nameTranslationNav: translations } = results[0]
    const sapid = translations.foObjectID

    const locales = Object.entries(translations)
      .filter(([key]) => key.startsWith(translationsIdentifier))
      .reduce<LocaleData>(
        (acc, [key, value]) => {
          const localeCode = key.slice(6)

          if (value && LOCALES.allowed.includes(localeCode)) {
            acc[localeCode.slice(0, 2) as WebflowLocale] = value
          }

          return acc
        },
        {
          de: translations.value_de || translations.value_defaultValue || '',
          en: translations.value_en || translations.value_defaultValue || '',
        }
      )

    const defaultText =
      translations.value_defaultValue ||
      translations[
        `${translationsIdentifier}${LOCALES.default.substring(3)}`
      ] ||
      Object.values(locales)[0] ||
      null

    if (!sapid || !defaultText) {
      return null
    }

    return {
      sapid,
      updated,
      default: defaultText,
      locales: {
        de: locales.de || defaultText,
        en: locales.en || defaultText,
      } as LocaleData,
    }
  })

  return normalizedLocations.filter(nonNullable)
}

export const getFilterLabels = (
  sapFilter: RawSapFilterData[],
  updated: string
) => {
  const normalizedFilter = sapFilter.map((filterOption) => {
    const options = filterOption.picklistLabels.results
    const sapid = options[0].optionId

    const locales = options
      .filter(({ locale }) => LOCALES.allowed.includes(locale))
      .reduce((acc, { locale, label }) => {
        const localeCode = locale.substring(0, 2) as WebflowLocale

        acc[localeCode] = label

        return acc
      }, {} as LocaleData)

    const defaultText =
      options.find((option) => option.locale === LOCALES.default)?.label ||
      Object.values(locales)[0] ||
      null

    if (!sapid || !defaultText) {
      return null
    }

    return {
      sapid,
      updated,
      default: defaultText,
      locales: { de: locales.de || defaultText, en: locales.en || defaultText },
    }
  })

  return normalizedFilter.filter(nonNullable)
}

export const getApplyUrl = (jobId: string) => {
  const baseUrl = `${SAP_APPLY_BASE_URL}/career?&company=${SAP_COMPANY_ID}&career_ns=job_application&career_job_req_id=${jobId}&jobPipeline=Direct`
  return {
    default: baseUrl,
    locales: { de: baseUrl + '&lang=de_DE', en: baseUrl + '&lang=en_US' },
  }
}

export const normalizeSapData = (
  rawSapJob: RawSapJob
): NormalizedSapJob | null => {
  const defaultName = getSapText(
    rawSapJob.jobRequisition.jobReqLocale.results,
    'externalTitle'
  )?.default
  const locales = getSapText(
    rawSapJob.jobRequisition.jobReqLocale.results,
    'externalTitle'
  )?.locales

  const updated = getModifiedDateTime(
    rawSapJob.jobRequisition.lastModifiedDateTime
  )

  if (!defaultName || !locales) {
    return null
  }

  return {
    sapid: rawSapJob.jobReqId,
    updated,
    status: rawSapJob.postingStatus,
    default: defaultName,
    locales: locales,
    descriptionHeader: getSapText(
      rawSapJob.jobRequisition.jobReqLocale.results,
      'extJobDescHeader'
    ),
    descriptionMain: getSapText(
      rawSapJob.jobRequisition.jobReqLocale.results,
      'externalJobDescription'
    ),
    descriptionFooter: getSapText(
      rawSapJob.jobRequisition.jobReqLocale.results,
      'extJobDescFooter'
    ),
    locations: getSapLocations(
      rawSapJob.jobRequisition.location_objlist.results,
      updated
    ),
    departments: getFilterLabels(
      rawSapJob.jobRequisition.filter1.results,
      updated
    ),
    positiontypes: getFilterLabels(
      rawSapJob.jobRequisition.mfield3.results,
      updated
    ),
    flexibility: getFilterLabels(
      rawSapJob.jobRequisition.mfield4.results,
      updated
    ),

    applyUrl: getApplyUrl(rawSapJob.jobReqId),
  }
}
