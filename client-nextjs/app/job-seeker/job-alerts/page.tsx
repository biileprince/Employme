"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  MdAddAlert,
  MdDelete,
  MdEdit,
  MdEmail,
  MdNotifications,
  MdPauseCircle,
  MdPlayCircle,
  MdSave,
} from "react-icons/md";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { jobAlertAPI } from "@/lib/api";
import type { JobAlert, JobCategory, JobType } from "@/types/jobAlert";

const JOB_TYPES: JobType[] = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "FREELANCE",
];

const JOB_CATEGORIES: JobCategory[] = [
  "TECHNOLOGY",
  "FINANCE",
  "HEALTHCARE",
  "EDUCATION",
  "MARKETING",
  "SALES",
  "DESIGN",
  "ENGINEERING",
  "OPERATIONS",
  "HUMAN_RESOURCES",
  "LEGAL",
  "CUSTOMER_SERVICE",
  "MANUFACTURING",
  "CONSULTING",
  "MEDIA",
  "GOVERNMENT",
  "NON_PROFIT",
  "AGRICULTURE",
  "CONSTRUCTION",
  "HOSPITALITY",
  "TRANSPORTATION",
  "RETAIL",
  "REAL_ESTATE",
  "TELECOMMUNICATIONS",
  "OTHER",
];

type FormState = {
  name: string;
  keywords: string;
  locations: string;
  jobTypes: JobType[];
  categories: JobCategory[];
  emailEnabled: boolean;
  inAppEnabled: boolean;
  isActive: boolean;
};

const defaultFormState: FormState = {
  name: "",
  keywords: "",
  locations: "",
  jobTypes: [],
  categories: [],
  emailEnabled: true,
  inAppEnabled: true,
  isActive: true,
};

const splitCsv = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const formatEnum = (value: string): string =>
  value
    .split("_")
    .map((token) => token[0] + token.slice(1).toLowerCase())
    .join(" ");

