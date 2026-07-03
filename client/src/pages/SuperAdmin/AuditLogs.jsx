import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  HiOutlineClipboardList,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineClock
} from 'react-icons/hi';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = actionFilter 
        ? `/super-admin/audit-logs?action=${actionFilter}`
        : '/super-admin/audit-logs';
      const res = await api.get(url);
      setLogs(res.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const term = search.toLowerCase();
    const actionMatch = log.action?.toLowerCase().includes(term);
    const resourceMatch = log.resource_type?.toLowerCase().includes(term);
    const userMatch = log.profiles?.name?.toLowerCase().includes(term) || log.profiles?.email?.toLowerCase().includes(term);
    return actionMatch || resourceMatch || userMatch;
  });

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80' };
      case 'UPDATE': return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' };
      case 'DELETE': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' };
      case 'LOGIN': return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc' };
      default: return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' };
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="page-header">
        <div className="page-header-info">
          <h1>System Audit Logs</h1>
          <p>Real-time telemetry of platform activities</p>
        </div>
        <button className="btn btn-outline" onClick={fetchLogs}>
          Refresh Logs
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 250 }}>
          <HiOutlineSearch size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by action, resource, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <div style={{ position: 'relative', minWidth: 200 }}>
          <HiOutlineFilter size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <select 
            className="form-select" 
            style={{ paddingLeft: '2.5rem' }}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="CHANGE_PASSWORD">Password Change</option>
            <option value="RESET_PASSWORD">Admin Password Reset</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <HiOutlineClipboardList size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
              <p>No audit logs found</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Resource Type</th>
                  <th>Resource ID</th>
                  <th>User</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const style = getActionColor(log.action);
                  return (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <HiOutlineClock size={14} />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          background: style.bg,
                          color: style.text,
                          padding: '0.25rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          letterSpacing: '0.05em'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{log.resource_type || '-'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {log.resource_id ? (log.resource_id.length > 8 ? log.resource_id.substring(0,8)+'...' : log.resource_id) : '-'}
                      </td>
                      <td>
                        {log.profiles ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>{log.profiles.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.profiles.email}</div>
                          </div>
                        ) : 'System'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{log.ip_address || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AuditLogs;
