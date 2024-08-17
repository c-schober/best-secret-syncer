// Dev:
// export const COMPANY_ID = 'bestsecretD'
// export const BASE_URL = 'https://api55.sapsf.eu'
// export const WEBFLOW_SITE_ID = '66b0a4858f95088d59c089fc'
// export const WEBFLOW_TOKEN =
//   '3c803255171b4fc930d8436d1c937709b35aa05dbdfb57083651aa554c5a8a4e'
// export const LAST_QUERY_PART =
//   "&$filter=boardId eq '_external'&$format=JSON"

// Test:
export const COMPANY_ID = 'bestsecretT1'
export const BASE_URL = 'https://api55preview.sapsf.eu'
export const WEBFLOW_SITE_ID = '66bf4add5d7af33e2f52aa9a'
export const WEBFLOW_TOKEN =
  'f9ec2ad24d6b8ee739cecc75df827cd565122746a58779c3782e1622b703300b'
// const TEST_JOB_ID = '1560'
// const LAST_QUERY_PART = `&$filter=boardId eq '_external' and jobReqId eq '${TEST_JOB_ID}'&$format=JSON`
export const LAST_QUERY_PART =
  "&$filter=boardId eq '_external' and (postingStatus eq 'Success' or postingStatus eq 'Updated')&$format=JSON"

export const SAP_API_USERNAME = `APIREC@${COMPANY_ID}`
export const SAP_API_PASSWORD = 'NewGenCareers2024!'
export const REQUEST_DELAY = 1500

export const SAP_API_URL = `${BASE_URL}/odata/v2/JobRequisitionPosting
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
  headers: { Authorization: `Bearer ${WEBFLOW_TOKEN}` },
}
