import { generateLeadDemo } from './manualDemo.mjs';
// Compatibility entry point: prepares a demo only, never sends email.
export async function processSingleLead(lead, onProgress = null) {
  onProgress?.({ step: 1, percent: 10, stepText: 'Preparing demo for manual review', status: 'running' });
  const result = await generateLeadDemo(lead.id);
  onProgress?.({ step: 2, percent: 100, stepText: 'Demo ready. Review it before sending.', status: 'completed', result });
  return result;
}
