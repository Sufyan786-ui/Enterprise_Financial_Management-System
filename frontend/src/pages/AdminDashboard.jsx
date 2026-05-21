import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  UserPlus, 
  Plus, 
  X, 
  AlertTriangle, 
  RefreshCw, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Download, 
  Copy,
  ArrowRight
} from 'lucide-react';
import './AdminDashboard.css';

const API_BASE_URL = 'http://localhost:8080/admin';

const AdminDashboard = () => {
  const navigate = useNavigate();
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

  // CSV Bulk Upload States
  const [activeTab, setActiveTab] = useState('single');
  const [selectedFile, setSelectedFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Reset CSV States
  const resetCsvState = () => {
    setSelectedFile(null);
    setCsvData([]);
    setCsvErrors([]);
    setIsDragOver(false);
  };

  // Close User Modal and clean up states
  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setActiveTab('single');
    resetCsvState();
  };


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

  const processCSVFile = (file) => {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setCsvErrors(['Only CSV files (.csv) are supported. Please select a valid CSV file.']);
      setSelectedFile(file);
      setCsvData([]);
      return;
    }

    setSelectedFile(file);
    setCsvErrors([]);
    setCsvData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/);

      if (lines.length === 0 || !lines[0].trim()) {
        setCsvErrors(['The CSV file is empty.']);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['fullname', 'email', 'role', 'department_name'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        setCsvErrors([
          `Invalid CSV headers. Missing: ${missingHeaders.join(', ')}.`,
          `Expected columns: fullname, email, role, department_name`
        ]);
        return;
      }

      const nameIdx = headers.indexOf('fullname');
      const emailIdx = headers.indexOf('email');
      const roleIdx = headers.indexOf('role');
      const deptIdx = headers.indexOf('department_name');

      const rows = [];
      const rowErrors = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const row = [];
        let insideQuote = false;
        let token = '';
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            row.push(token.trim());
            token = '';
          } else {
            token += char;
          }
        }
        row.push(token.trim());

        const cleanRow = row.map(cell => cell.replace(/^"|"$/g, ''));

        if (cleanRow.length < requiredHeaders.length) {
          rowErrors.push(`Row ${i + 1}: Missing fields. Expected at least ${requiredHeaders.length} columns.`);
          continue;
        }

        const fullname = cleanRow[nameIdx];
        const email = cleanRow[emailIdx];
        let role = cleanRow[roleIdx] || 'User';
        const department_name = cleanRow[deptIdx];

        if (role.toLowerCase() === 'manager') role = 'Manager';
        else role = 'User';

        const errors = [];
        if (!fullname) errors.push('Name is required.');
        if (!email) {
          errors.push('Email is required.');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('Email is invalid.');
        }
        if (!department_name) errors.push('Department name is required.');

        if (errors.length > 0) {
          rowErrors.push(`Row ${i + 1}: ${errors.join(' ')}`);
        } else {
          rows.push({ fullname, email, role, department_name });
        }
      }

      if (rows.length === 0 && rowErrors.length === 0) {
        setCsvErrors(['No data records found in the CSV.']);
      } else {
        setCsvData(rows);
        setCsvErrors(rowErrors);
      }
    };

    reader.onerror = () => {
      setCsvErrors(['Error reading file. Please try again.']);
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processCSVFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "fullname,email,role,department_name\n"
      + "Alice Smith,alice.smith@company.com,Manager,Engineering\n"
      + "Bob Jones,bob.jones@company.com,User,Finance\n"
      + "Charlie Brown,charlie.brown@company.com,User,Marketing";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employee_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTemplate = () => {
    const text = "fullname,email,role,department_name\nAlice Smith,alice.smith@company.com,Manager,Engineering\nBob Jones,bob.jones@company.com,User,Finance";
    navigator.clipboard.writeText(text);
    alert('CSV Template format copied to clipboard!');
  };

  const handleCsvSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || csvErrors.length > 0 || csvData.length === 0) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_BASE_URL}/upload-csv`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errMsg = await response.text();
        throw new Error(errMsg || 'Failed to upload CSV file');
      }

      await fetchInitialData();
      resetCsvState();
      setIsUserModalOpen(false);
      alert('Bulk employees imported successfully!');
    } catch (err) {
      alert('Error uploading CSV file: ' + err.message);
    } finally {
      setIsUploading(false);
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
          <div className="stat-info cursor-pointer" onClick={() => navigate('/employees')} style={{ cursor: 'pointer' }}>
            <span className="text-muted text-small hover:text-primary transition-colors flex items-center gap-1">
              Total Managed Users <ArrowRight size={12} />
            </span>
            <h2 className="hover:text-primary transition-colors">{users.length}</h2>
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
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/employees')}>
              Active Enterprise Users
            </h3>
            <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>Preview</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/employees" className="text-small text-primary hover:underline flex items-center gap-1 font-semibold">
              View Directory <ArrowRight size={12} />
            </Link>
            <button onClick={fetchInitialData} className="text-muted hover:text-primary transition-colors p-1" title="Reload Database">
              <RefreshCw size={16} />
            </button>
          </div>
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
              <button className="icon-btn close-btn" onClick={closeUserModal}>
                <X size={24} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="modal-tabs flex gap-4 mb-4 border-b border-border-light pb-2">
              <button
                type="button"
                className={`tab-btn pb-1 px-1 font-semibold text-small transition-all border-b-2 ${activeTab === 'single' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('single');
                  resetCsvState();
                }}
              >
                Single User
              </button>
              <button
                type="button"
                className={`tab-btn pb-1 px-1 font-semibold text-small transition-all border-b-2 ${activeTab === 'bulk' ? 'active' : ''}`}
                onClick={() => setActiveTab('bulk')}
              >
                Bulk CSV Upload
              </button>
            </div>

            {/* Manual Single Entry Form */}
            {activeTab === 'single' && (
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
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" className="glow-btn-outline text-small py-2 px-4" onClick={closeUserModal}>
                    Cancel
                  </button>
                  <button type="submit" className="glow-btn text-small py-2 px-4">
                    Add User
                  </button>
                </div>
              </form>
            )}

            {/* Bulk CSV Upload Form */}
            {activeTab === 'bulk' && (
              <form onSubmit={handleCsvSubmit}>
                {!selectedFile ? (
                  <div 
                    className={`drag-drop-zone ${isDragOver ? 'drag-over' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="upload-icon text-muted mb-2 animate-bounce-slow" size={36} />
                    <p className="font-semibold text-small mb-1">Drag & drop CSV file here</p>
                    <p className="text-muted text-nano mb-3">or click to browse from files</p>
                    
                    <label htmlFor="csv-file-input" className="glow-btn-outline text-xs cursor-pointer py-1.5 px-3">
                      Select CSV File
                    </label>
                    <input 
                      type="file" 
                      id="csv-file-input" 
                      accept=".csv" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          processCSVFile(e.target.files[0]);
                        }
                      }}
                      className="hidden" 
                    />
                  </div>
                ) : (
                  <div className="file-info-card flex flex-col gap-3 p-4 mb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="file-icon bg-primary/10 text-primary p-2 rounded-md">
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="font-medium text-small text-truncate max-w-[200px]" title={selectedFile.name}>
                            {selectedFile.name}
                          </p>
                          <p className="text-muted text-xs">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={resetCsvState} 
                        className="text-muted hover:text-danger transition-colors p-1"
                        title="Remove file"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Verification / status indicator */}
                    {csvErrors.length === 0 && csvData.length > 0 && (
                      <div className="status-indicator success flex items-center gap-2 text-success text-xs bg-success/10 p-2 rounded border border-success/20">
                        <CheckCircle size={16} />
                        <span>Ready to import: {csvData.length} valid employee record(s).</span>
                      </div>
                    )}

                    {csvErrors.length > 0 && (
                      <div className="status-indicator error flex flex-col gap-1 text-xs bg-danger/10 p-2 rounded border border-danger/20">
                        <div className="flex items-center gap-2 text-danger font-semibold">
                          <AlertCircle size={16} />
                          <span>Validation failed with {csvErrors.length} issue(s)</span>
                        </div>
                        <ul className="error-list text-muted text-xs pl-5 list-disc max-h-[100px] overflow-y-auto mt-1">
                          {csvErrors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Preview Table for parsed rows */}
                {csvErrors.length === 0 && csvData.length > 0 && (
                  <div className="csv-preview-container mb-4">
                    <p className="text-muted text-xs font-semibold mb-2">CSV Data Preview (First {Math.min(3, csvData.length)} rows):</p>
                    <div className="overflow-x-auto max-h-[120px] rounded border border-border-light">
                      <table className="preview-table w-full text-xs text-left">
                        <thead>
                          <tr className="bg-black/30 text-muted">
                            <th className="p-1.5 font-medium border-b border-border-light">Name</th>
                            <th className="p-1.5 font-medium border-b border-border-light">Email</th>
                            <th className="p-1.5 font-medium border-b border-border-light">Role</th>
                            <th className="p-1.5 font-medium border-b border-border-light">Department</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 3).map((row, idx) => (
                            <tr key={idx} className="border-b border-border-light/30">
                              <td className="p-1.5 truncate max-w-[100px]">{row.fullname}</td>
                              <td className="p-1.5 truncate max-w-[120px]">{row.email}</td>
                              <td className="p-1.5">{row.role}</td>
                              <td className="p-1.5 truncate max-w-[80px]">{row.department_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sample format / template download */}
                <div className="csv-helper-section bg-black/20 p-3 rounded-md border border-border-light/50 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-primary">Required CSV Layout</span>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={handleCopyTemplate} 
                        className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1"
                        title="Copy sample CSV"
                      >
                        <Copy size={12} /> Copy
                      </button>
                      <button 
                        type="button" 
                        onClick={handleDownloadTemplate} 
                        className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1"
                        title="Download CSV template file"
                      >
                        <Download size={12} /> Download
                      </button>
                    </div>
                  </div>
                  <pre className="text-xs font-mono text-muted bg-black/40 p-2 rounded overflow-x-auto select-all">
                    fullname,email,role,department_name{"\n"}
                    Alice Smith,alice@company.com,Manager,Engineering{"\n"}
                    Bob Jones,bob@company.com,User,Finance
                  </pre>
                  <p className="text-muted text-nano mt-1 leading-relaxed">
                    * Make sure headers match exactly. The backend will automatically create new departments if they do not exist.
                  </p>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button" 
                    className="glow-btn-outline text-small py-2 px-4" 
                    onClick={closeUserModal}
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="glow-btn text-small py-2 px-4"
                    disabled={!selectedFile || csvErrors.length > 0 || csvData.length === 0 || isUploading}
                  >
                    {isUploading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="animate-spin" size={14} /> Importing...
                      </span>
                    ) : (
                      `Import ${csvData.length || ''} Employee${csvData.length !== 1 ? 's' : ''}`
                    )}
                  </button>
                </div>
              </form>
            )}
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
