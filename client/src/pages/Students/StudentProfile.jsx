import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import ProfileShell from '../../components/Profile/ProfileShell';
import Timeline from '../../components/Profile/Timeline';
import { 
  HiOutlineUser, HiOutlineCalendar, HiOutlineCurrencyRupee, 
  HiOutlineAcademicCap, HiOutlineBookOpen, HiOutlineBadgeCheck, 
  HiOutlineDocumentText, HiOutlineClock 
} from 'react-icons/hi';
import StatCard from '../../components/Common/StatCard';

const PersonalTab = ({ student }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
    <div className="card">
      <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Personal Details</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div><label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Date of Birth</label><div style={{ fontWeight: 500 }}>{student.dob}</div></div>
        <div><label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Gender</label><div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{student.gender}</div></div>
        <div><label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Blood Group</label><div style={{ fontWeight: 500 }}>{student.blood_group || 'N/A'}</div></div>
        <div><label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Aadhar No</label><div style={{ fontWeight: 500 }}>{student.aadhar_no || 'N/A'}</div></div>
        <div style={{ gridColumn: 'span 2' }}><label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Address</label><div style={{ fontWeight: 500 }}>{student.address || 'N/A'}</div></div>
      </div>
    </div>
    <div className="card">
      <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Parents / Guardians</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div><label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Father's Name</label><div style={{ fontWeight: 500 }}>{student.parent_name}</div></div>
        <div><label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Phone</label><div style={{ fontWeight: 500 }}>{student.parent_phone}</div></div>
        <div><label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Mother's Name</label><div style={{ fontWeight: 500 }}>{student.mother_name || 'N/A'}</div></div>
        <div><label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Mother's Phone</label><div style={{ fontWeight: 500 }}>{student.mother_phone || 'N/A'}</div></div>
        <div style={{ gridColumn: 'span 2' }}><label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Primary Email</label><div style={{ fontWeight: 500 }}>{student.parent_email || 'N/A'}</div></div>
      </div>
    </div>
  </div>
);

