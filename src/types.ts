export type SapFilterItem = {
  sapid: string
  default: string
  updated: string
  locales: LocaleData
}
export type SapTextElement = {
  default: string
  locales: LocaleData
}
export type RawSapJob = {
  jobReqId: string
  postingStatus: string
  jobRequisition: {
    lastModifiedDateTime: string
    jobReqLocale: {
      results: RawSapLocalizedTextData[]
    }
    location_objlist: {
      results: RawSapLocationData[]
    }
    filter1: {
      results: RawSapFilterData[]
    }
    filter3: {
      results: RawSapFilterData[]
    }
  }
}
export type NormalizedSapJob = {
  sapid: string
  updated: string
  status: string
  default: string
  locales: LocaleData
  descriptionHeader: SapTextElement | null
  descriptionMain: SapTextElement | null
  descriptionFooter: SapTextElement | null
  locations: SapFilterItem[]
  positiontypes: SapFilterItem[]
  departments: SapFilterItem[]
  applyUrl: string
}
export type WebflowItemFieldData = {
  name: string
  sapid: string
  date: string
  'departments-reference'?: string[]
  'locations-reference'?: string[]
  'positiontypes-reference'?: string[]
  'description-header'?: string
  'description-main'?: string
  'description-footer'?: string
  'apply-url'?: string
  'block-auto-publishing'?: boolean
}
export type WebflowResponseItem = {
  isArchived: boolean
  cmsLocaleId: string
  id: string
  fieldData: WebflowItemFieldData
}
export type FilterType = 'departments' | 'locations' | 'positiontypes'
export type CollectionType = FilterType | 'jobs'
export type SapTextType =
  | 'externalJobDescription'
  | 'extJobDescHeader'
  | 'extJobDescFooter'
  | 'externalTitle'

export type WebflowUpdateData = {
  en: { fieldData?: WebflowItemFieldData }
  de: { fieldData?: WebflowItemFieldData }
}
export type RawSapLocale = 'en_US' | 'de_DE'
export type WebflowLocale = 'en' | 'de'
export type LocaleData = { de: string; en: string }
export type LocalesMap = LocaleData

export type CreateError = {
  response: { data: { details: string } }
}
export type RawSapLocalizedTextData = {
  externalJobDescription: string | null
  extJobDescHeader: string | null
  extJobDescFooter: string | null
  locale: RawSapLocale
  externalTitle: string | null
}

export type RawSapLocationData = {
  value: {
    results: Array<{
      nameTranslationNav: {
        foObjectID: string
        value_defaultValue: string | null
        [key: `value_${string}`]: string | null
      }
    }>
  }
}
export type RawSapFilterData = {
  picklistLabels: {
    results: Array<{
      optionId: string
      locale: string
      label: string
    }>
  }
}
