import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineSave, HiOutlinePencil, HiOutlineX } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const FeeStructure = () => {
  const { hasAccess } = useAuth();
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ academicYear: '', grade: '' });
  const [feeHeads, setFeeHeads] = useState([{ name: '', amount: '' }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStructures();
    fetchSchoolYear();
  }, []);

  const fetchSchoolYear = async () => {
    try {
      const res = await api.get('/schools');
      if (res.data.data?.academic_year) {
        setForm((prev) => ({ ...prev, academicYear: res.data.data.academic_year }));
      }
    } catch (err) { /* ignore */ }
  };

  const fetchStructures = async () => {
    try {
      const res = await api.get('/fees/structure');
      setStructures(res.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch fee structures');
    } finally {
      setLoading(false);
    }
  };

  const addFeeHead = () => {
    setFeeHeads([...feeHeads, { name: '', amount: '' }]);
  };

  const removeFeeHead = (index) => {
    if (feeHeads.length <= 1) return;
    setFeeHeads(feeHeads.filter((_, i) => i !== index));
  };

  const updateFeeHead = (index, field, value) => {
    const updated = [...feeHeads];
    updated[index][field] = field === 'amount' ? value : value;
    setFeeHeads(updated);
  };

  const totalFee = feeHeads.reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0);

  const openCreate = () => {
    setEditId(null);
    setFeeHeads([{ name: 'Tuition Fee', amount: '' }, { name: 'Exam Fee', amount: '' }]);
    setShowModal(true);
  };

  const openEdit = (structure) => {
    setEditId(structure._id);
    setForm({ academicYear: structure.academic_year || structure.academicYear, grade: structure.grade });
    const heads = structure.fee_heads || structure.feeHeads || [];
    setFeeHeads(heads.map((h) => ({ name: h.name, amount: h.amount.toString() })));
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const heads = feeHeads.filter((h) => h.name && h.amount).map((h) => ({
      name: h.name,
      amount: parseFloat(h.amount),
    }));

    if (heads.length === 0) {
      toast.error('Add at least one fee head');
      return;
    }
    if (!form.academicYear || !form.grade) {
      toast.error('Academic year and grade are required');
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await api.put(`/fees/structure/${editId}`, { feeHeads: heads });
        toast.success('Fee structure updated!');
      } else {
        await api.post('/fees/structure', { ...form, feeHeads: heads });
        toast.success('Fee structure created! 🎉');
      }
      setShowModal(false);
      fetchStructures();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deleteStructure = async (id) => {
    if (!window.confirm('Delete this fee structure?')) return;
    try {
      await api.delete(`/fees/structure/${id}`);
      toast.success('Deleted');
      fetchStructures();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Fee Structure</h1>
          <p>Define fee heads and amounts per grade</p>
        </div>
        {hasAccess(['principal']) && (
          <button className="btn btn-primary" onClick={openCreate}>
            <HiOutlinePlus /> New Fee Structure
          </button>
        )}
      </div>

      {loading ? (
        <div className="spinner-container"><div className="spinner" /></div>
      ) : structures.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <h3 className="empty-state-title">No Fee Structures</h3>
            <p className="empty-state-text">Define fee structures for each grade</p>
            {hasAccess(['principal']) && (
              <button className="btn btn-primary" onClick={openCreate}>
                <HiOutlinePlus /> Create First
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {structures.map((s) => (
            <div key={s._id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Class {s.grade}</h3>
                  <p className="card-subtitle">{s.academic_year || s.academicYear}</p>
                </div>
                {hasAccess(['principal']) && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(s)}>
                      <HiOutlinePencil />
                    </button>
                    <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger-400)' }} onClick={() => deleteStructure(s._id)}>
                      <HiOutlineTrash />
                    </button>
                  </div>
                )}
              </div>

              {(s.fee_heads || s.feeHeads || []).map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{h.name}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(h.amount)}</span>
                </div>
              ))}

              <div className="fee-total">
                <span className="fee-total-label">Total Standard Fee</span>
                <span className="fee-total-value">{formatCurrency(s.total_standard_fee || s.totalStandardFee)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Fee Structure' : 'New Fee Structure'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><HiOutlineX /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {!editId && (
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Academic Year *</label>
                      <input className="form-input" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder="2024-25" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Grade *</label>
                      <select className="form-select" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                        <option value="">Select</option>
                        {['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((g) => (
                          <option key={g} value={g}>Class {g}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <label className="form-label" style={{ marginBottom: '0.75rem' }}>Fee Heads</label>
                {feeHeads.map((head, i) => (
                  <div key={i} className="fee-head-row">
                    <input className="form-input" placeholder="Fee name (e.g., Tuition)" value={head.name} onChange={(e) => updateFeeHead(i, 'name', e.target.value)} />
                    <input className="form-input" type="number" placeholder="Amount" value={head.amount} onChange={(e) => updateFeeHead(i, 'amount', e.target.value)} style={{ maxWidth: 130 }} />
                    <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeFeeHead(i)} style={{ color: 'var(--danger-400)' }}>
                      <HiOutlineTrash />
                    </button>
                  </div>
                ))}

                <button type="button" className="btn btn-secondary btn-sm" onClick={addFeeHead}>
                  <HiOutlinePlus /> Add Fee Head
                </button>

                <div className="fee-total">
                  <span className="fee-total-label">Total</span>
                  <span className="fee-total-value">{formatCurrency(totalFee)}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <HiOutlineSave /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeStructure;
