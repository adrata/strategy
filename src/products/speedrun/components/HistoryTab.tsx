import React from "react";
import { SpeedrunPerson, HistoryData } from "../types/SpeedrunTypes";
import { calculateEngagementScore } from "../utils/monacoExtractors";
import { useActionLogs } from "../hooks/useActionLogs";

interface HistoryTabProps {
  person: SpeedrunPerson;
  historyData: HistoryData;
}

export function HistoryTab({ person, historyData }: HistoryTabProps) {
  const { actionLogs, loading: actionLogsLoading } = useActionLogs(person.id);

  // Get action type icon
  const getActionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'email': return '📧';
      case 'call': return '📞';
      case 'linkedin': return '💼';
      case 'meeting': return '🤝';
      case 'text': return '💬';
      default: return '📝';
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
        Engagement History
      </h2>
      <div className="mb-4 bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
        <span className="font-semibold text-[var(--foreground)]">
          Engagement Score:
        </span>{" "}
        <span className="text-2xl font-bold text-[#2563EB]">
          {calculateEngagementScore(person)}/100
        </span>
        <span className="text-sm text-[var(--muted)] ml-2">
          (
          {person['status'] === "Hot"
            ? "Hot"
            : person['status'] === "Qualified"
              ? "Warm"
              : person['status'] === "Contacted"
                ? "Warm"
                : "Cold"}
          )
        </span>
      </div>
      <div className="mb-4 bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
        <span className="font-semibold text-[var(--foreground)]">
          AI Summary:
        </span>{" "}
        {historyData.aiSummary}
      </div>

      {/* Recent Actions Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Recent Actions
        </h3>
        {actionLogsLoading ? (
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
            <div className="animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--loading-bg)] rounded-full"></div>
              <div className="flex-1">
                <div className="w-3/4 h-4 bg-[var(--loading-bg)] rounded mb-2"></div>
                <div className="w-1/2 h-3 bg-[var(--loading-bg)] rounded"></div>
              </div>
            </div>
          </div>
        ) : actionLogs.length > 0 ? (
          <div className="space-y-3">
            {actionLogs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0 mt-1">
                    {getActionIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-[var(--foreground)] capitalize">
                        {log.type}
                      </span>
                      <span className="text-sm text-[var(--muted)]">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-[var(--foreground)] text-sm leading-relaxed">
                      {log.notes || log.actionLog}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {actionLogs.length > 10 && (
              <div className="text-center pt-2">
                <span className="text-sm text-[var(--muted)]">
                  + {actionLogs.length - 10} more actions
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 text-center">
            <div className="text-[var(--muted)] mb-2">📝</div>
            <p className="text-[var(--muted)] text-sm">
              No actions logged yet. Complete a Speedrun to start tracking!
            </p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Timeline
        </h3>
        <ul className="pl-0">
          {historyData.timeline.map((item, idx) => (
            <li key={idx} className="flex items-start mb-8 relative">
              <div
                className="flex flex-col items-center mr-4"
                style={{ minWidth: 24 }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    background: "var(--accent)",
                    border: "2px solid var(--background)",
                    borderRadius: "50%",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  }}
                />
                {idx < historyData.timeline.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      background: "var(--border)",
                      minHeight: 24,
                    }}
                  />
                )}
              </div>
              <div>
                <div className="font-semibold text-[var(--foreground)] text-base">
                  {item.date}
                </div>
                <div className="text-[var(--foreground)] text-base">
                  {item.type}: {item.summary}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          Communication History
        </h3>
        <ul className="pl-0">
          {historyData.communicationHistory.map((item, idx) => (
            <li key={idx} className="flex items-start mb-8 relative">
              <div
                className="flex flex-col items-center mr-4"
                style={{ minWidth: 24 }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    background: "var(--accent)",
                    border: "2px solid var(--background)",
                    borderRadius: "50%",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  }}
                />
                {idx < historyData.communicationHistory.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      background: "var(--border)",
                      minHeight: 24,
                    }}
                  />
                )}
              </div>
              <div>
                <div className="font-semibold text-[var(--foreground)] text-base">
                  {item.date}
                </div>
                <div className="text-[var(--foreground)] text-base">
                  {item.channel}: {item.subject}
                </div>
                <div className="text-[var(--muted)] text-sm">{item.status}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mb-4 bg-[var(--background)] border border-[var(--border)] rounded-lg p-4">
        <span className="font-semibold text-[var(--foreground)]">
          Interaction Metrics:
        </span>
        <ul className="list-disc pl-6">
          <li>
            <span className="font-semibold text-[var(--foreground)]">
              Total Interactions:
            </span>{" "}
            {historyData.interactionMetrics.totalInteractions}
          </li>
          <li>
            <span className="font-semibold text-[var(--foreground)]">
              Emails Sent:
            </span>{" "}
            {historyData.interactionMetrics.emailsSent}
          </li>
          <li>
            <span className="font-semibold text-[var(--foreground)]">
              Calls Made:
            </span>{" "}
            {historyData.interactionMetrics.callsMade}
          </li>
          <li>
            <span className="font-semibold text-[var(--foreground)]">
              LinkedIn Messages:
            </span>{" "}
            {historyData.interactionMetrics.linkedinMessages}
          </li>
          <li>
            <span className="font-semibold text-[var(--foreground)]">
              Average Response Time:
            </span>{" "}
            {historyData.interactionMetrics.avgResponseTime}
          </li>
          <li>
            <span className="font-semibold text-[var(--foreground)]">
              Last Interaction:
            </span>{" "}
            {historyData.interactionMetrics.lastInteraction}
          </li>
          <li>
            <span className="font-semibold text-[var(--foreground)]">
              Engagement Trend:
            </span>{" "}
            {historyData.interactionMetrics.engagementTrend}
          </li>
          <li>
            <span className="font-semibold text-[var(--foreground)]">
              Preferred Channel:
            </span>{" "}
            {historyData.interactionMetrics.preferredChannel}
          </li>
        </ul>
      </div>
    </>
  );
}
