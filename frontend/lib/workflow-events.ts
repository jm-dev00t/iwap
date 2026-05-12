import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { WorkflowEventPayload } from "@/lib/api";

const WS_URL = process.env.NEXT_PUBLIC_IWAP_WS_URL ?? "ws://localhost:8080/ws/workflows";

function toSockJsUrl(url: string): string {
  if (url.startsWith("ws://")) {
    return `http://${url.slice("ws://".length)}`;
  }
  if (url.startsWith("wss://")) {
    return `https://${url.slice("wss://".length)}`;
  }
  return url;
}

export function subscribeWorkflowEvents(onEvent: (event: WorkflowEventPayload) => void): () => void {
  const client = new Client({
    reconnectDelay: 3000,
    webSocketFactory: () => new SockJS(toSockJsUrl(WS_URL)),
    onConnect: () => {
      client.subscribe("/topic/workflows", (message) => {
        const event = JSON.parse(message.body) as WorkflowEventPayload;
        onEvent(event);
      });
    },
  });

  client.activate();

  return () => {
    void client.deactivate();
  };
}