const AttendanceTab = ({ studentId }) => {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get(`/attendance/stats/${studentId}`).then(res => {
      setData(res.data.data);
    }).catch(err => {
      console.error(err);
      setData({ total: 0, present: 0, percentage: 0, records: [] });
    });
  }, [studentId]);

  if (!data) return <div className="skeleton-loader" style={{ height: '200px' }} />;
  return (
    <div>
      <div className="stat-grid">
        <StatCard title="Overall Attendance" value={`${data.percentage}%`} color={data.percentage > 75 ? 'green' : 'red'} hideDelta={true} />
        <StatCard title="Days Present" value={data.present} color="blue" hideDelta={true} />
        <StatCard title="Total Working Days" value={data.total} color="amber" hideDelta={true} />
      </div>
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h4 style={{ marginBottom: '1rem' }}>Recent Records</h4>
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {data.records.slice(0, 5).map(r => (
                <tr key={r.date}>
                  <td>{r.date}</td>
                  <td><span className={`badge badge-${r.status === 'present' ? 'success' : 'danger'}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FeesTab = ({ studentId }) => {
  const [fees, setFees] = useState(null);
  useEffect(() => {
    api.get(`/fees/history/${studentId}`).then(res => {
      setFees(res.data.data || []);
    }).catch(err => {
      console.error(err);
      setFees([]);
    });
  }, [studentId]);

  if (!fees) return <div className="skeleton-loader" style={{ height: '200px' }} />;
  if (fees.length === 0) return <div className="empty-state">No fee records found.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {fees.map(fee => (
        <div key={fee.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0 }}>Academic Year: {fee.academic_year}</h4>
            <span className={`badge badge-${fee.status === 'paid' ? 'success' : fee.status === 'pending' ? 'warning' : 'danger'}`}>
              {fee.status.toUpperCase()}
            </span>
          </div>
          <div className="stat-grid">
            <StatCard title="Committed Fee" value={fee.committed_fee} formatValue={(v) => `₹${v}`} color="blue" hideDelta={true} />
            <StatCard title="Total Paid" value={fee.total_paid} formatValue={(v) => `₹${v}`} color="green" hideDelta={true} />
            <StatCard title="Balance" value={fee.balance} formatValue={(v) => `₹${v}`} color="red" hideDelta={true} />
          </div>
        </div>
      ))}
    </div>
  );
};

const MarksTab = ({ studentId }) => {
  const [marks, setMarks] = useState(null);
  useEffect(() => {
    api.get(`/students/${studentId}/marks`).then(res => {
      setMarks(res.data.data || []);
    }).catch(err => {
      console.error(err);
      setMarks([]);
    });
  }, [studentId]);

  if (!marks) return <div className="skeleton-loader" style={{ height: '200px' }} />;
  if (marks.length === 0) return <div className="empty-state">No marks found.</div>;

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr><th>Exam</th><th>Term</th><th>Subject</th><th>Marks</th><th>Grade</th></tr>
        </thead>
        <tbody>
          {marks.map(m => (
            <tr key={m.id}>
              <td>{m.exams?.name}</td>
              <td>{m.exams?.term}</td>
              <td>{m.subject}</td>
              <td>{m.marks_obtained} / {m.max_marks}</td>
              <td><span className="badge badge-primary">{m.grade}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const TimelineTab = ({ studentId }) => {
  const [events, setEvents] = useState(null);
  useEffect(() => {
    api.get(`/students/${studentId}/timeline`).then(res => {
      setEvents(res.data.data?.map(log => ({
        date: log.created_at,
        title: log.action,
        description: `Resource: ${log.resource_type}`,
        color: 'blue'
      })) || []);
    }).catch(err => {
      console.error(err);
      setEvents([]);
    });
  }, [studentId]);

  if (!events) return <div className="skeleton-loader" style={{ height: '200px' }} />;
  return <Timeline events={events} />;
};

const StudentProfile = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await api.get(`/students/${id}`);
        setStudent(res.data.data);
      } catch (err) {
        console.error('Failed to fetch student:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id]);

  if (loading) return <div className="skeleton-loader" style={{ height: '100vh' }} />;
  if (!student) return <div className="empty-state">Student not found</div>;

  const headerConfig = {
    photoUrl: student.photo_url,
    title: student.name,
    subtitle: `Class ${student.grade} ${student.section ? `- ${student.section}` : ''} | Roll No: ${student.admission_no}`,
    badges: [
      { label: student.admission_status, color: student.admission_status === 'confirmed' ? 'success' : 'warning' },
      { label: student.is_active ? 'Active' : 'Inactive', color: student.is_active ? 'primary' : 'neutral' }
    ]
  };

  const tabsConfig = [
    { id: 'personal', label: 'Personal', icon: HiOutlineUser, component: <PersonalTab student={student} /> },
    { id: 'attendance', label: 'Attendance', icon: HiOutlineCalendar, component: <AttendanceTab studentId={student.id} /> },
    { id: 'fees', label: 'Fees', icon: HiOutlineCurrencyRupee, component: <FeesTab studentId={student.id} />, allowedRoles: ['super_admin', 'principal', 'clerk'] },
    { id: 'marks', label: 'Marks', icon: HiOutlineAcademicCap, component: <MarksTab studentId={student.id} /> },
    { id: 'homework', label: 'Homework', icon: HiOutlineBookOpen, component: <div className="empty-state">Homework module coming soon.</div> },
    { id: 'certificates', label: 'Certificates', icon: HiOutlineBadgeCheck, component: <div className="empty-state">No certificates issued yet.</div> },
    { id: 'documents', label: 'Documents', icon: HiOutlineDocumentText, component: <div className="empty-state">No documents uploaded.</div> },
    { id: 'timeline', label: 'Timeline', icon: HiOutlineClock, component: <TimelineTab studentId={student.id} /> }
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <ProfileShell header={headerConfig} tabs={tabsConfig} />
    </div>
  );
};

export default StudentProfile;
