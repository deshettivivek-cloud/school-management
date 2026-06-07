import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlinePlus } from 'react-icons/hi';
import { format } from 'date-fns';
import PrintSection from '../../components/PrintSection';

const TcRegister = () => {
  const [tcs, setTcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTCs();
  }, []);

  const fetchTCs = async () => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await api.get(`/tc${params}`);
      setTcs(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch TCs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchTCs();
  };

  return (
    <PrintSection title="TC Register">
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>TC Register</h1>
          <p>All issued Transfer Certificates</p>
        </div>
        <Link to="/tc/issue" className="btn btn-primary">
          <HiOutlinePlus /> Issue TC
        </Link>
      </div>

      {/* Search */}
      <div className="filter-bar">
        <div className="search-bar" style={{ width: 320 }}>
          <HiOutlineSearch className="search-bar-icon" />
          <input
            id="tc-search"
            type="text"
            placeholder="Search by name, admission no, or TC no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="spinner-container"><div className="spinner" /></div>
        ) : tcs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <h3 className="empty-state-title">No Transfer Certificates</h3>
            <p className="empty-state-text">No TCs have been issued yet</p>
            <Link to="/tc/issue" className="btn btn-primary">
              <HiOutlinePlus /> Issue First TC
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>TC Number</th>
                  <th>Student Name</th>
                  <th>Admission No</th>
                  <th>Grade</th>
                  <th>Date of Leaving</th>
                  <th>Reason</th>
                  <th>Conduct</th>
                  <th>Issued By</th>
                  <th>Issued On</th>
                </tr>
              </thead>
              <tbody>
                {tcs.map((tc) => (
                  <tr key={tc._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-400)' }}>{tc.tcNumber}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{tc.student?.name}</td>
                    <td>{tc.student?.admissionNo}</td>
                    <td>Class {tc.student?.grade}</td>
                    <td>{tc.dateOfLeaving ? format(new Date(tc.dateOfLeaving), 'dd MMM yyyy') : '-'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tc.reason}
                    </td>
                    <td>
                      <span className={`badge ${tc.conduct === 'Excellent' ? 'badge-success' : tc.conduct === 'Good' ? 'badge-info' : 'badge-warning'}`}>
                        {tc.conduct}
                      </span>
                    </td>
                    <td>{tc.issuedBy?.name}</td>
                    <td>{tc.issuedDate ? format(new Date(tc.issuedDate), 'dd MMM yyyy') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </PrintSection>
  );
};

export default TcRegister;