export default function JobAlertsPage() {
  useRouteGuard({
    requireAuth: true,
    requireOnboarding: false,
    requireRole: "JOB_SEEKER",
  });

  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultFormState);

  const canSubmit = useMemo(() => {
    const hasFilter =
      splitCsv(form.keywords).length > 0 ||
      splitCsv(form.locations).length > 0 ||
      form.jobTypes.length > 0 ||
      form.categories.length > 0;

    return (
      form.name.trim().length > 0 &&
      hasFilter &&
      (form.emailEnabled || form.inAppEnabled)
    );
  }, [form]);

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      resetMessages();
      const response = await jobAlertAPI.getMyAlerts();
      if (!response.success) {
        throw new Error(response.message || "Failed to load alerts");
      }

      const nextAlerts =
        (response.data as { alerts?: JobAlert[] })?.alerts || [];
      setAlerts(nextAlerts);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load alerts";
      setError(message);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleToggleItem = <T extends string>(
    key: "jobTypes" | "categories",
    value: T,
  ) => {
    setForm((prev) => {
      const target = prev[key] as T[];
      const exists = target.includes(value);
      return {
        ...prev,
        [key]: exists
          ? target.filter((item) => item !== value)
          : [...target, value],
      };
    });
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setIsSaving(true);
      resetMessages();

      const payload = {
        name: form.name.trim(),
        keywords: splitCsv(form.keywords),
        locations: splitCsv(form.locations),
        jobTypes: form.jobTypes,
        categories: form.categories,
        emailEnabled: form.emailEnabled,
        inAppEnabled: form.inAppEnabled,
        isActive: form.isActive,
      };

      if (editingId) {
        const response = await jobAlertAPI.updateAlert(editingId, payload);
        if (!response.success) {
          throw new Error(response.message || "Failed to update alert");
        }
        setSuccess("Job alert updated");
      } else {
        const response = await jobAlertAPI.createAlert(payload);
        if (!response.success) {
          throw new Error(response.message || "Failed to create alert");
        }
        setSuccess("Job alert created");
      }

      setForm(defaultFormState);
      setEditingId(null);
      await loadAlerts();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save alert";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (alert: JobAlert) => {
    resetMessages();
    setEditingId(alert.id);
    setForm({
      name: alert.name,
      keywords: alert.keywords.join(", "),
      locations: alert.locations.join(", "),
      jobTypes: alert.jobTypes,
      categories: alert.categories,
      emailEnabled: alert.emailEnabled,
      inAppEnabled: alert.inAppEnabled,
      isActive: alert.isActive,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(defaultFormState);
    resetMessages();
  };

  const toggleActive = async (alert: JobAlert) => {
    resetMessages();
    const response = await jobAlertAPI.updateAlert(alert.id, {
      isActive: !alert.isActive,
    });

    if (!response.success) {
      setError(response.message || "Failed to update alert status");
      return;
    }

    setSuccess(`Alert ${alert.isActive ? "paused" : "resumed"}`);
    await loadAlerts();
  };

  const removeAlert = async (alertId: string) => {
    resetMessages();
    const confirmed = window.confirm("Delete this alert?");
    if (!confirmed) return;

    const response = await jobAlertAPI.deleteAlert(alertId);
    if (!response.success) {
      setError(response.message || "Failed to delete alert");
      return;
    }

    setSuccess("Alert deleted");
    await loadAlerts();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Job Alerts</h1>
        <p className="text-muted-foreground">
          Create smart alerts and choose delivery mode: email, in-app, or both.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="rounded-xl border border-border bg-card p-5 space-y-4"
      >
        <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <MdAddAlert className="h-6 w-6 text-primary" />
          {editingId ? "Edit Alert" : "Create Alert"}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Alert name (e.g. React jobs in Accra)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
          <input
            value={form.keywords}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, keywords: e.target.value }))
            }
            placeholder="Keywords (comma separated)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
          <input
            value={form.locations}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, locations: e.target.value }))
            }
            placeholder="Locations (comma separated, use remote for remote jobs)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 md:col-span-2"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Job Types</p>
          <div className="flex flex-wrap gap-2">
            {JOB_TYPES.map((item) => {
              const selected = form.jobTypes.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleToggleItem("jobTypes", item)}
                  className={`rounded-full px-3 py-1 text-sm border ${
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border"
                  }`}
                >
                  {formatEnum(item)}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Categories</p>
          <div className="flex flex-wrap gap-2">
            {JOB_CATEGORIES.map((item) => {
              const selected = form.categories.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleToggleItem("categories", item)}
                  className={`rounded-full px-3 py-1 text-sm border ${
                    selected
                      ? "bg-secondary text-secondary-foreground border-secondary"
                      : "bg-background text-foreground border-border"
                  }`}
                >
                  {formatEnum(item)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-lg border border-border p-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.emailEnabled}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, emailEnabled: e.target.checked }))
              }
            />
            <MdEmail className="h-4 w-4" /> Email
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.inAppEnabled}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, inAppEnabled: e.target.checked }))
              }
            />
            <MdNotifications className="h-4 w-4" /> In-app
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isActive: e.target.checked }))
              }
            />
            Alert active
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            <MdSave className="h-4 w-4" />
            {isSaving
              ? "Saving..."
              : editingId
                ? "Update Alert"
                : "Create Alert"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-border px-4 py-2 text-foreground"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Your Alerts</h2>

        {isLoading ? (
          <div className="text-muted-foreground">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
            No alerts yet. Create one above.
          </div>
        ) : (
          alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {alert.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {alert._count?.matches || 0} historical matches
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {alert.keywords.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-muted px-2 py-1"
                      >
                        #{item}
                      </span>
                    ))}
                    {alert.locations.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-muted px-2 py-1"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      alert.emailEnabled
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    Email
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      alert.inAppEnabled
                        ? "bg-blue-100 text-blue-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    In-app
                  </span>

                  <button
                    onClick={() => toggleActive(alert)}
                    className="rounded-lg border border-border p-2 hover:bg-muted"
                    title={alert.isActive ? "Pause" : "Resume"}
                  >
                    {alert.isActive ? (
                      <MdPauseCircle className="h-5 w-5" />
                    ) : (
                      <MdPlayCircle className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => startEdit(alert)}
                    className="rounded-lg border border-border p-2 hover:bg-muted"
                    title="Edit"
                  >
                    <MdEdit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="rounded-lg border border-red-300 p-2 text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <MdDelete className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
