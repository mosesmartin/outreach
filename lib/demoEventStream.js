// True provider deltas and actual workflow stages; no simulated progress timers.
export function demoEventStream(request, work) {
  const abort = new AbortController();
  const stop = () => abort.abort();
  if (request.signal.aborted) abort.abort();
  request.signal.addEventListener('abort', stop, { once: true });
  const encoder = new TextEncoder();
  let closed = false;
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (type, data) => { if (!closed && !abort.signal.aborted) controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)); };
      try { await work(emit, abort.signal); }
      catch (error) { emit('failure', { error: error.message || 'Could not complete this request.' }); }
      finally { request.signal.removeEventListener('abort', stop); if (!closed) { closed = true; controller.close(); } }
    },
    cancel() { closed = true; abort.abort(); request.signal.removeEventListener('abort', stop); },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' } });
}
