// Dev:
// export const COMPANY_ID = 'bestsecretD'
// export const BASE_URL = 'https://api55.sapsf.eu'
// export const WEBFLOW_SITE_ID = '66b0a4858f95088d59c089fc'
// export const WEBFLOW_TOKEN =
//   '3c803255171b4fc930d8436d1c937709b35aa05dbdfb57083651aa554c5a8a4e'
// export const LAST_QUERY_PART =
//   "&$filter=boardId eq '_external'&$format=JSON"

// Test:
export const SAP_COMPANY_ID = process.env["SAP_COMPANY_ID"]
export const SAP_BASE_URL = process.env["SAP_BASE_URL"]
export const SAP_API_USER = process.env['SAP_API_USER']
export const SAP_API_PASSWORD = process.env["SAP_API_PASSWORD"]
export const WEBFLOW_SITE_ID = process.env["WEBFLOW_SITE_ID"]
export const WEBFLOW_API_TOKEN = process.env["WEBFLOW_API_TOKEN"]
export const TRIGGER_SYNC_TOKEN = process.env['TRIGGER_SYNC_TOKEN']
export const SAP_API_USERNAME = `${SAP_API_USER}@${SAP_COMPANY_ID}`

export const REQUEST_DELAY = 1500
export const LAST_QUERY_PART =
  "&$filter=boardId eq '_external' and (postingStatus eq 'Success' or postingStatus eq 'Updated')&$format=JSON"

export const SAP_API_URL = `${SAP_BASE_URL}/odata/v2/JobRequisitionPosting
?$select=
boardId,
jobReqId,
lastModifiedDateTime,
postingStatus,
jobRequisition/lastModifiedDateTime,
jobRequisition/jobReqLocale/externalJobDescription,
jobRequisition/jobReqLocale/extJobDescHeader,
jobRequisition/jobReqLocale/extJobDescFooter,
jobRequisition/jobReqLocale/externalTitle,
jobRequisition/jobReqLocale/locale,
jobRequisition/location_objlist/value/nameTranslationNav,
jobRequisition/filter1/picklistLabels/locale,
jobRequisition/filter1/picklistLabels/label,
jobRequisition/filter1/picklistLabels/optionId,
jobRequisition/filter3/picklistLabels/locale,
jobRequisition/filter3/picklistLabels/label,
jobRequisition/filter3/picklistLabels/optionId,
&$expand=jobRequisition,
jobRequisition/jobReqLocale,
jobRequisition/filter1/picklistLabels,
jobRequisition/filter3/picklistLabels,
jobRequisition/location_objlist/value/nameTranslationNav
${LAST_QUERY_PART}`

export const ALLOWED_HTML_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'ul',
  'ol',
  'li',
  'strong',
]
export const LOCALES = { default: 'en_US', allowed: ['en_US', 'de_DE'] }
export const webflowHeaders = {
  headers: { Authorization: `Bearer ${WEBFLOW_API_TOKEN}` },
}
