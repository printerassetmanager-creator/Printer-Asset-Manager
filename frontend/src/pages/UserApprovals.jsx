import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { adminAPI } from '../utils/api';

const getDisplayName = (user) => user.full_name || user.fullName || user.email || '-';
const roleLabel = (role) => {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  return 'User';
};

const formatDate = (dateString) => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function UserApprovals() {
  const { user: currentUser } = useApp();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [approvalRole, setApprovalRole] = useState({});
  const [rejectReason, setRejectReason] = useState({});
  const [showRejectionForm, setShowRejectionForm] = useState({});
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(() => {
      fetchData({ silent: true });
    }, 15000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError('');

      const token = localStorage.getItem('authToken');
      const [pendingRes, allUsersRes] = await Promise.all([
        adminAPI.getPendingApprovals(token),
        adminAPI.getAllUsers(token),
      ]);

      setPendingUsers(Array.isArray(pendingRes) ? pendingRes : []);
      setAllUsers(Array.isArray(allUsersRes) ? allUsersRes : []);
      setLastUpdated(new Date().toLocaleTimeString('en-GB'));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch user approval data');
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    const selectedRole = approvalRole[userId] || 'user';
    if (!window.confirm('Approve this user request?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await adminAPI.approveUser(userId, selectedRole, token);
      setNotice(response.data?.message || 'User approved successfully');
      setError('');
      setApprovalRole((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve user');
    }
  };

  const openRejectForm = (userId) => {
    setShowRejectionForm((prev) => ({ ...prev, [userId]: true }));
    setNotice('');
    setError('');
  };

  const closeRejectForm = (userId) => {
    setShowRejectionForm((prev) => ({ ...prev, [userId]: false }));
    setRejectReason((prev) => ({ ...prev, [userId]: '' }));
  };

  const handleReject = async (userId) => {
    const reason = (rejectReason[userId] || '').trim();
    if (!window.confirm('Reject this user request?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await adminAPI.rejectUser(userId, reason, token);
      setNotice(response.data?.message || 'User rejected successfully');
      setError('');
      closeRejectForm(userId);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject user');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await adminAPI.changeUserRole(userId, newRole, token);
      setNotice(response.data?.message || 'User role updated successfully');
      setError('');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user account?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await adminAPI.deleteUser(userId, token);
      setNotice(response.data?.message || 'User deleted successfully');
      setError('');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const renderPendingUsers = () => {
    if (!pendingUsers.length) {
      return <div className="approvals-empty">No pending approval requests.</div>;
    }

    return (
      <div className="tbl-wrap approvals-table-wrap">
        <table className="tbl approvals-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Requested At</th>
              <th>Approved By</th>
              <th>Approved At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((user) => (
              <tr key={user.user_id}>
                <td className="em approvals-name-cell">{getDisplayName(user)}</td>
                <td className="mono approvals-email-cell">{user.email || '-'}</td>
                <td>{formatDate(user.requested_at)}</td>
                <td>
                  {user.approved_by ? (
                    <div className="approvals-meta">
                      <div className="approvals-meta-primary">{user.approver_name || 'Admin'}</div>
                      <div className="approvals-meta-secondary">{user.approved_by}</div>
                    </div>
                  ) : (
                    <span className="approvals-muted">-</span>
                  )}
                </td>
                <td>{formatDate(user.approved_at)}</td>
                <td>
                  <div className="approvals-actions">
                    <div className="approvals-role-box">
                      <label className="approvals-reject-label" htmlFor={`approve-role-${user.user_id}`}>
                        Assign role on approval
                      </label>
                      <select
                        id={`approve-role-${user.user_id}`}
                        className="approvals-role-select"
                        value={approvalRole[user.user_id] || 'user'}
                        onChange={(e) =>
                          setApprovalRole((prev) => ({
                            ...prev,
                            [user.user_id]: e.target.value,
                          }))
                        }
                      >
                        <option value="user">{roleLabel('user')}</option>
                        <option value="admin">{roleLabel('admin')}</option>
                        <option value="super_admin">{roleLabel('super_admin')}</option>
                      </select>
                    </div>
                    <div className="approvals-action-row">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(user.user_id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-amber btn-sm"
                        onClick={() => openRejectForm(user.user_id)}
                      >
                        Reject
                      </button>
                    </div>

                    {showRejectionForm[user.user_id] && (
                      <div className="approvals-reject-box">
                        <label className="approvals-reject-label" htmlFor={`reject-${user.user_id}`}>
                          Rejection reason
                        </label>
                        <textarea
                          id={`reject-${user.user_id}`}
                          className="approvals-reject-input"
                          placeholder="Enter reason for rejecting this request"
                          value={rejectReason[user.user_id] || ''}
                          onChange={(e) =>
                            setRejectReason((prev) => ({
                              ...prev,
                              [user.user_id]: e.target.value,
                            }))
                          }
                          rows={3}
                        />
                        <div className="approvals-action-row">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleReject(user.user_id)}
                          >
                            Confirm Reject
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => closeRejectForm(user.user_id)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAllUsers = () => {
    if (!allUsers.length) {
      return <div className="approvals-empty">No users found.</div>;
    }

    return (
      <div className="tbl-wrap approvals-table-wrap">
        <table className="tbl approvals-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => {
              const isCurrentSuperAdmin = currentUser?.role === 'super_admin' && currentUser?.id === user.id;
              const isOwnAccount = currentUser?.id === user.id;

              return (
                <tr key={user.id}>
                  <td className="em approvals-name-cell">{getDisplayName(user)}</td>
                  <td className="mono approvals-email-cell">{user.email || '-'}</td>
                  <td>
                    <select
                      className="approvals-role-select"
                      value={user.role}
                      disabled={isCurrentSuperAdmin}
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                    >
                      <option value="user">{roleLabel('user')}</option>
                      <option value="admin">{roleLabel('admin')}</option>
                      <option value="super_admin">{roleLabel('super_admin')}</option>
                    </select>
                    {isCurrentSuperAdmin ? (
                      <div className="approvals-inline-note">Your own super admin role is protected.</div>
                    ) : null}
                  </td>
                  <td>
                    <span className={`badge ${user.status === 'active' ? 'b-online' : user.status === 'pending' ? 'b-warn' : 'b-err'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={isOwnAccount}
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      {isOwnAccount ? 'Protected' : 'Delete'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="screen approvals-screen">
      <div className="card approvals-card">
        <div className="approvals-header">
          <div>
            <div className="card-title">Super Admin</div>
            <h2 className="approvals-title">User Management</h2>
            <div className="approvals-inline-note">
              {lastUpdated ? `Last updated at ${lastUpdated}` : 'Waiting for first refresh...'}
            </div>
          </div>
          <div className="approvals-summary">
            <span className="badge b-warn">{pendingUsers.length} Pending</span>
            <span className="badge b-online">{allUsers.length} Total</span>
            <button className="btn btn-ghost btn-sm" onClick={() => fetchData()} disabled={loading || refreshing}>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && <div className="auth-error approvals-message">{error}</div>}
        {notice && <div className="auth-success approvals-message">{notice}</div>}

        <div className="approvals-tabs">
          <button
            className={`btn btn-sm ${activeTab === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Approvals
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('all')}
          >
            All Users
          </button>
        </div>

        {loading ? (
          <div className="approvals-empty">Loading user data...</div>
        ) : activeTab === 'pending' ? (
          renderPendingUsers()
        ) : (
          renderAllUsers()
        )}
      </div>
    </div>
  );
}
