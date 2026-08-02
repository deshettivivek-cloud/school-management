import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, Users, CreditCard } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardCharts = ({ gradeData, pieData }) => {
  return (
    <>
      <div className="widget-card col-span-8">
        <div className="widget-header">
          <div>
            <h3 className="widget-title">Student Distribution</h3>
            <p className="widget-subtitle">Enrollment across all grades</p>
          </div>
          <div className="badge badge-primary">
            <BarChart3 size={14} style={{ marginRight: 4 }} /> Analytics
          </div>
        </div>
        <div style={{ flex: 1, minHeight: '280px', marginTop: '1rem' }}>
          {gradeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-tertiary)' }} />
                <Bar dataKey="students" fill="url(#barGradient)" radius={[4, 4, 0, 0]} barSize={32} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary-400)" />
                    <stop offset="100%" stopColor="var(--primary-600)" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={24} /></div>
              <h4 className="empty-state-title">No Students Yet</h4>
              <p className="empty-state-description">Add your first student to see the distribution chart.</p>
            </div>
          )}
        </div>
      </div>

      <div className="widget-card col-span-4">
        <div className="widget-header">
          <div>
            <h3 className="widget-title">Fee Status</h3>
            <p className="widget-subtitle">Current collection overview</p>
          </div>
          <div className="badge badge-neutral">
            <PieChartIcon size={14} style={{ marginRight: 4 }} /> Status
          </div>
        </div>
        <div style={{ flex: 1, minHeight: '280px', display: 'flex', flexDirection: 'column' }}>
          {pieData.length > 0 ? (
            <>
              <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                {pieData.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                    {d.name}: <strong style={{ color: 'var(--text-primary)' }}>{d.value}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><CreditCard size={24} /></div>
              <h4 className="empty-state-title">No Fee Data</h4>
              <p className="empty-state-description">Start collecting fees to generate analytics.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DashboardCharts;
