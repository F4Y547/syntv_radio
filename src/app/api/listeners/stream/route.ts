import { getListenerStore, getClientIp, checkRateLimitAsync, listenerConfig } from "@/lib/listeners";


export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimitAsync(`listeners:stream:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return new Response("Too many requests", { status: 429 });
  }

  const intervalMs = Math.max(2000, listenerConfig.updateIntervalSeconds * 1000);
  const encoder = new TextEncoder();

  let closed = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        if (closed) return;
        try {
          const store = getListenerStore();
          const counts = await store.getLiveCounts(Date.now());
          const payload = `data: ${JSON.stringify({ success: true, ...counts })}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (error) {
          console.error("[listeners/stream]", error);
          const payload = `data: ${JSON.stringify({ success: false, error: "Listener count unavailable" })}\n\n`;
          try { controller.enqueue(encoder.encode(payload)); } catch { /* closed */ }
        }
      };

      await send();
      timer = setInterval(() => { void send(); }, intervalMs);

      request.signal.addEventListener("abort", () => {
        closed = true;
        if (timer) clearInterval(timer);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      closed = true;
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
