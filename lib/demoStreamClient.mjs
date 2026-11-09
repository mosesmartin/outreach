export async function readDemoEvents(response, onEvent = () => {}) {
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || 'Could not start this request.');
  }
  if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) throw new Error('The server did not return a live demo session. Deploy the updated app and try again.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '', completed;
  const consume = block => {
    const lines = block.split('\n');
    const type = lines.find(line => line.startsWith('event:'))?.slice(6).trim();
    const payload = lines.filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
    if (!type || !payload) return;
    const data = JSON.parse(payload);
    if (type === 'failure') throw new Error(data.error || 'The AI request failed.');
    if (type === 'complete') completed = data;
    onEvent(type, data);
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      pending += done ? decoder.decode() : decoder.decode(value, { stream: true });
      pending = pending.replace(/\r\n/g, '\n');
      let boundary;
      while ((boundary = pending.indexOf('\n\n')) >= 0) { consume(pending.slice(0, boundary)); pending = pending.slice(boundary + 2); }
      if (done) break;
    }
    if (pending.trim()) consume(pending);
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
  if (!completed) throw new Error('The connection ended before confirmation. Check the latest saved demo before retrying generation.');
  return completed;
}
