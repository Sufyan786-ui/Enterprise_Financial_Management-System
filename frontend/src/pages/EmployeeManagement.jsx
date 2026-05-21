import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Trash2, 
  Filter, 
  RefreshCw, 
  Users, 
  UserX,
  Plus,
  AlertCircle
} from 'lucide-react';
import './EmployeeManagement.css';

const API_BASE_URL = 'http://localhost:8080/admin';

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, deptsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users`),
        fetch(`${API_BASE_URL}/depts`)
      ]);

      if (!usersRes.ok || !deptsRes.ok) {
        throw new Error('Failed to retrieve enterprise records.');
      }

      const usersData = await usersRes.json();
      const deptsData = await deptsRes.json();

      setUsers(usersData);
      
      // Extract unique department names
      const uniqueDepts = [];
      const seen = new Set();
      for (const d of deptsData) {
        if (d.department_name && !seen.has(d.department_name)) {
          seen.add(d.department_name);
          uniqueDepts.push(d);
        }
      }
      setDepartments(uniqueDepts);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server. Please verify your Spring Boot backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Delete User handler
  const handleDeleteUser = async (id, name) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/delete/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee.');
      }

      // Refresh records
      await fetchData();
      alert('Employee deleted successfully.');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedRole('All');
    setSelectedDept('All');
  };

  // Filtered lists logic
  const filteredUsers = users.filter(user => {
    // 1. Search term match (Name or Email)
    const nameMatch = user.fullname?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const searchMatch = nameMatch || emailMatch;

    // 2. Role filter match
    let roleMatch = true;
    if (selectedRole !== 'All') {
      if (selectedRole === 'Employee') {
        roleMatch = user.role?.toLowerCase() === 'user';
      } else {
        roleMatch = user.role?.toLowerCase() === selectedRole.toLowerCase();
      }
    }

    // 3. Department filter match
    let deptMatch = true;
    if (selectedDept !== 'All') {
      const userDeptName = user.department && typeof user.department === 'object' 
        ? user.department.department_name 
        : user.department;
      deptMatch = userDeptName?.toLowerCase() === selectedDept.toLowerCase();
    }

    return searchMatch && roleMatch && deptMatch;
  });

  return (
    <div className="employee-page animate-fade-in">
      {/* Header Panel */}
      <div className="employee-header flex justify-between items-center mb-6">
        <div>
          <button 
            onClick={() => navigate('/')} 
            className="back-btn flex items-center gap-2 text-muted hover:text-primary transition-colors mb-2 font-medium"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1>Enterprise Directory</h1>
          <p className="text-muted">Search, filter, and manage all registered employees and system administrators.</p>
        </div>
        <button 
          onClick={fetchData} 
          className="glow-btn-outline flex items-center gap-2"
          title="Refresh Directory"
        >
          <RefreshCw size={16} /> Reload Directory
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid mb-6">
        <div className="stat-card glass-panel">
          <div className="stat-header">
            <span className="text-muted text-small font-medium">Total Registered</span>
            <div className="stat-icon" style={{color: 'var(--primary)', background: 'rgba(56,189,248,0.1)'}}>
              <Users size={18} />
            </div>
          </div>
          <h2>{users.length}</h2>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-header">
            <span className="text-muted text-small font-medium">Currently Displaying</span>
            <span className="badge badge-primary">{filteredUsers.length} matched</span>
          </div>
          <h2>{filteredUsers.length}</h2>
        </div>
      </div>

      {/* Search & Filters Controls Container */}
      <div className="glass-panel filter-panel mb-6">
        <div className="filter-grid">
          {/* Text Search input */}
          <div className="form-group search-group">
            <label className="form-label">Search Employees</label>
            <div className="search-input-wrapper">
              <Search className="search-icon text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                className="form-control pl-10" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Role selector filter */}
          <div className="form-group">
            <label className="form-label">Role</label>
            <select 
              className="form-control" 
              value={selectedRole} 
              onChange={e => setSelectedRole(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          {/* Department selector filter */}
          <div className="form-group">
            <label className="form-label">Department</label>
            <select 
              className="form-control" 
              value={selectedDept} 
              onChange={e => setSelectedDept(e.target.value)}
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d.department_id || d.id} value={d.department_name}>
                  {d.department_name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters action */}
          <div className="flex items-end">
            <button 
              type="button" 
              className="glow-btn-outline reset-btn w-full flex items-center justify-center gap-2 py-2.5"
              onClick={handleResetFilters}
              disabled={searchTerm === '' && selectedRole === 'All' && selectedDept === 'All'}
            >
              <Filter size={16} /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Records Table or Empty State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-4">
          <RefreshCw className="animate-spin text-primary" size={36} />
          <p className="text-muted text-small">Fetching directory records...</p>
        </div>
      ) : error ? (
        <div className="glass-panel flex flex-col items-center justify-center max-w-xl mx-auto p-8 text-center">
          <AlertCircle className="text-danger mb-4" size={48} />
          <h2 className="mb-2">Network Error</h2>
          <p className="text-muted mb-6">{error}</p>
          <button className="glow-btn" onClick={fetchData}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      ) : filteredUsers.length === 0 ? (
        /* Empty State */
        <div className="glass-panel empty-state flex flex-col items-center justify-center text-center p-12">
          <div className="empty-icon-wrapper mb-4">
            <UserX size={48} className="text-muted" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No Matching Employees</h3>
          <p className="text-muted max-w-md mb-6">
            We couldn't find any employees matching your current search term or filter parameters. Try clearing your filters or searching for someone else.
          </p>
          <button className="glow-btn flex items-center gap-2" onClick={handleResetFilters}>
            Clear Search & Filters
          </button>
        </div>
      ) : (
        /* Employees List Table */
        <div className="glass-panel table-panel">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const deptName = user.department && typeof user.department === 'object' 
                    ? user.department.department_name 
                    : (user.department || 'Unassigned');
                  
                  const formattedDate = user.created_at || user.created 
                    ? new Date(user.created_at || user.created).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'N/A';

                  return (
                    <tr key={user.user_id || user.id} className="hover-row">
                      <td className="font-semibold text-main">{user.fullname}</td>
                      <td className="text-muted text-small">{user.email || 'N/A'}</td>
                      <td>
                        <span className={`badge ${user.role === 'Manager' ? 'badge-warning' : 'badge-primary'}`}>
                          {user.role === 'User' ? 'Employee' : user.role}
                        </span>
                      </td>
                      <td className="text-main font-medium">{deptName}</td>
                      <td>
                        <span className="badge badge-success">
                          {user.status || 'Active'}
                        </span>
                      </td>
                      <td className="text-muted text-small">{formattedDate}</td>
                      <td className="text-right">
                        <button 
                          className="delete-action-btn hover:text-danger transition-colors p-1.5"
                          onClick={() => handleDeleteUser(user.user_id || user.id, user.fullname)}
                          title={`Delete ${user.fullname}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
