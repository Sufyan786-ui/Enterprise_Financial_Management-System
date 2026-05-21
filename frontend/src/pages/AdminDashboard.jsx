import React, { useState, useEffect } from 'react';
import { Users, Building2, UserPlus, Plus, X, AlertTriangle, RefreshCw } from 'lucide-react';
import './AdminDashboard.css';

const API_BASE_URL = 'http://localhost:8080/admin';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({ fullname: '', role: 'User', department: '', email: '' });
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');

  // Fetch departments and users from backend
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users and departments concurrently
      const [usersRes, deptsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users`),
        fetch(`${API_BASE_URL}/depts`)
      ]);

      if (!usersRes.ok || !deptsRes.ok) {
        throw new Error('Failed to fetch data from database');
      }

      const usersData = await usersRes.json();
      const deptsData = await deptsRes.json();

      setUsers(usersData);
      
      // Filter unique departments by name to prevent duplicate keys or dropdown options
      const uniqueDepts = [];
      const seen = new Set();
      for (const d of deptsData) {
        if (d.department_name && !seen.has(d.department_name)) {
          seen.add(d.department_name);
          uniqueDepts.push(d);
        }
      }
      setDepartments(uniqueDepts);

      // Pre-select first department if available
      if (uniqueDepts.length > 0) {
        setNewUser(prev => ({ ...prev, department: uniqueDepts[0].department_name }));
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server. Please make sure your Spring Boot backend is running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.fullname || !newUser.email) return;

    try {
      const selectedDept = newUser.department || departments[0]?.department_name || 'Engineering';
      
      const response = await fetch(`${API_BASE_URL}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullname: newUser.fullname,
          role: newUser.role,
          email: newUser.email,
          department_name: selectedDept
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add user to database');
      }

      // Refresh data
      await fetchInitialData();
      
      // Reset form
      setNewUser({
        fullname: '',
        role: 'User',
        department: departments[0]?.department_name || '',
        email: ''
      });
      setIsUserModalOpen(false);
    } catch (err) {
      alert('Error adding user: ' + err.message);
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName) return;

    try {
      const response = await fetch(`${API_BASE_URL}/add/dept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          department_name: newDeptName,
          description: newDeptDesc
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create department');
      }

      // Refresh data
      await fetchInitialData();

      // Reset form
      setNewDeptName('');
      setNewDeptDesc('');
      setIsDeptModalOpen(false);
    } catch (err) {
      alert('Error creating department: ' + err.message);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="animate-spin text-primary" size={48} />
        <p className="text-muted">Loading enterprise database...</p>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="glass-panel flex flex-col items-center justify-center max-w-xl mx-auto mt-10 p-8 text-center animate-fade-in">
        <AlertTriangle className="text-warning mb-4" size={48} />
        <h2 className="mb-2">Backend Connection Offline</h2>
        <p className="text-muted mb-6">{error}</p>
        <button className="glow-btn flex items-center gap-2" onClick={fetchInitialData}>
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header flex justify-between items-center mb-6">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="text-muted">Manage your enterprise users and departments in real-time.</p>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-warning bg-warning/10 px-3 py-1.5 rounded-md border border-warning/20 text-small">
            <AlertTriangle size={16} />
            <span>Connection offline. Displaying stale data.</span>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-header mb-4">
            <div className="stat-icon" style={{color: 'var(--primary)', background: 'rgba(56,189,248,0.1)'}}>
              <Users size={24} />
            </div>
            <button className="glow-btn-outline" onClick={() => setIsUserModalOpen(true)}>
              <UserPlus size={16} className="mr-2" /> Add User
            </button>
          </div>
          <div className="stat-info">
            <span className="text-muted text-small">Total Managed Users</span>
            <h2>{users.length}</h2>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-header mb-4">
            <div className="stat-icon" style={{color: '#a855f7', background: 'rgba(168,85,247,0.1)'}}>
              <Building2 size={24} />
            </div>
            <button className="glow-btn-outline" onClick={() => setIsDeptModalOpen(true)}>
              <Plus size={16} className="mr-2" /> Create Dept
            </button>
          </div>
          <div className="stat-info">
            <span className="text-muted text-small">Total Departments</span>
            <h2>{departments.length}</h2>
          </div>
        </div>
      </div>

      {/* Recently Added Users Section (Preview) */}
      <div className="glass-panel mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Active Enterprise Users</h3>
          <button onClick={fetchInitialData} className="text-muted hover:text-primary transition-colors p-1" title="Reload Database">
            <RefreshCw size={16} />
          </button>
        </div>
        {users.length === 0 ? (
          <p className="text-muted py-4">No users found in database. Click 'Add User' to populate.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const deptName = u.department && typeof u.department === 'object' 
                  ? u.department.department_name 
                  : (u.department || 'Unassigned');
                return (
                  <tr key={u.user_id || u.id}>
                    <td className="font-medium">{u.fullname}</td>
                    <td className="text-muted text-small">{u.email || 'N/A'}</td>
                    <td>
                      <span className={`badge ${u.role === 'Manager' ? 'badge-warning' : 'badge-primary'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{deptName}</td>
                    <td>
                      <span className="badge badge-success">
                        {u.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {isUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="icon-btn close-btn" onClick={() => setIsUserModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" placeholder="John Doe" 
                  value={newUser.fullname} onChange={e => setNewUser({...newUser, fullname: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" placeholder="john.doe@company.com" 
                  value={newUser.email || ''} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="User">User</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-control" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})}>
                  {departments.length === 0 && <option value="">No departments available</option>}
                  {departments.map(d => <option key={d.department_id || d.id} value={d.department_name}>{d.department_name}</option>)}
                </select>
              </div>
              <div className="flex justify-end mt-6">
                <button type="submit" className="glow-btn">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Department Modal */}
      {isDeptModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create Department</h2>
              <button className="icon-btn close-btn" onClick={() => setIsDeptModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddDepartment}>
              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input type="text" className="form-control" placeholder="e.g. IT, Finance" 
                  value={newDeptName} onChange={e => setNewDeptName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" style={{ minHeight: '100px', resize: 'vertical' }} placeholder="Provide a brief description of the department's responsibilities" 
                  value={newDeptDesc} onChange={e => setNewDeptDesc(e.target.value)} />
              </div>
              <div className="flex justify-end mt-6">
                <button type="submit" className="glow-btn">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
