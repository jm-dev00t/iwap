"use client";

import { useEffect, useState } from "react";
import { actionLabel, agentLabel } from "@/lib/display-labels";
import { subscribeWorkflowEvents } from "@/lib/workflow-events";
import { statusIcon, timelineEvents, type TimelineEvent } from "@/lib/workflow-demo";
import type { WorkflowEventPayload } from "@/lib/api";

const statusStyle = {
  completed: "bg-success text-ink",
  running: "bg-primary text-white",
  waiting: "bg-surface-dark-elevated text-muted",
};

function eventStatus(eventType: string): TimelineEvent["status"] {
  return eventType === "APPROVAL_REQUESTED" ? "waiting" : "completed";
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "방금";
  }
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function toTimelineEvent(event: WorkflowEventPayload): TimelineEvent {
  return {
    agent: agentLabel(event.agentType),
    status: eventStatus(event.eventType),
    title: actionLabel(event.eventType),
    detail: event.message,
    time: formatTime(event.occurredAt),
  };
}

export function AgentTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>(timelineEvents);

  useEffect(() => {
    return subscribeWorkflowEvents((event) => {
      setEvents((current) => [toTimelineEvent(event), ...current].slice(0, 8));
    });
  }, []);

  return (
    <section className="rounded-xl bg-surface-dark p-6 text-canvas">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-teal">실시간 에이전트 흐름</p>
          <h2 className="display-title mt-2 text-3xl">다중 에이전트 실행</h2>
        </div>
        <span className="rounded-full bg-surface-dark-elevated px-3 py-1 text-xs text-teal">실시간 수신</span>
      </div>

      <div className="mt-6 space-y-3">
        {events.map((event, index) => {
          const Icon = statusIcon[event.status];
          return (
            <article className="rounded-lg bg-surface-dark-elevated p-4" key={`${event.agent}-${event.title}-${event.time}-${index}`}>
              <div className="flex items-start gap-3">
                <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${statusStyle[event.status]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-canvas">{event.agent}</p>
                    <p className="font-mono text-xs text-muted">{event.time}</p>
                  </div>
                  <p className="mt-1 text-sm font-medium text-canvas">{event.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#a09d96]">{event.detail}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
