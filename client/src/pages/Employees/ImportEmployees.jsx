import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  ArrowLeft, UploadCloud, Download, CheckCircle, AlertTriangle, FileSpreadsheet, XCircle, RefreshCw, Send
} from 'lucide-react';

const ImportEmployees = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  // Preview state
  const [previewData, setPreviewData] = useState(null); // { validRows, invalidRows, summary }
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'valid' | 'errors'

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const response = await api.get('/import/employees/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employee_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template downloaded successfully!');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewData(null);
      handlePreview(file);
    }
  };

  const handlePreview = async (fileToPreview) => {
    const file = fileToPreview || selectedFile;
    if (!file) return;

    setLoadingPreview(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/import/employees/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setPreviewData(res.data);
        toast.success(`Spreadsheet parsed: ${res.data.summary.validCount} valid, ${res.data.summary.errorCount} error(s).`);
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error(error.response?.data?.message || 'Failed to preview spreadsheet.');
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCommit = async () => {
    if (!previewData || !previewData.validRows || previewData.validRows.length === 0) {
      toast.error('No valid rows available to import.');
      return;
    }

    setCommitting(true);
    try {
      const res = await api.post('/import/employees/commit', {
        validRows: previewData.validRows,
      });

      if (res.data?.success) {
        toast.success(`Successfully imported ${res.data.count} employees!`);
        navigate('/employees');
      }
    } catch (error) {
      console.error('Commit import error:', error);
      toast.error(error.response?.data?.message || 'Failed to commit employee import.');
    } finally {
      setCommitting(false);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setPreviewData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Combine rows for table display
  const combinedRows = [];
  if (previewData) {
    (previewData.validRows || []).forEach((vr) => {
      combinedRows.push({
        rowNumber: vr.rowNumber,
        data: vr.data,
        isValid: true,
        errors: [],
      });
    });

    (previewData.invalidRows || []).forEach((ir) => {
      combinedRows.push({
        rowNumber: ir.rowNumber,
        data: ir.row,
        isValid: false,
        errors: ir.errors,
      });
    });

    combinedRows.sort((a, b) => a.rowNumber - b.rowNumber);
  }

  const displayedRows = combinedRows.filter((r) => {
    if (activeTab === 'valid') return r.isValid;
    if (activeTab === 'errors') return !r.isValid;
    return true;
  });

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/employees')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Back to Directory
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileSpreadsheet size={24} style={{ color: 'var(--primary-600, #4f46e5)' }} /> Bulk Employee Import
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>
              Upload an Excel (.xlsx, .xls) or CSV file to import multiple employee records in bulk.
            </p>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={handleDownloadTemplate}
          disabled={downloadingTemplate}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Download size={18} /> {downloadingTemplate ? 'Downloading...' : 'Download Sample Template'}
        </button>
      </div>

      {/* File Upload Zone */}
      <div className="card" style={{ marginBottom: '2rem', padding: '2rem', textAlign: 'center' }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--primary-300, #a5b4fc)',
            borderRadius: '8px',
            padding: '2.5rem 1.5rem',
            background: 'var(--primary-50, #f5f3ff)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <UploadCloud size={48} style={{ color: 'var(--primary-600, #4f46e5)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
            {selectedFile ? selectedFile.name : 'Click to select or drag & drop spreadsheet file'}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files (Max limit: 2,000 rows, 10MB)
          </p>
        </div>

        {selectedFile && (
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={resetImport} disabled={loadingPreview || committing}>
              Clear File
            </button>
            <button className="btn btn-primary" onClick={() => handlePreview(selectedFile)} disabled={loadingPreview}>
              {loadingPreview ? (
                <>
                  <RefreshCw size={16} className="spin" /> Parsing & Validating...
                </>
              ) : (
                'Re-parse File'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {previewData && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '50%', background: '#e0e7ff', color: '#3730a3' }}>
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Rows</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{previewData.summary.totalCount}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '50%', background: '#dcfce7', color: '#166534' }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Valid Rows</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>{previewData.summary.validCount}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '50%', background: '#fee2e2', color: '#991b1b' }}>
                <XCircle size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Error Rows</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#991b1b' }}>{previewData.summary.errorCount}</div>
              </div>
            </div>
          </div>

          {/* Action Header & Tabs */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                onClick={() => setActiveTab('all')}
              >
                All ({previewData.summary.totalCount})
              </button>
              <button
                className={`btn ${activeTab === 'valid' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                onClick={() => setActiveTab('valid')}
              >
                Valid Only ({previewData.summary.validCount})
              </button>
              <button
                className={`btn ${activeTab === 'errors' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                onClick={() => setActiveTab('errors')}
              >
                Errors Only ({previewData.summary.errorCount})
              </button>
            </div>

            {/* Submit Commit */}
            <button
              className="btn btn-primary"
              onClick={handleCommit}
              disabled={committing || previewData.summary.validCount === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {committing ? (
                <>
                  <RefreshCw size={16} className="spin" /> Importing...
                </>
              ) : (
                <>
                  <Send size={18} /> Import {previewData.summary.validCount} Valid Row(s)
                </>
              )}
            </button>
          </div>

          {/* Preview Table */}
          <div className="card">
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', background: 'var(--bg-muted, #f9fafb)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>Row #</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>Emp ID</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>Employee Name</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>Department</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>Designation</th>
                    <th style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>Validation Notes / Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No rows in this tab view.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((r) => (
                      <tr
                        key={r.rowNumber}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: r.isValid ? 'inherit' : '#fff5f5',
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.85rem' }}>
                          Row {r.rowNumber}
                        </td>

                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                          {r.isValid ? (
                            <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle size={12} /> Valid
                            </span>
                          ) : (
                            <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <AlertTriangle size={12} /> Error
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 500 }}>
                          {r.data.emp_id || '-'}
                        </td>

                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 500 }}>
                          {r.data.name || '-'}
                        </td>

                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                          {r.data.department || '-'}
                        </td>
                        
                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                          {r.data.designation || '-'}
                        </td>

                        <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: r.isValid ? 'var(--text-muted)' : '#dc2626' }}>
                          {r.isValid ? (
                            <span style={{ color: '#16a34a' }}>Ready to import</span>
                          ) : (
                            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                              {r.errors.map((err, idx) => (
                                <li key={idx}>{err}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ImportEmployees;
