import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/dashboard`);
      if (response.data && response.data.dashboard) {
        setStats(response.data.dashboard);
      } else {
        setStats({
          completedCases: 0,
          cancelledCases: 0,
          referredCases: 0,
          totalUsers: 0,
          activeUsers: 0
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setStats({
        completedCases: 0,
        cancelledCases: 0,
        referredCases: 0,
        totalUsers: 0,
        activeUsers: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Completed Cases</h3>
          <p className="stat-value">{stats.completedCases || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Cancelled Cases</h3>
          <p className="stat-value">{stats.cancelledCases || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Referred Cases</h3>
          <p className="stat-value">{stats.referredCases || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-value">{stats.totalUsers || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Active Users (30 days)</h3>
          <p className="stat-value">{stats.activeUsers || 0}</p>
        </div>
      </div>
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="users">
      <h2>Users</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Phone Number</th>
            <th>Role</th>
            <th>Signup OTP</th>
            <th>Last Login</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.phoneNumber}</td>
              <td>{user.role}{user.otherRole ? ` (${user.otherRole})` : ''}</td>
              <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#4ECDC4' }}>
                {user.signupOTP || '-'}
              </td>
              <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OngoingCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/ongoing-cases`);
      setCases(response.data.cases);
    } catch (error) {
      console.error('Error loading cases:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="ongoing-cases">
      <h2>Ongoing Cases</h2>
      <div className="cases-list">
        {cases.map((caseItem) => (
          <div key={caseItem.id} className="case-card">
            <h3>{caseItem.patientName}</h3>
            <p>Date: {new Date(caseItem.dateOfProcedure).toLocaleDateString()}</p>
            <p>Doctor: {caseItem.user?.phoneNumber}</p>
            <p>Facility: {caseItem.facility?.name || 'N/A'}</p>
            <p>Status: {caseItem.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Referrals() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/referrals`);
      setReferrals(response.data.referrals);
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="referrals">
      <h2>Referrals</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Case</th>
            <th>Referrer</th>
            <th>Referee</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((referral) => (
            <tr key={referral.id}>
              <td>{referral.case?.patientName}</td>
              <td>{referral.referrer?.phoneNumber}</td>
              <td>{referral.referee?.phoneNumber || referral.refereePhoneNumber}</td>
              <td>{referral.status}</td>
              <td>{new Date(referral.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/roles`);
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeamMember = async () => {
    if (!selectedRole || !newName) return;

    try {
      await axios.post(`${API_BASE_URL}/admin/roles/${selectedRole.name}/team-members`, {
        names: [newName]
      });
      setNewName('');
      loadRoles();
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="roles">
      <h2>Roles & Team Members</h2>
      {roles.map((role) => (
        <div key={role.id} className="role-card">
          <h3>{role.name}</h3>
          <div>
            <input
              type="text"
              placeholder="Add team member name"
              value={selectedRole?.id === role.id ? newName : ''}
              onChange={(e) => {
                setSelectedRole(role);
                setNewName(e.target.value);
              }}
            />
            <button onClick={handleAddTeamMember}>Add</button>
          </div>
          <ul>
            {role.teamMemberNames?.map((name, index) => (
              <li key={index}>{name}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Facilities() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFacilityName, setNewFacilityName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    try {
      // Admin can access facilities without auth token (admin routes bypass auth)
      const response = await axios.get(`${API_BASE_URL}/facilities`);
      setFacilities(response.data.facilities || []);
    } catch (error) {
      console.error('Error loading facilities:', error);
      // If auth error, try admin endpoint
      try {
        const adminResponse = await axios.get(`${API_BASE_URL}/admin/facilities`);
        setFacilities(adminResponse.data.facilities || []);
      } catch (adminError) {
        console.error('Error loading facilities from admin:', adminError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddFacility = async () => {
    if (!newFacilityName.trim()) {
      alert('Please enter a facility name');
      return;
    }

    setAdding(true);
    try {
      // Try regular endpoint first
      try {
        await axios.post(`${API_BASE_URL}/facilities`, {
          name: newFacilityName.trim()
        });
      } catch (error) {
        // If auth error, try admin endpoint
        if (error.response?.status === 401 || error.response?.status === 403) {
          await axios.post(`${API_BASE_URL}/admin/facilities`, {
            name: newFacilityName.trim()
          });
        } else {
          throw error;
        }
      }
      setNewFacilityName('');
      loadFacilities();
      alert('Facility added successfully');
    } catch (error) {
      console.error('Error adding facility:', error);
      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert('Failed to add facility');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteFacility = async (facilityId) => {
    if (!confirm('Are you sure you want to delete this facility?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/admin/facilities/${facilityId}`);
      loadFacilities();
      alert('Facility deleted successfully');
    } catch (error) {
      console.error('Error deleting facility:', error);
      alert('Failed to delete facility');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="facilities">
      <h2>Facilities</h2>
      <div className="add-facility-form" style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Add New Facility</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Enter facility name (e.g., Nairobi Hospital)"
            value={newFacilityName}
            onChange={(e) => setNewFacilityName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddFacility();
              }
            }}
            style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
          />
          <button 
            onClick={handleAddFacility} 
            disabled={adding || !newFacilityName.trim()}
            style={{ padding: '0.5rem 1.5rem', fontSize: '1rem', cursor: adding ? 'not-allowed' : 'pointer' }}
          >
            {adding ? 'Adding...' : 'Add Facility'}
          </button>
        </div>
      </div>
      <div className="facilities-list">
        <table className="data-table">
          <thead>
            <tr>
              <th>Facility Name</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {facilities.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No facilities added yet. Add one above.
                </td>
              </tr>
            ) : (
              facilities.map((facility) => (
                <tr key={facility.id}>
                  <td>{facility.name}</td>
                  <td>{new Date(facility.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => handleDeleteFacility(facility.id)}
                      style={{ 
                        padding: '0.25rem 0.75rem', 
                        fontSize: '0.875rem',
                        backgroundColor: '#ff6b6b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Payers() {
  const [payers, setPayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPayerName, setNewPayerName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadPayers();
  }, []);

  const loadPayers = async () => {
    try {
      // Admin can access payers without auth token (admin routes bypass auth)
      const response = await axios.get(`${API_BASE_URL}/admin/payers`);
      setPayers(response.data.payers || []);
    } catch (error) {
      console.error('Error loading payers:', error);
      // If auth error, try regular endpoint
      try {
        const regularResponse = await axios.get(`${API_BASE_URL}/payers`);
        setPayers(regularResponse.data.payers || []);
      } catch (regularError) {
        console.error('Error loading payers from regular endpoint:', regularError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayer = async () => {
    if (!newPayerName.trim()) {
      alert('Please enter a payer name');
      return;
    }

    setAdding(true);
    try {
      await axios.post(`${API_BASE_URL}/admin/payers`, {
        name: newPayerName.trim()
      });
      setNewPayerName('');
      loadPayers();
      alert('Payer added successfully');
    } catch (error) {
      console.error('Error adding payer:', error);
      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert('Failed to add payer');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDeletePayer = async (payerId) => {
    if (!confirm('Are you sure you want to delete this payer?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/admin/payers/${payerId}`);
      loadPayers();
      alert('Payer deleted successfully');
    } catch (error) {
      console.error('Error deleting payer:', error);
      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert('Failed to delete payer');
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="payers">
      <h2>Payers</h2>
      <div className="add-payer-form" style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Add New Payer</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Enter payer name (e.g., Jubilee)"
            value={newPayerName}
            onChange={(e) => setNewPayerName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddPayer();
              }
            }}
            style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
          />
          <button 
            onClick={handleAddPayer} 
            disabled={adding || !newPayerName.trim()}
            style={{ padding: '0.5rem 1.5rem', fontSize: '1rem', cursor: adding ? 'not-allowed' : 'pointer' }}
          >
            {adding ? 'Adding...' : 'Add Payer'}
          </button>
        </div>
      </div>
      <div className="payers-list">
        <table className="data-table">
          <thead>
            <tr>
              <th>Payer Name</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payers.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No payers added yet. Add one above.
                </td>
              </tr>
            ) : (
              payers.map((payer) => (
                <tr key={payer.id}>
                  <td>{payer.name}</td>
                  <td>{new Date(payer.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => handleDeletePayer(payer.id)}
                      style={{ 
                        padding: '0.25rem 0.75rem', 
                        fontSize: '0.875rem',
                        backgroundColor: '#ff6b6b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Settings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/settings`);
      setSettings(response.data.settings || []);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSMS = async () => {
    const smsSetting = settings.find(s => s.key === 'ENABLE_SMS');
    const newValue = smsSetting?.value === 'true' ? 'false' : 'true';
    
    try {
      await axios.put(`${API_BASE_URL}/admin/settings/ENABLE_SMS`, {
        value: newValue,
        description: 'Enable/disable OTP SMS sending (cost savings during development)'
      });
      loadSettings();
      alert(`SMS sending ${newValue === 'true' ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating setting:', error);
      alert('Failed to update setting');
    }
  };

  if (loading) return <div>Loading...</div>;

  const smsSetting = settings.find(s => s.key === 'ENABLE_SMS') || { value: process.env.ENABLE_SMS || 'false' };

  return (
    <div className="settings">
      <h2>Settings</h2>
      <div className="setting-card">
        <h3>OTP SMS Sending</h3>
        <p>Enable or disable OTP SMS sending via Advanta API. Disable for cost savings during development.</p>
        <div style={{ marginTop: '1rem' }}>
          <label>
            <input
              type="checkbox"
              checked={smsSetting.value === 'true'}
              onChange={handleToggleSMS}
            />
            <span style={{ marginLeft: '0.5rem' }}>
              {smsSetting.value === 'true' ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
          Current status: <strong>{smsSetting.value === 'true' ? 'SMS enabled - OTPs will be sent via Advanta' : 'SMS disabled - OTPs shown in dev mode only'}</strong>
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="sidebar">
          <h1>Doc Time Admin</h1>
          <Link to="/">Dashboard</Link>
          <Link to="/users">Users</Link>
          <Link to="/ongoing-cases">Ongoing Cases</Link>
          <Link to="/referrals">Referrals</Link>
          <Link to="/roles">Roles</Link>
          <Link to="/facilities">Facilities</Link>
          <Link to="/payers">Payers</Link>
          <Link to="/settings">Settings</Link>
        </nav>
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/ongoing-cases" element={<OngoingCases />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/facilities" element={<Facilities />} />
            <Route path="/payers" element={<Payers />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

