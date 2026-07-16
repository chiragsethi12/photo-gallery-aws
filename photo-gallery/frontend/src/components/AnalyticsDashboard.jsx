// src/components/AnalyticsDashboard.jsx - Dashboard with graphs showing image storage stats & activities
import React, { useEffect, useState } from 'react';
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
} from 'recharts';
import { fetchStorageAnalytics, fetchActivityAnalytics } from '../api/imageApi';

const PIE_COLORS = ['#6366f1', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

const AnalyticsDashboard = () => {
  const [storageData, setStorageData] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        console.error('Failed to load analytics:', err);
        setError(err.response?.data?.error || 'Failed to load analytics dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-300 gap-4" role="status">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-sm font-semibold tracking-wide">Aggregating CloudSnap utilization metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 glass rounded-2xl border border-red-500/20 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Analytics Error</h3>
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    );
  }

  // Calculate totals and metrics for summary cards
  const totalImages = storageData?.totalImageCount || 0;
  
  const mostCommonFormat = storageData?.formatBreakdown?.[0]?._id 
    ? `${storageData.formatBreakdown[0]._id.toUpperCase()} (${storageData.formatBreakdown[0].count})`
    : 'None';

  const totalActivitiesCount = activityData?.activityBreakdown?.reduce((acc, curr) => acc + curr.count, 0) || 0;

  // Render tooltip with custom glass theme
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 px-3.5 py-2.5 rounded-xl shadow-2xl">
          <p className="text-[11px] font-bold text-slate-400 mb-1">{`Week: ${label}`}</p>
          <p className="text-xs font-bold text-indigo-400">
            {`Count: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Analytics Dashboard</h2>
          <p className="text-xs text-slate-400">Real-time usage patterns, storage utilization, and personal activity audits.</p>
        </div>
        <div className="text-xs text-slate-400 bg-white/5 border border-white/5 rounded-full px-4 py-1.5 self-start">
          System Status: <span className="text-teal-400 font-semibold">Live Monitoring</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        
        {/* Card 1 */}
        <div className="glass rounded-2xl border border-white/5 p-6 hover:border-indigo-500/30 transition-all duration-300 group shadow-lg shadow-black/20">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Images</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          </div>
          <h4 className="text-3xl font-black text-white group-hover:text-indigo-400 transition-colors">{totalImages}</h4>
          <p className="text-[10px] text-slate-500 mt-2">Active non-deleted image files</p>
        </div>

        {/* Card 2 */}
        <div className="glass rounded-2xl border border-white/5 p-6 hover:border-purple-500/30 transition-all duration-300 group shadow-lg shadow-black/20">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top format</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
          </div>
          <h4 className="text-3xl font-black text-white group-hover:text-purple-400 transition-colors">{mostCommonFormat}</h4>
          <p className="text-[10px] text-slate-500 mt-2">Most dominant uploaded content file type</p>
        </div>

        {/* Card 3 */}
        <div className="glass rounded-2xl border border-white/5 p-6 hover:border-pink-500/30 transition-all duration-300 group shadow-lg shadow-black/20">
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total activities</span>
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 group-hover:bg-pink-500/20 transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
          </div>
          <h4 className="text-3xl font-black text-white group-hover:text-pink-400 transition-colors">{totalActivitiesCount}</h4>
          <p className="text-[10px] text-slate-500 mt-2">Actions registered (last 12 weeks)</p>
        </div>

      </div>

      {/* Main Charts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        
        {/* Weekly Uploads Trend Bar Chart */}
        <div className="glass rounded-2xl border border-white/5 p-6 shadow-xl shadow-black/20">
          <h3 className="text-sm font-bold text-white mb-6">Weekly Upload Volume (Last 12 Weeks)</h3>
          <div className="h-72 w-full">
            {storageData?.uploadHistory?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={storageData.uploadHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="_id" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" fill="url(#uploadGrad)" radius={[4, 4, 0, 0]}>
                    <defs>
                      <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.85} />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No uploads in the last 12 weeks.
              </div>
            )}
          </div>
        </div>

        {/* Format Distribution Pie Chart */}
        <div className="glass rounded-2xl border border-white/5 p-6 shadow-xl shadow-black/20">
          <h3 className="text-sm font-bold text-white mb-6">Format Breakdown</h3>
          <div className="h-72 w-full flex flex-col md:flex-row items-center justify-center">
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
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }}
                        itemStyle={{ color: '#fff', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap md:flex-col gap-3 justify-center md:w-2/5 md:pl-4">
                  {storageData.formatBreakdown.map((entry, index) => (
                    <div key={entry._id} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="font-semibold">{entry._id.toUpperCase()}:</span>
                      <span className="text-slate-400">{entry.count} images</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No formats distribution. Please upload an image first.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Activity Breakdown List */}
      <div className="glass rounded-2xl border border-white/5 p-6 shadow-xl shadow-black/20">
        <h3 className="text-sm font-bold text-white mb-6">Audited Activity Type Summary (Lifetime)</h3>
        {activityData?.activityBreakdown?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {activityData.activityBreakdown.map((act, index) => (
              <div 
                key={act._id} 
                className="bg-white/3 border border-white/5 rounded-xl p-4 flex flex-col items-center hover:border-slate-500/20 transition-all duration-200"
              >
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                  {act._id.replace('_', ' ')}
                </div>
                <div className="text-2xl font-black text-white" style={{ color: PIE_COLORS[index % PIE_COLORS.length] }}>
                  {act.count}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500">
            No activity records found. Try uploading files, creating comments, or editing collaborators.
          </div>
        )}
      </div>

    </div>
  );
};

export default AnalyticsDashboard;
