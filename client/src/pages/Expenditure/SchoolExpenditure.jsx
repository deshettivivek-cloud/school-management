import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus, HiOutlineSearch, HiOutlineCurrencyRupee,
  HiOutlineTrash, HiOutlinePencil, HiOutlineX, HiOutlineCheck,
  HiOutlineFilter, HiOutlineTrendingUp
} from 'react-icons/hi';
import { format } from 'date-fns';

const CATEGORIES = [
  { value: 'salary', label: 'Salary & Wages', color: '#818cf8' },
  { value: 'maintenance', label: 'Maintenance', color: '#f97316' },
  { value: 'supplies', label: 'Supplies & Stationery', color: '#22c55e' },
  { value: 'utilities', label: 'Utilities (Electricity/Water)', color: '#eab308' },
  { value: 'transport', label: 'Transport', color: '#06b6d4' },
  { value: 'events', label: 'Events & Functions', color: '#ec4899' },
  { value: 'infrastructure', label: 'Infrastructure', color: '#8b5cf6' },
  { value: 'technology', label: 'Technology & IT', color: '#3b82f6' },
  { value: 'other', label: 'Other', color: '#64748b' },
];

const PAYMENT_MODES = ['cash', 'bank_transfer', 'cheque', 'upi', 'card'];

const SchoolExpenditure = () => {
  const [expenditures, setExpenditures] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleting, setDeleting] = useState(null);

  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMode: 'cash',
    vendorName: '',
    academicYear: '',
  });

  useEffect(() => {
    fetchExpenditures();
    fetchStats();
  }, [categoryFilter]);

  const fetchExpenditures = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      const res = await api.get(`/expenditures?${params}`);
      setExpenditures(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch expenditures');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/expenditures/stats');
      setStats(res.data.data);
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      title: '', amount: '', category: 'other',
      date: new Date().toISOString().split('T')[0],
      description: '', paymentMode: 'cash', vendorName: '', academicYear: '',
    });
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (exp) => {
    setForm({
      title: exp.title,
      amount: exp.amount,
      category: exp.category,
      date: exp.date ? exp.date.split('T')[0] : '',
      description: exp.description || '',
      paymentMode: exp.payment_mode || 'cash',
      vendorName: exp.vendor_name || '',
      academicYear: exp.academic_year || '',
    });
    setEditingId(exp.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.category || !form.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/expenditures/${editingId}`, form);
        toast.success('Expenditure updated!');
      } else {
        await api.post('/expenditures', form);
        toast.success('Expenditure added! 🎉');
      }
      setShowModal(false);
      resetForm();
      fetchExpenditures();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeleting(id);
      await api.delete(`/expenditures/${id}`);
      toast.success('Expenditure deleted');
      fetchExpenditures();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const getCategoryInfo = (value) => CATEGORIES.find(c => c.value === value) || CATEGORIES[CATEGORIES.length - 1];

  const filtered = useMemo(() => {
    if (!search) return expenditures;
    const s = search.toLowerCase();
    return expenditures.filter(e =>
      e.title?.toLowerCase().includes(s) ||
      e.vendor_name?.toLowerCase().includes(s) ||
      e.description?.toLowerCase().includes(s)
    );
  }, [expenditures, search]);

  const totalFiltered = useMemo(() =>
    filtered.reduce((sum, e) => sum + (e.amount || 0), 0),
    [filtered]
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>School Expenditure</h1>
          <p>Track and manage all school expenses</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openAddModal}>
            <HiOutlinePlus /> Add Expense
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stat-grid">
          <div className="stat-card primary">
            <div className="stat-icon primary">
              <HiOutlineCurrencyRupee />
            </div>
            <div className="stat-info">
              <div className="stat-label">Total Expenditure</div>
              <div className="stat-value">₹{stats.totalExpenditure?.toLocaleString('en-IN') || 0}</div>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon success">
              <HiOutlineTrendingUp />
            </div>
            <div className="stat-info">
              <div className="stat-label">Total Entries</div>
              <div className="stat-value">{stats.totalCount || 0}</div>
            </div>
          </div>
          {stats.categoryWise?.slice(0, 2).map((cat, i) => {
            const info = getCategoryInfo(cat.category);
            return (
              <div key={cat.category} className={`stat-card ${i === 0 ? 'warning' : 'danger'}`}>
                <div className={`stat-icon ${i === 0 ? 'warning' : 'danger'}`}>
                  <HiOutlineFilter />
                </div>
                <div className="stat-info">
                  <div className="stat-label">{info.label}</div>
                  <div className="stat-value">₹{cat.amount?.toLocaleString('en-IN')}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Breakdown */}
      {stats?.categoryWise?.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">Category Breakdown</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {stats.categoryWise.map((cat) => {
              const info = getCategoryInfo(cat.category);
              const percentage = stats.totalExpenditure > 0
                ? ((cat.amount / stats.totalExpenditure) * 100).toFixed(1)
                : 0;
              return (
                <div
                  key={cat.category}
                  style={{
                    flex: '1 1 200px',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: `1px solid ${info.color}30`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setCategoryFilter(categoryFilter === cat.category ? '' : cat.category)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: info.color, fontWeight: 600 }}>
                      {info.label}
                    </span>
                    <span style={{
                      fontSize: '0.75rem', padding: '2px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: `${info.color}20`, color: info.color,
                    }}>
                      {percentage}%
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    ₹{cat.amount?.toLocaleString('en-IN')}
                  </div>
                  {/* Progress bar */}
                  <div style={{
                    marginTop: '0.5rem', height: '4px',
                    background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${percentage}%`, height: '100%',
                      background: info.color, borderRadius: '4px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-bar">
          <HiOutlineSearch className="search-bar-icon" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {filtered.length > 0 && (
          <div style={{
            padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap',
          }}>
            Total: <strong style={{ color: 'var(--primary-400)' }}>₹{totalFiltered.toLocaleString('en-IN')}</strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({filtered.length} entries)</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💰</div>
              <h3 className="empty-state-title">No Expenses Found</h3>
              <p className="empty-state-text">Start by adding a new expenditure entry</p>
              <button className="btn btn-primary" onClick={openAddModal}>
                <HiOutlinePlus /> Add Expense
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Mode</th>
                  <th>Vendor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exp) => {
                  const catInfo = getCategoryInfo(exp.category);
                  return (
                    <tr key={exp.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {exp.date ? format(new Date(exp.date), 'dd MMM yyyy') : '-'}
                      </td>
                      <td>
                        <div>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{exp.title}</span>
                          {exp.description && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {exp.description.substring(0, 60)}{exp.description.length > 60 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 10px', borderRadius: 'var(--radius-full)',
                          fontSize: '0.78rem', fontWeight: 600,
                          background: `${catInfo.color}20`, color: catInfo.color,
                        }}>
                          {catInfo.label}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--danger-400)', whiteSpace: 'nowrap' }}>
                        ₹{exp.amount?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>
                        {(exp.payment_mode || 'cash').replace('_', ' ')}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {exp.vendor_name || '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModal(exp)}
                          >
                            <HiOutlinePencil />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(exp.id)}
                            disabled={deleting === exp.id}
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingId ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>
                <HiOutlineX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g., Staff salary - June"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input
                    type="number"
                    className="form-input"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="e.g., 50000"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-select"
                    name="paymentMode"
                    value={form.paymentMode}
                    onChange={handleChange}
                  >
                    {PAYMENT_MODES.map((m) => (
                      <option key={m} value={m}>{m.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vendor / Payee</label>
                  <input
                    type="text"
                    className="form-input"
                    name="vendorName"
                    value={form.vendorName}
                    onChange={handleChange}
                    placeholder="e.g., ABC Suppliers"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Additional details about the expense..."
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <HiOutlineCheck /> {editingId ? 'Update' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default SchoolExpenditure;
