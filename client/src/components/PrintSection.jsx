import { useRef } from 'react';
import { Printer } from 'lucide-react';

const PrintSection = ({ children, title = 'Section' }) => {
  const contentRef = useRef();

  const handlePrint = () => {
    const content = contentRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title} — Print</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              color: #1a1a1a;
              padding: 1.5rem;
              line-height: 1.6;
              background: white;
            }
            h1, h2, h3, h4, h5, h6 {
              font-family: 'Outfit', 'Inter', sans-serif;
              font-weight: 700;
              color: #0f172a;
            }
            .print-title {
              font-size: 1.35rem;
              font-weight: 800;
              margin-bottom: 1.25rem;
              padding-bottom: 0.75rem;
              border-bottom: 2px solid #0f172a;
              color: #0f172a;
            }
            table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
            th {
              background: #f1f5f9;
              padding: 0.65rem 0.85rem;
              font-size: 0.75rem;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              text-align: left;
              color: #475569;
              border-bottom: 2px solid #e2e8f0;
            }
            td {
              padding: 0.6rem 0.85rem;
              font-size: 0.85rem;
              border-bottom: 1px solid #e2e8f0;
              color: #334155;
            }
            .card { margin-bottom: 1rem; }
            .stat-grid { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
            .stat-card { flex: 1; min-width: 180px; padding: 0.85rem; border: 1px solid #e2e8f0; border-radius: 8px; }
            .stat-label { font-size: 0.75rem; color: #64748b; }
            .stat-value { font-size: 1.35rem; font-weight: 800; color: #0f172a; }
            .badge {
              display: inline-block;
              padding: 0.2rem 0.5rem;
              border-radius: 4px;
              font-size: 0.7rem;
              font-weight: 600;
              background: #f1f5f9;
              color: #475569;
            }
            .filter-bar, .search-bar, .btn, .sidebar, .header,
            .page-header-actions, .modal-overlay, .no-print { display: none !important; }
            .page-header { margin-bottom: 1rem; }
            .page-header h1 { font-size: 1.2rem; }
            .page-header p { font-size: 0.85rem; color: #64748b; }
            img { max-width: 100px; }
            @media print {
              body { padding: 0; }
              .print-title { break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="print-title">${title}</div>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  return (
    <div>
      <div ref={contentRef}>
        {children}
      </div>
      <div className="print-section-footer no-print">
        <button className="btn btn-secondary btn-icon" onClick={handlePrint} title="Print Page" style={{ marginBottom: '1rem' }}>
          <Printer size={20} />
        </button>
      </div>
    </div>
  );
};

export default PrintSection;
