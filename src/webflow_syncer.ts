import { webflow } from './webflow-sdk'
import { REQUEST_DELAY } from './const'
import { isNotDefaultLocale, isNotEmptyArray, nonNullable } from './guards'
import {
  findWebflowCollection,
  getAllWebflowItems,
  getUniqueItems,
  getWebflowItemsToArchive,
  getWebflowItemsToCreate,
  getWebflowItemsToUpdate,
  prepareWebflowJobFieldData,
} from './webflow_helpers'
import { webflowCreateRequest, webflowUpdateRequest } from './webflow_requests'
import { wait } from './helpers'
import type {
  CollectionType,
  LocaleData,
  LocalesMap,
  NormalizedSapJob,
  SapFilterItem,
  WebflowItemFieldData,
  WebflowResponseItem,
  WebflowUpdateData,
} from './types'
import type { CollectionListArrayItem } from 'webflow-api/api'

const handleCreateItem = async ({
  itemToCreate,
  webflowCollectionId,
  localesMap,
  initialFieldData,
  newDepartments,
  newPositionTypes,
  newLocations,
}: {
  itemToCreate: SapFilterItem | NormalizedSapJob
  webflowCollectionId: string
  localesMap: LocalesMap
  initialFieldData: WebflowItemFieldData
  newDepartments: WebflowResponseItem[] | undefined
  newPositionTypes: WebflowResponseItem[] | undefined
  newLocations: WebflowResponseItem[] | undefined
}) => {
  if (!itemToCreate.sapid || !itemToCreate.default || !itemToCreate.locales) {
    return
  }

  const createResponse = await webflowCreateRequest(
    initialFieldData,
    webflowCollectionId,
    Object.values(localesMap)
  )

  const newItems = createResponse?.data?.items as WebflowResponseItem[]

  const updateRequests = (
    Object.keys(itemToCreate.locales) as Array<keyof LocaleData>
  )
    .filter(isNotDefaultLocale)
    .flatMap((locale) => {
      if (!localesMap?.[locale] || !itemToCreate.locales?.[locale]) {
        return []
      }

      const relatedWebflowItem = newItems.find(
        (item) => item.cmsLocaleId === localesMap[locale]
      )

      if (!relatedWebflowItem) {
        return []
      }

      const fieldData = prepareWebflowJobFieldData({
        sapItem: itemToCreate,
        locale,
        newDepartments,
        newPositionTypes,
        newLocations,
      })

      return [
        async () => {
          await wait(REQUEST_DELAY)

          return webflowUpdateRequest(
            localesMap[locale],
            webflowCollectionId,
            relatedWebflowItem.id,
            { fieldData }
          )
        },
      ]
    })

  return Promise.all(
    updateRequests.filter(nonNullable).flatMap((request) => request())
  )
}

const handleUpdateItem = async (
  localeId: string,
  itemToArchive: WebflowResponseItem,
  webflowCollectionId: string,
  updateData: WebflowUpdateData
) => {
  const locales = Object.keys(updateData) as Array<keyof WebflowUpdateData>

  const updateRequests = locales.map(async (locale, index) => {
    await wait(index * REQUEST_DELAY)

    return webflowUpdateRequest(
      localeId,
      webflowCollectionId,
      itemToArchive.id,
      updateData[locale]
    )
  })

  return Promise.all(updateRequests.filter(nonNullable))
}

const handleArchiveItem = async (
  itemToArchive: WebflowResponseItem,
  webflowCollectionId: string,
  localesMap: LocalesMap
) => {
  const locales = Object.keys(localesMap) as Array<keyof LocaleData>

  const updateRequests = locales.map(async (locale, index) => {
    if (!localesMap[locale]) {
      return null
    }

    await wait(index * REQUEST_DELAY)

    return webflowUpdateRequest(
      localesMap[locale],
      webflowCollectionId,
      itemToArchive.id,
      { isArchived: true }
    )
  })

  return Promise.all(updateRequests.filter(nonNullable))
}

export const handleWebflowSync = async ({
  collectionType,
  normalizedSapData,
  allCollections,
  webflowLocalesMap,
  newDepartments,
  newLocations,
  newPositionTypes,
}: {
  collectionType: CollectionType
  normalizedSapData: NormalizedSapJob[]
  allCollections: CollectionListArrayItem[]
  webflowLocalesMap: LocalesMap
  newDepartments?: WebflowResponseItem[]
  newLocations?: WebflowResponseItem[]
  newPositionTypes?: WebflowResponseItem[]
}): Promise<{
  newCurrentItems: WebflowResponseItem[]
  needsPublishing: boolean
}> => {
  const sapItems = getUniqueItems(normalizedSapData, collectionType)
  const webflowCollection = findWebflowCollection(
    allCollections,
    collectionType
  )

  if (!webflowCollection) {
    return { newCurrentItems: [], needsPublishing: false }
  }

  const currentWebflowItems = await getAllWebflowItems(webflowCollection)

  const webflowItemsToArchive = getWebflowItemsToArchive(
    sapItems,
    currentWebflowItems
  )

  for (const webflowItem of webflowItemsToArchive) {
    await handleArchiveItem(
      webflowItem,
      webflowCollection.id,
      webflowLocalesMap
    )
    console.log('archived item', webflowItem)
    await wait(REQUEST_DELAY)
  }

  const webflowItemsToUpdate = getWebflowItemsToUpdate(
    sapItems,
    currentWebflowItems
  )

  console.log({ webflowItemsToUpdate })

  for (const webflowItem of webflowItemsToUpdate) {
    const sapItem = sapItems.find(
      (sapItem) => sapItem.sapid === webflowItem.fieldData.sapid
    ) as SapFilterItem | NormalizedSapJob | undefined

    if (!sapItem) {
      continue
    }

    const locales = Object.keys(sapItem.locales) as Array<keyof LocaleData>

    for (const locale of locales) {
      if (!webflowLocalesMap[locale]) {
        continue
      }

      const localeId = webflowLocalesMap[locale]
      const updateData = {
        [locale]: {
          fieldData: prepareWebflowJobFieldData({
            sapItem,
            locale,
            newDepartments,
            newPositionTypes,
            newLocations,
          }),
        },
      } as WebflowUpdateData

      await handleUpdateItem(
        localeId,
        webflowItem,
        webflowCollection.id,
        updateData
      )
      console.log('updated item', webflowItem, localeId, updateData)
      await wait(REQUEST_DELAY)
    }

    await wait(REQUEST_DELAY)
  }

  const webflowItemsToCreate = getWebflowItemsToCreate(
    sapItems,
    currentWebflowItems
  ) as SapFilterItem[] | NormalizedSapJob[]

  for (const item of webflowItemsToCreate) {
    const fieldData = prepareWebflowJobFieldData({
      sapItem: item,
      locale: 'en',
      newDepartments,
      newPositionTypes,
      newLocations,
    })

    await handleCreateItem({
      itemToCreate: item,
      webflowCollectionId: webflowCollection.id,
      localesMap: webflowLocalesMap,
      initialFieldData: fieldData,
      newDepartments,
      newPositionTypes,
      newLocations,
    })
    console.log('created item', item)
    await wait(REQUEST_DELAY)
  }

  const newCollectionItems = await webflow.collections.items.listItems(
    webflowCollection.id
  )

  const needsPublishing =
    isNotEmptyArray(webflowItemsToArchive) ||
    isNotEmptyArray(webflowItemsToUpdate) ||
    isNotEmptyArray(webflowItemsToCreate)

  return {
    newCurrentItems: (newCollectionItems?.items || []) as WebflowResponseItem[],
    needsPublishing,
  }
}
