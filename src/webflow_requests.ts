import axios from "axios"
import { webflowHeaders } from "./const"
import type { CreateError, WebflowItemFieldData } from "./types"
import type { Site } from "webflow-api/api"

export const webflowCreateRequest = async (
  fieldData: WebflowItemFieldData,
  webflowCollectionId: string,
  localeIds: string[]
) => {
  try {
    const response = await axios.post(
      `https://api.webflow.com/v2/collections/${webflowCollectionId}/items/bulk`,
      {
        cmsLocaleIds: localeIds,
        draft: true,
        fieldData,
      },
      webflowHeaders
    )

    return response
  } catch (error) {
    console.error(
      `Error in webflowCreateRequest with fieldData:${fieldData.name}`,
      (error as CreateError).response.data.details
    )

    return null
  }
}

export const webflowUpdateRequest = async (
  localeId: string,
  webflowCollectionId: string,
  itemId: string,
  data: {
    isArchived?: boolean
    fieldData?: Omit<WebflowItemFieldData, 'sapid'>
  }
) => {
  try {
    const response = await axios.patch(
      `https://api.webflow.com/v2/collections/${webflowCollectionId}/items/${itemId}`,
      {
        cmsLocaleId: localeId,
        ...data,
      },
      webflowHeaders
    )

    return response
  } catch (error) {
    console.error(`Error in webflowUpdateRequest for item ${itemId}:`, error)

    return null
  }
}

export const webflowPublishRequest = async (site: Site) => {
  try {
    const response = await axios.post(
      `https://api.webflow.com/v2/sites/${site.id}/publish`,
      { publishToWebflowSubdomain: true, customDomains: site.customDomains },
      webflowHeaders
    )

    return response?.data
  } catch (error) {
    console.error(`Cannot publish Site}`, error)

    return null
  }
}
