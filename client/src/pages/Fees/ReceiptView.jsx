import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePrinter, HiOutlineDownload } from 'react-icons/hi';
import { format } from 'date-fns';
import { getImageUrl } from '../../utils/helpers';

const ReceiptView = () => {
  const { collectionId, paymentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const receiptRef = useRef();

  useEffect(() => {
    fetchData();
  }, [collectionId, paymentId]);

  const fetchData = async () => {
    try {
      const [receiptRes, schoolRes] = await Promise.all([
        api.get(`/fees/receipt/${collectionId}/${paymentId}`),
        api.get('/schools'),
      ]);
      setData(receiptRes.data.data);
      setSchool(schoolRes.data.data);
    } catch (error) {
      toast.error('Failed to load receipt');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = receiptRef.current;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Fee Receipt - ${data?.payment?.receiptNo}</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; padding: 2rem; color: #1a1a1a; }
            .receipt { max-width: 700px; margin: 0 auto; }
            .receipt-header { display: flex; align-items: center; gap: 1rem; border-bottom: 2px solid #1a1a1a; padding-bottom: 1rem; margin-bottom: 1.5rem; }
            .school-name { font-size: 1.5rem; font-weight: 800; }
            .school-info { font-size: 0.85rem; color: #666; }
            .receipt-title { text-align: center; font-size: 1.1rem; font-weight: 700; margin: 1rem 0; text-transform: uppercase; letter-spacing: 0.05em; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem; }
            .info-item { display: flex; }
            .info-label { font-weight: 600; min-width: 140px; }
            .info-value { color: #333; }
            .receipt-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px dashed #ccc; }
            .receipt-total { display: flex; justify-content: space-between; padding: 0.75rem 0; font-weight: 700; font-size: 1.1rem; border-top: 2px solid #1a1a1a; margin-top: 0.5rem; }
            .footer { margin-top: 3rem; display: flex; justify-content: space-between; font-size: 0.85rem; }
            .signature-line { border-top: 1px solid #1a1a1a; padding-top: 0.5rem; min-width: 200px; text-align: center; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return <div className="spinner-container"><div className="spinner" /></div>;
  }

  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🧾</div>
        <h3 className="empty-state-title">Receipt Not Found</h3>
      </div>
    );
  }

  const { student, payment, committedFee, totalPaid, balance } = data;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Fee Receipt</h1>
          <p>Receipt #{payment.receiptNo}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <HiOutlinePrinter /> Print Receipt
          </button>
        </div>
      </div>

      <div ref={receiptRef}>
        <div className="receipt-container">
          <div className="receipt">
            {/* Header */}
            <div className="receipt-header">
              {(school?.logo_url || school?.logo) && (
                <img src={getImageUrl(school.logo_url || school.logo)} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain' }} />
              )}
              <div>
                <div className="receipt-school-name">{school?.name || 'School'}</div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {school?.address && <span>{school.address}</span>}
                  {school?.phone && <span> • {school.phone}</span>}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, margin: '1rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fee Receipt
            </div>

            {/* Student Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <div><strong>Receipt No:</strong> {payment.receiptNo}</div>
              <div><strong>Date:</strong> {format(new Date(payment.date), 'dd MMM yyyy')}</div>
              <div><strong>Student:</strong> {student?.name}</div>
              <div><strong>Admission No:</strong> {student?.admission_no || student?.admissionNo}</div>
              <div><strong>Class:</strong> {student?.grade}{student?.section ? `-${student.section}` : ''}</div>
              <div><strong>Parent:</strong> {student?.parent_name || student?.parentName}</div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '1rem 0' }} />

            {/* Payment Details */}
            <div className="receipt-row">
              <span>Payment Mode</span>
              <span style={{ textTransform: 'capitalize' }}>{payment.mode?.replace('_', ' ')}</span>
            </div>
            <div className="receipt-row">
              <span>Committed Fee</span>
              <span>₹{committedFee?.toLocaleString('en-IN')}</span>
            </div>
            <div className="receipt-row">
              <span>Total Paid (including this)</span>
              <span>₹{totalPaid?.toLocaleString('en-IN')}</span>
            </div>
            <div className="receipt-row">
              <span>Remaining Balance</span>
              <span style={{ color: balance > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                ₹{balance?.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="receipt-total">
              <span>Amount Paid (This Receipt)</span>
              <span style={{ color: '#16a34a' }}>₹{payment.amount?.toLocaleString('en-IN')}</span>
            </div>

            {payment.remarks && (
              <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                <strong>Remarks:</strong> {payment.remarks}
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '0.5rem', minWidth: 200 }}>
                  Parent/Guardian Signature
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '0.5rem', minWidth: 200 }}>
                  Authorized Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptView;
