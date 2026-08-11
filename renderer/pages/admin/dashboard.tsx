import {
  FaClipboardList,
  FaCheckCircle,
  FaWrench,
  FaTruck,
} from "react-icons/fa";

import AdminLayout from "@/components/organisms/AdminLayout";
import StatCard from "@/components/molecules/StatCard";
import SectionHeading from "@/components/atoms/SectionHeading";

import {
  dashboardStats,
  activityLogs,
  auditLogs,
} from "../../common/data/adminData";
import React from "react";

const iconMapping = {
  truck: <FaTruck />,
  "check-circle": <FaCheckCircle />,
  "screwdriver-wrench": <FaWrench />,
  "clipboard-list": <FaClipboardList />,
};

export default function DashboardPage() {
  return (
    <React.Fragment>
      <AdminLayout
        title="Dashboard Admin"
        subtitle="Ringkasan operasional dan aktivitas sistem"
      >
        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardStats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              tone={stat.tone as any}
              icon={iconMapping[stat.icon as keyof typeof iconMapping]}
            />
          ))}
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <SectionHeading
                title="Activity Logs"
                description="Aktivitas terbaru"
              />
            </div>
            <div className="space-y-3 text-sm">
              {activityLogs.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl bg-white dark:bg-slate-900/60 px-4 py-4"
                >
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                  <p className="text-slate-400 dark:text-slate-600 dark:text-slate-400">{item.description}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {item.timestamp}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <SectionHeading
                title="Audit Logs"
                description="Jejak perubahan"
              />
            </div>
            <div className="space-y-3 text-sm">
              {auditLogs.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl bg-white dark:bg-slate-900/60 px-4 py-4"
                >
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                  <p className="text-slate-400 dark:text-slate-600 dark:text-slate-400">{item.description}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {item.timestamp}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <SectionHeading
                title="Admin Quick Actions"
                description="Akses cepat panel admin"
              />
            </div>
            <div className="space-y-3 text-sm">
              {["Manage Users", "Review Audit Logs", "Approve Work Orders"].map(
                (action) => (
                  <button
                    key={action}
                    type="button"
                    className="block w-full rounded-2xl bg-white dark:bg-slate-900/60 px-4 py-4 text-left text-slate-800 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-900/80"
                  >
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{action}</p>
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between">
              <SectionHeading
                title="System Notifications"
                description="Status operasional"
              />
            </div>
            <div className="space-y-3 text-sm">
              {[
                "Database backup completed",
                "Pending approvals",
                "System health",
              ].map((notice) => (
                <div
                  key={notice}
                  className="rounded-2xl bg-white dark:bg-slate-900/60 px-4 py-4"
                >
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{notice}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AdminLayout>
    </React.Fragment>
  );
}
