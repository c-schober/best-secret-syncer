import { LOCALES } from './const'
import type {
  NormalizedSapJob,
  SapFilterItem,
  WebflowResponseItem,
} from './types'

export const nonNullable = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined
}

export const isNotEmptyArray = <T>(
  list: T[] | Readonly<T[]> | null | undefined
): list is T[] => {
  return Boolean(list && list.length > 0)
}

export const isNotDefaultLocale = <T>(locale: T): locale is T => {
  return LOCALES.default.slice(0, 2) !== locale
}

export const isItemValid = (item: WebflowResponseItem) => {
  return Boolean(item.fieldData?.sapid)
}

export const needsUpdating = (
  sapItem: NormalizedSapJob | SapFilterItem,
  webflowItems: WebflowResponseItem[]
) => {
  const sapUpdated = sapItem.updated
  const relatedWebflowItem = webflowItems.find(
    (wf) => wf.fieldData.sapid === sapItem.sapid
  )

  const webflowUpdated = relatedWebflowItem?.fieldData.date

  return sapUpdated !== webflowUpdated
}
