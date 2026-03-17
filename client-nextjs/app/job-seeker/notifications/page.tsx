"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MdDoneAll, MdNotifications } from "react-icons/md";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { jobAlertAPI } from "@/lib/api";
import type { JobAlertNotification } from "@/types/jobAlert";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("en-GH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function NotificationsPage() {
  useRouteGuard({
    requireAuth: true,
    requireOnboarding: false,
    requireRole: "JOB_SEEKER",
  });

  const [notifications, setNotifications] = useState<JobAlertNotification[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    setError("");
    setIsLoading(true);

    const response = await jobAlertAPI.getMyNotifications(1, 40);
    if (!response.success) {
      setError(response.message || "Failed to load notifications");
      setIsLoading(false);
      return;
    }

    const payload = response.data as { notifications?: JobAlertNotification[] };
    setNotifications(payload.notifications || []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markOne = async (id: string) => {
    await jobAlertAPI.markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );
  };

  const markAll = async () => {
    const response = await jobAlertAPI.markAllNotificationsAsRead();
    if (!response.success) {
      setError(response.message || "Failed to mark all as read");
      return;
    }

    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount} unread alert notifications
          </p>
        </div>

        <button
          onClick={markAll}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 hover:bg-muted"
        >
          <MdDoneAll className="h-4 w-4" />
          Mark all as read
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-muted-foreground">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <MdNotifications className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => {
            const jobId = item.data?.jobId;
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 ${
                  item.isRead
                    ? "border-border bg-card"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(item.createdAt)}
                    </p>
                    {jobId && (
                      <Link
                        href={`/jobs/${jobId}`}
                        className="mt-3 inline-block text-sm text-primary hover:underline"
                      >
                        View matched job
                      </Link>
                    )}
                  </div>

                  {!item.isRead && (
                    <button
                      onClick={() => markOne(item.id)}
                      className="rounded-lg border border-border px-3 py-1 text-sm hover:bg-muted"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
