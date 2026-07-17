// src/components/AnalyticsDashboard.jsx - Premium analytics workspace
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  AlertCircle,
  ImageIcon,
  PieChart as PieChartIcon,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { fetchStorageAnalytics, fetchActivityAnalytics } from "../api/imageApi";

const PIE_COLORS = [
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#3b82f6",
];

const AnalyticsDashboard = () => {
  const [storageData, setStorageData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const [storageRes, activityRes] = await Promise.all([
          fetchStorageAnalytics(),
          fetchActivityAnalytics(),
        ]);
        setStorageData(storageRes);
        setActivityData(activityRes);
      } catch (err) {
        console.error("Failed to load analytics:", err);
        setError(
          err.response?.data?.error ||
            "Failed to load analytics dashboard data.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-slate-300"
        role="status"
      >
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
        <p className="text-sm font-semibold tracking-wide">
          Aggregating your photo workspace metrics…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto my-12 max-w-xl rounded-[28px] border border-rose-500/20 bg-slate-900/70 p-8 text-center shadow-soft">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-300">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">
          Analytics temporarily unavailable
        </h3>
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    );
  }

  const totalImages = storageData?.totalImageCount || 0;
  const mostCommonFormat = storageData?.formatBreakdown?.[0]?._id
    ? `${storageData.formatBreakdown[0]._id.toUpperCase()} (${storageData.formatBreakdown[0].count})`
    : "None";
  const totalActivitiesCount =
    activityData?.activityBreakdown?.reduce(
      (acc, curr) => acc + curr.count,
      0,
    ) || 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/90 px-3.5 py-2.5 shadow-soft">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Week: {label}
          </p>
          <p className="text-sm font-semibold text-emerald-300">
            Count: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 rounded-[32px] border border-slate-800 bg-slate-900/70 p-6 shadow-soft md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" /> Insights
          </div>
          <h2 className="text-2xl font-semibold text-white">
            Analytics dashboard
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            A clear view of uploads, storage patterns, and your activity
            history.
          </p>
        </div>
        <div className="rounded-full border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-400">
          System status{" "}
          <span className="font-semibold text-emerald-300">
            Live monitoring
          </span>
        </div>
      </div>

      <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Photos
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
              <ImageIcon className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-white">{totalImages}</p>
          <p className="mt-2 text-xs text-slate-500">Active files</p>
        </div>

        <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Albums
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-white">{storageData?.albumCount || 0}</p>
          <p className="mt-2 text-xs text-slate-500">Curated sets</p>
        </div>

        <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Favorites
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
              <ImageIcon className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-white">{storageData?.favoriteCount || 0}</p>
          <p className="mt-2 text-xs text-slate-500">Hearted photos</p>
        </div>

        <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Shares
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-white">{storageData?.sharedLinkCount || 0}</p>
          <p className="mt-2 text-xs text-slate-500">Active public links</p>
        </div>

        <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Trash
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 text-slate-300">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-white">{storageData?.trashCount || 0}</p>
          <p className="mt-2 text-xs text-slate-500">Deleted items</p>
        </div>

        <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Top format
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-300">
              <PieChartIcon className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-semibold text-white truncate" title={mostCommonFormat}>
            {mostCommonFormat}
          </p>
          <p className="mt-2 text-xs text-slate-500">Most common</p>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Weekly upload volume</h3>
              <p className="text-sm text-slate-500">
                Recent momentum in your library
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            {storageData?.uploadHistory?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={storageData.uploadHistory}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <XAxis
                    dataKey="_id"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#uploadGrad)"
                    radius={[6, 6, 0, 0]}
                  >
                    <defs>
                      <linearGradient
                        id="uploadGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#34d399"
                          stopOpacity={0.95}
                        />
                        <stop
                          offset="100%"
                          stopColor="#0f766e"
                          stopOpacity={0.2}
                        />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No uploads in the last 12 weeks.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
              <PieChartIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Format breakdown</h3>
              <p className="text-sm text-slate-500">
                How your collection is composed
              </p>
            </div>
          </div>
          <div className="flex h-72 flex-col items-center justify-center md:flex-row">
            {storageData?.formatBreakdown?.length > 0 ? (
              <>
                <div className="h-full w-full md:w-3/5">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={storageData.formatBreakdown}
                        dataKey="count"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {storageData.formatBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "10px",
                        }}
                        itemStyle={{ color: "#fff", fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 md:w-2/5 md:flex-col md:pl-4">
                  {storageData.formatBreakdown.map((entry, index) => (
                    <div
                      key={entry._id}
                      className="flex items-center gap-2 text-xs text-slate-300"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            PIE_COLORS[index % PIE_COLORS.length],
                        }}
                      />
                      <span className="font-semibold">
                        {entry._id.toUpperCase()}:
                      </span>
                      <span className="text-slate-400">
                        {entry.count} images
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500">
                No formats distribution yet. Upload an image to start tracking
                it.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-6 shadow-soft">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-fuchsia-500/10 text-fuchsia-300">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Activity summary</h3>
            <p className="text-sm text-slate-500">
              A lifetime breakdown of interactions across your space
            </p>
          </div>
        </div>
        {activityData?.activityBreakdown?.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {activityData.activityBreakdown.map((act, index) => (
              <div
                key={act._id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center"
              >
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                  {act._id.replace("_", " ")}
                </div>
                <div
                  className="text-2xl font-semibold"
                  style={{ color: PIE_COLORS[index % PIE_COLORS.length] }}
                >
                  {act.count}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-sm text-slate-500">
            No activity records found yet. Try uploading files, leaving
            comments, or sharing content.
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
