import { useState, useEffect } from 'react';
import api from '../../api/axios';
import supabase from '../../api/supabase';
import toast from 'react-hot-toast';
import PrintSection from '../../components/PrintSection';

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      toast.error('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success('Role updated successfully');
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      toast.error('Failed to update role');
      console.error(err);
    }
  };

  const handleClassesChange = async (userId, classesStr) => {
    const classesArray = classesStr.split(',').map(c => c.trim()).filter(c => c);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ assigned_classes: classesArray })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast.success('Classes updated successfully');
      setUsers(users.map(u => u.id === userId ? { ...u, assigned_classes: classesArray } : u));
    } catch (err) {
      toast.error('Failed to update classes');
      console.error(err);
    }
  };

  return (
    <PrintSection title="Role Management">
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-header-info">
          <h1>Role Management</h1>
          <p>Assign roles and class permissions to staff</p>
        </div>
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner-container"><div className="spinner" /></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Assigned Classes (Teachers)</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <select 
                        className="form-select"
                        style={{ width: '150px' }}
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={user.role === 'principal'} // Prevent accidentally downgrading self/other principals
                      >
                        <option value="principal">Principal</option>
                        <option value="clerk">Clerk</option>
                        <option value="teacher">Teacher</option>
                      </select>
                    </td>
                    <td>
                      {user.role === 'teacher' ? (
                        <input 
                          className="form-input"
                          type="text"
                          placeholder="e.g. 1, 2, LKG"
                          defaultValue={(user.assigned_classes || []).join(', ')}
                          onBlur={(e) => handleClassesChange(user.id, e.target.value)}
                        />
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    </PrintSection>
  );
};

export default RoleManagement;
