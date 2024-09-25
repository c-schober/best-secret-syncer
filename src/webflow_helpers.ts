const _ = require('lodash')

import type { CollectionListArrayItem } from 'webflow-api/api'
import type {
  CollectionType,
  FilterType,
  NormalizedSapJob,
  SapFilterItem,
  WebflowItemFieldData,
  WebflowLocale,
  WebflowResponseItem,
} from './types'
import { isItemValid, needsUpdating, nonNullable } from './guards'
import { webflow } from './webflow-sdk'

export const checkIsSyncBlockedByDesigner = async (
  allCollections: CollectionListArrayItem[]
) => {
  const autoPublisherCollection = allCollections.find(
    (col) => col.slug === 'auto-publisher'
  )

  if (!autoPublisherCollection) {
    return true
  }

  const autoPublisherItems = await getAllWebflowItems(autoPublisherCollection)
  const syncIsBlocked = autoPublisherItems.some(
    (item) => item.fieldData['block-auto-publishing']
  )

  return syncIsBlocked
}

export const prepareWebflowJobFieldData = ({
  sapItem,
  newDepartments,
  newLocations,
  newPositionTypes,
  locale,
}: {
  sapItem: NormalizedSapJob | SapFilterItem
  newDepartments?: WebflowResponseItem[]
  newLocations?: WebflowResponseItem[]
  newPositionTypes?: WebflowResponseItem[]
  locale: WebflowLocale
}): WebflowItemFieldData => {
  const findReferences = (
    collectionItems: WebflowResponseItem[],
    collectionType: FilterType
  ) => {
    const referencedItems = collectionItems.filter((item) =>
      (sapItem as NormalizedSapJob)[collectionType].some(
        (ref) => ref.sapid === item?.fieldData?.sapid
      )
    )

    return referencedItems.map((item) => item.id)
  }
  const fieldData = {
    sapid: sapItem.sapid,
    name: sapItem.locales[locale] || sapItem.default,
    date: sapItem.updated,
  } as WebflowItemFieldData

  if (newDepartments) {
    fieldData['departments-reference'] = findReferences(
      newDepartments,
      'departments'
    )
  }

  if (newLocations) {
    fieldData['locations-reference'] = findReferences(newLocations, 'locations')
  }

  if (newPositionTypes) {
    fieldData['positiontypes-reference'] = findReferences(
      newPositionTypes,
      'positiontypes'
    )
  }

  if ('applyUrl' in sapItem && sapItem.applyUrl) {
    fieldData['apply-url'] = sapItem.applyUrl
  }

  if ('descriptionHeader' in sapItem && sapItem.descriptionHeader) {
    fieldData['description-header'] = sapItem.descriptionHeader.locales[locale]
  }

  if ('descriptionMain' in sapItem && sapItem.descriptionMain) {
    fieldData['description-main'] = sapItem.descriptionMain.locales[locale]
  }

  if ('descriptionFooter' in sapItem && sapItem.descriptionFooter) {
    fieldData['description-footer'] = sapItem.descriptionFooter.locales[locale]
  }

  return fieldData
}

export const getUniqueItems = (
  allNormalizedSapJobs: NormalizedSapJob[],
  collectionType: CollectionType
): SapFilterItem[] | NormalizedSapJob[] => {
  if (collectionType === 'jobs') {
    return allNormalizedSapJobs
  }

  const allFilterItems = _.flatMap(
    allNormalizedSapJobs,
    (job) => job[collectionType]
  )

  const uniqueItems = _.chain(allFilterItems)
    .groupBy('sapid')
    .map((items) => _.maxBy(items, 'updated'))
    .value()

  return uniqueItems.filter(nonNullable)
}

export const findWebflowCollection = (
  allWebflowCollections: CollectionListArrayItem[],
  collectionType: CollectionType
) => {
  const collection = allWebflowCollections.find(
    (col) => col.slug === collectionType
  )

  return collection
}

export const getAllWebflowItems = async (
  webflowCollection: CollectionListArrayItem
): Promise<WebflowResponseItem[]> => {
  let offset = 0
  const limit = 100
  let allItems: WebflowResponseItem[] = []

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const itemsResponse = await webflow.collections.items.listItems(
      webflowCollection?.id || '',
      { offset, limit }
    )

    const newItems = (itemsResponse?.items || []) as WebflowResponseItem[]

    allItems = [...allItems, ...newItems]

    if (newItems.length < limit) {
      break
    }

    offset += limit
  }

  return allItems.filter((item) => !item.isArchived)
}

export const getWebflowItemsToArchive = (
  sapItems: SapFilterItem[] | NormalizedSapJob[],
  webflowItems: WebflowResponseItem[]
) => {
  const validWebflowItems = webflowItems.filter(isItemValid)
  const sapIdsInSapItem = sapItems.map((item) => item.sapid)

  const itemsToArchive = validWebflowItems.filter(
    (webflowItem) => !sapIdsInSapItem.includes(webflowItem.fieldData.sapid)
  )

  return itemsToArchive
}

export const getWebflowItemsToUpdate = (
  sapItems: SapFilterItem[] | NormalizedSapJob[],
  webflowItems: WebflowResponseItem[]
) => {
  const validWebflowItems = webflowItems.filter(isItemValid)
  const recentlyUpdatedSapItems = sapItems.filter((sapItem) =>
    needsUpdating(sapItem, webflowItems)
  )

  const sapIdsInSapItem = recentlyUpdatedSapItems.map((item) => item.sapid)

  const itemsToUpdate = validWebflowItems.filter((webflowItem) =>
    sapIdsInSapItem.includes(webflowItem.fieldData.sapid)
  )

  return itemsToUpdate
}

export const getWebflowItemsToCreate = (
  sapItems: SapFilterItem[] | NormalizedSapJob[],
  webflowItems: WebflowResponseItem[]
) => {
  const validWebflowItems = webflowItems.filter(isItemValid)

  const itemsToCreate = sapItems.filter(
    (sapItem) =>
      !validWebflowItems.some(
        (webflowItem) => webflowItem.fieldData.sapid === sapItem.sapid
      )
  )

  return itemsToCreate
}
