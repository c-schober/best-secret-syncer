import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions'

import { webflow } from '../webflow-sdk'
import axios from 'axios'
import {
  SAP_API_PASSWORD,
  SAP_API_URL,
  SAP_API_USERNAME,
  WEBFLOW_SITE_ID,
  TRIGGER_SYNC_TOKEN,
} from '../const'
import { getSiteLocalesMap } from '../helpers'
import { normalizeSapData } from '../normalizing_sap'
import { nonNullable } from '../guards'
import { handleWebflowSync } from '../webflow_syncer'
import { checkIsSyncBlockedByDesigner } from '../webflow_helpers'
import { webflowPublishRequest } from '../webflow_requests'

import type { RawSapJob } from '../types'

const wf_sap_syncer = async (
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> => {
  const requestToken = request.params.token
  if (requestToken !== TRIGGER_SYNC_TOKEN)
    return {
      status: 403,
      body: JSON.stringify({
        message: 'No valid token provided',
      }),
    }
  try {
    const sapResponse = await axios.get(SAP_API_URL, {
      auth: {
        username: SAP_API_USERNAME,
        password: SAP_API_PASSWORD,
      },
    })

    const sapData = sapResponse?.data?.d?.results as RawSapJob[]

    if (!sapData) {
      return {
        status: 500,
        body: JSON.stringify({
          message: 'Failed to retrieve SAP source data',
        }),
      }
    }

    const normalizedSapData = sapData.map(normalizeSapData).filter(nonNullable)

    const site = await webflow.sites.get(WEBFLOW_SITE_ID)

    const webflowLocalesMap = await getSiteLocalesMap(site)

    if (!webflowLocalesMap) {
      return {
        status: 500,
        body: JSON.stringify({
          message: 'Webflow is missing Locale Settings or cannot retrieve them',
        }),
      }
    }

    const allWebflowCollectionsReponse = await webflow.collections.list(
      WEBFLOW_SITE_ID
    )
    const allCollections = allWebflowCollectionsReponse?.collections
    if (!allCollections) {
      return {
        status: 500,
        body: JSON.stringify({
          message: 'Failed to retrieve Webflow Collection List',
        }),
      }
    }

    const syncIsBlocked = await checkIsSyncBlockedByDesigner(allCollections)
    if (syncIsBlocked) {
      return {
        status: 200,
        body: JSON.stringify({
          message: 'Sync is currently deactivated by designer',
        }),
      }
    }

    const {
      newCurrentItems: newDepartments,
      needsPublishing: needsDepartmentPublish,
    } = await handleWebflowSync({
      collectionType: 'departments',
      normalizedSapData,
      allCollections,
      webflowLocalesMap,
    })
    const {
      newCurrentItems: newLocations,
      needsPublishing: needsLocationPublish,
    } = await handleWebflowSync({
      collectionType: 'locations',
      normalizedSapData,
      allCollections,
      webflowLocalesMap,
    })
    const {
      newCurrentItems: newPositionTypes,
      needsPublishing: needsPositionPublish,
    } = await handleWebflowSync({
      collectionType: 'positiontypes',
      normalizedSapData,
      allCollections,
      webflowLocalesMap,
    })
    const {
      newCurrentItems: newFlexibilities,
      needsPublishing: needsFlexibilityPublish,
    } = await handleWebflowSync({
      collectionType: 'flexibility',
      normalizedSapData,
      allCollections,
      webflowLocalesMap,
    })

    if (
      !newDepartments ||
      !newLocations ||
      !newPositionTypes ||
      !newFlexibilities
    ) {
      return {
        status: 500,
        body: JSON.stringify({
          message: 'Failed to get updated Webflow Filter Collection',
        }),
      }
    }

    const { newCurrentItems: newJobs, needsPublishing: needsJobPublish } =
      await handleWebflowSync({
        collectionType: 'jobs',
        normalizedSapData,
        allCollections,
        webflowLocalesMap,
        newDepartments,
        newLocations,
        newPositionTypes,
        newFlexibilities,
      })

    context.log({
      needsJobPublish,
      needsLocationPublish,
      needsPositionPublish,
      needsDepartmentPublish,
      needsFlexibilityPublish,
    })

    if (
      needsJobPublish ||
      needsDepartmentPublish ||
      needsLocationPublish ||
      needsPositionPublish ||
      needsFlexibilityPublish
    ) {
      const status = await webflowPublishRequest(site)

      if (!status) {
        return {
          status: 500,
          body: JSON.stringify({
            message: 'Failed to publish Webflow Site',
          }),
        }
      }
    }
    return {
      status: 200,
      body: JSON.stringify({
        message: 'Success',
        newJobs,
      }),
    }
  } catch (error) {
    return {
      status: 500,
      body: JSON.stringify({
        message: 'Sync Failed for unknown reason',
      }),
    }
  }
}

app.http('wfsapsyncer', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: wf_sap_syncer,
})

export default wf_sap_syncer
