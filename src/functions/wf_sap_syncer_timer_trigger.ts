import { app, InvocationContext, Timer } from '@azure/functions'
import axios from 'axios'
import { TRIGGER_SYNC_TOKEN } from '../const'

const wf_sap_syncer_timer_trigger = async (
  myTimer: Timer,
  context: InvocationContext
): Promise<void> => {
  try {
    const response = await axios.get(
      `https://best-secret-webflow-syncer-app.azurewebsites.net/api/wfsapsyncer?token=${TRIGGER_SYNC_TOKEN}`
    )

    const data = response.data
    context.log('HTTP Trigger Function Response:', data)
  } catch (error) {
    context.error('Error calling HTTP Trigger Function:', error.message)
  }
  context.log('Timer function processed request.')
}

app.timer('wf_sap_syncer_timer_trigger', {
  schedule: '0 */1 * * * *',
  handler: wf_sap_syncer_timer_trigger,
})

export default wf_sap_syncer_timer_trigger
