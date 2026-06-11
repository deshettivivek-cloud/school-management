import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { HiOutlinePrinter, HiOutlineArrowLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

const BlankAdmissionForm = () => {
  const [school, setSchool] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const res = await api.get('/schools');
        setSchool(res.data.data);
      } catch (err) {
        console.error('Failed to fetch school details');
      }
    };
    fetchSchool();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/admissions')}>
          <HiOutlineArrowLeft /> Back
        </button>
        <button className="btn btn-primary" onClick={handlePrint}>
          <HiOutlinePrinter /> Print Form
        </button>
      </div>

      <div className="printable-form-container">
        {/* The Border Container */}
        <div className="printable-border">
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '2px solid #000' }}>
            <div style={{ width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {school?.logo_url ? (
                <img src={school.logo_url} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#eee', border: '1px solid #ccc' }} />
              )}
            </div>
            
            <div style={{ flex: 1, textAlign: 'center', padding: '0 1rem' }}>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '4px', margin: 0, textTransform: 'uppercase' }}>
                {school?.name || 'YOUR SCHOOL NAME'}
              </h1>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0' }}>
                ( SCHOOL FOR PLAY GROUP TO STD: - VIII )
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                ( An ISO Certified Organization 9001-2015 )
              </div>
            </div>

            <div style={{ width: '100px', textAlign: 'center' }}>
              {/* Optional ISO Logo Placeholder */}
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f8cc46', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', marginLeft: 'auto' }}>
                ISO 9001<br/>CERTIFIED
              </div>
            </div>
          </div>

          <h2 style={{ textAlign: 'center', textDecoration: 'underline', fontSize: '1.4rem', margin: '1.5rem 0 1rem' }}>
            APPLICATION FORM FOR ADMISSION
          </h2>

          <p style={{ fontSize: '1.05rem', lineHeight: '1.5', marginBottom: '2rem' }}>
            Please uses this form to apply for your child's admission to our school. We need complete & accurate information about the student. So make sure you fill out all fields.
          </p>

          {/* Form Fields & Photo */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            
            {/* Left Fields */}
            <div style={{ flex: 1 }}>
              <div className="print-field-row">
                <div className="print-label">1. Name of the pupil</div>
                <div className="print-colon">:</div>
                <div className="print-line"></div>
              </div>
              
              <div className="print-field-row">
                <div className="print-label">2. Date Of Birth</div>
                <div className="print-colon">:</div>
                <div className="print-line"></div>
              </div>

              <div className="print-field-row">
                <div className="print-label">3. Adhar Card No</div>
                <div className="print-colon">:</div>
                <div className="print-line"></div>
              </div>

              <div className="print-field-row">
                <div className="print-label">4. Mother's Tongue</div>
                <div className="print-colon">:</div>
                <div className="print-line"></div>
              </div>

              <div className="print-field-row">
                <div className="print-label">5. Name of the Father / Guardian</div>
                <div className="print-colon">:</div>
                <div className="print-line"></div>
              </div>

              <div className="print-field-row">
                <div className="print-label">6. Name of the Mother / Guardian</div>
                <div className="print-colon">:</div>
                <div className="print-line"></div>
              </div>
            </div>

            {/* Right Photo Box */}
            <div style={{ width: '150px', marginLeft: '1rem' }}>
              <div style={{ width: '140px', height: '170px', border: '2px solid #000', marginTop: '10px' }}></div>
            </div>

          </div>

          {/* Full Width Fields */}
          <div className="print-field-row" style={{ marginTop: '1.5rem', alignItems: 'flex-start' }}>
            <div className="print-label">7. Present Address</div>
            <div className="print-colon">:</div>
            <div style={{ flex: 1 }}>
              <div className="print-line" style={{ marginBottom: '1.5rem' }}></div>
              <div className="print-line" style={{ marginBottom: '1.5rem' }}></div>
              <div className="print-line"></div>
            </div>
          </div>

          <div className="print-field-row" style={{ marginTop: '1.5rem', alignItems: 'flex-start' }}>
            <div className="print-label">8. Permanent Address</div>
            <div className="print-colon">:</div>
            <div style={{ flex: 1 }}>
              <div className="print-line" style={{ marginBottom: '1.5rem' }}></div>
              <div className="print-line" style={{ marginBottom: '1.5rem' }}></div>
              <div className="print-line"></div>
            </div>
          </div>

          <div className="print-field-row" style={{ marginTop: '1.5rem' }}>
            <div className="print-label">9. Phone No.</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', marginLeft: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '80px', fontWeight: 600 }}>Father :</div>
                <div className="print-line"></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '80px', fontWeight: 600 }}>Mother :</div>
                <div className="print-line"></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '80px', fontWeight: 600 }}>Guardian :</div>
                <div className="print-line"></div>
              </div>
            </div>
          </div>

          <div className="print-field-row" style={{ marginTop: '1.5rem', alignItems: 'center' }}>
            <div className="print-label">10. Occupation of Father/Mother<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Guardian ( ✓ )</div>
            <div className="print-colon">:</div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ border: '1px solid #000', padding: '5px 20px', minWidth: '100px', textAlign: 'center' }}>Service</div>
              <div style={{ border: '1px solid #000', padding: '5px 20px', minWidth: '100px', textAlign: 'center' }}>Profession</div>
              <div style={{ border: '1px solid #000', padding: '5px 20px', minWidth: '100px', textAlign: 'center' }}>Business</div>
            </div>
          </div>

          <div className="print-field-row" style={{ marginTop: '1.5rem' }}>
            <div className="print-label" style={{ width: '280px' }}>11. A brief about Occupation- Father</div>
            <div className="print-colon">:</div>
            <div className="print-line"></div>
          </div>
          <div className="print-field-row" style={{ marginTop: '1rem' }}>
            <div className="print-label" style={{ width: '280px', textAlign: 'right', paddingRight: '10px' }}>Mother</div>
            <div className="print-colon">:</div>
            <div className="print-line"></div>
          </div>

          <div style={{ textAlign: 'right', fontWeight: 700, marginTop: '3rem', fontSize: '1.1rem' }}>
            Contd. - page 2
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .printable-form-container {
          background: white;
          color: black;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 10mm;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .printable-border {
          border: 12px solid transparent;
          border-image: repeating-linear-gradient(45deg, #000 0, #000 2px, #fff 2px, #fff 8px) 12;
          padding: 2rem;
          height: 100%;
          min-height: calc(297mm - 20mm);
          box-sizing: border-box;
          background: #fdfdf9;
        }

        .print-field-row {
          display: flex;
          align-items: flex-end;
          margin-bottom: 1.2rem;
          font-size: 1.05rem;
          font-weight: 600;
        }

        .print-label {
          width: 260px;
          flex-shrink: 0;
        }

        .print-colon {
          width: 20px;
          text-align: center;
          flex-shrink: 0;
        }

        .print-line {
          flex: 1;
          border-bottom: 1px solid #000;
          height: 1.5rem;
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white !important;
          }
          .printable-form-container {
            width: 100%;
            height: 100%;
            padding: 10mm;
            box-shadow: none;
            margin: 0;
          }
          .printable-border {
            border: 12px solid #000;
            border-image: repeating-linear-gradient(45deg, #000 0, #000 2px, #fff 2px, #fff 8px) 12;
          }
          .no-print {
            display: none !important;
          }
          #root {
            padding: 0 !important;
          }
        }
      `}} />
    </div>
  );
};

export default BlankAdmissionForm;
