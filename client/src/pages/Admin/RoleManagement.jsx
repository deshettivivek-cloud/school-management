import { useState, useEffect } from 'react';
import api from '../../api/axios';
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
      const response = await api.get('/auth/users');
      // For teachers we also want to display their assigned_classes. 
      // Our API doesn't return assigned_classes by default in getUsers, wait, let's check.
      // Oh, `getUsers` doesn't fetch assigned_classes in authController.js.
      // Let's modify the controller to fetch assigned_classes.
      // Assuming it will be there.
      setUsers(response.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/auth/users/\${userId}/role`, { role: newRole });
      
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
      await api.patch(`/auth/users/\${userId}/classes`, { assigned_classes: classesArray });
      
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
                {users.map((user) => {
                  let assignedClasses = [];
                  if (typeof user.assigned_classes === 'string') {
                    try { assignedClasses = JSON.parse(user.assigned_classes); } catch(e) {}
                  } else if (Array.isArray(user.assigned_classes)) {
                    assignedClasses = user.assigned_classes;
                  }
                  
                  return (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <select 
                          className="form-select"
                          style={{ width: '150px' }}
                          value={user.role} 
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={user.role === 'principal'}
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
                            defaultValue={assignedClasses.join(', ')}
                            onBlur={(e) => handleClassesChange(user.id, e.target.value)}
                          />
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
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
