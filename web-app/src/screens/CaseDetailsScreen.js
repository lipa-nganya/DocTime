import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import AlertModal from '../components/AlertModal';
import './CaseDetailsScreen.css';

export default function CaseDetailsScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const caseId = id;
  
  const [caseItem, setCaseItem] = useState(null);
  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [removeReferralDialogVisible, setRemoveReferralDialogVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const loadCase = async () => {
    try {
      const response = await api.get(`/cases/${caseId}`);
      setCaseItem(response.data.case);
      setReferral(response.data.referral || null);
    } catch (error) {
      setAlertMessage('Failed to load case details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/new-case?edit=${caseId}`);
  };

  const handleComplete = async () => {
    try {
      await api.post(`/cases/${caseId}/complete`);
      setAlertMessage('Case marked as completed');
      setTimeout(() => navigate(-1), 1500);
    } catch (error) {
      setAlertMessage(error.response?.data?.error || 'Failed to complete case');
    }
  };

  const handleCancel = async () => {
    try {
      await api.post(`/cases/${caseId}/cancel`);
      setAlertMessage('Case cancelled');
      setTimeout(() => navigate(-1), 1500);
    } catch (error) {
      setAlertMessage(error.response?.data?.error || 'Failed to cancel case');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/cases/${caseId}`);
      setAlertMessage('Case deleted');
      setTimeout(() => navigate(-1), 1500);
    } catch (error) {
      setAlertMessage(error.response?.data?.error || 'Failed to delete case');
    } finally {
      setDeleteDialogVisible(false);
    }
  };

  const handleRefer = () => {
    navigate(`/refer/${caseId}`);
  };

  const handleRemoveReferral = async () => {
    if (!referral) return;
    
    try {
      await api.delete(`/referrals/${referral.id}`);
      setAlertMessage('Referral removed successfully');
      setRemoveReferralDialogVisible(false);
      loadCase(); // Reload case to update status
    } catch (error) {
      setAlertMessage(error.response?.data?.error || 'Failed to remove referral');
    }
  };

  if (loading) {
    return (
      <div className="case-details-container">
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="case-details-container">
        <div className="loading-text">Case not found</div>
      </div>
    );
  }

  return (
    <div className="case-details-container">
      <div className="case-details-card">
        <div className="case-details-header">
          <h2 className="patient-name">{caseItem.patientName}</h2>
          <div className="menu-container">
            <button className="menu-button" onClick={() => setMenuVisible(!menuVisible)}>
              ⋮
            </button>
            {menuVisible && (
              <div className="menu-dropdown">
                <button className="menu-item" onClick={handleEdit}>Edit</button>
                {caseItem.isReferred && referral ? (
                  <button className="menu-item" onClick={() => setRemoveReferralDialogVisible(true)}>Remove Referral</button>
                ) : (
                  <button className="menu-item" onClick={handleRefer}>Refer Case</button>
                )}
                {caseItem.status === 'Upcoming' && (
                  <>
                    <button className="menu-item" onClick={handleComplete}>Complete</button>
                    <button className="menu-item" onClick={handleCancel}>Cancel</button>
                  </>
                )}
                <button className="menu-item delete" onClick={() => setDeleteDialogVisible(true)}>Delete</button>
              </div>
            )}
          </div>
        </div>

        <div className="case-details-content">
          <div className="detail-row">
            <span className="detail-label">Date of Procedure</span>
            <span className="detail-value">
              {new Date(caseItem.dateOfProcedure).toLocaleDateString()}
            </span>
          </div>

          {caseItem.inpatientNumber && (
            <div className="detail-row">
              <span className="detail-label">In-patient Number</span>
              <span className="detail-value">{caseItem.inpatientNumber}</span>
            </div>
          )}

          {caseItem.patientAge && (
            <div className="detail-row">
              <span className="detail-label">Patient Age</span>
              <span className="detail-value">{caseItem.patientAge}</span>
            </div>
          )}

          {caseItem.facility && (
            <div className="detail-row">
              <span className="detail-label">Facility</span>
              <span className="detail-value">{caseItem.facility.name}</span>
            </div>
          )}

          {caseItem.procedures && caseItem.procedures.length > 0 && (
            <div className="detail-row">
              <span className="detail-label">Procedure{caseItem.procedures.length > 1 ? 's' : ''}</span>
              <span className="detail-value">
                {caseItem.procedures.map(p => p.name).join(', ')}
              </span>
            </div>
          )}

          {caseItem.teamMembers && caseItem.teamMembers.length > 0 && (
            <div className="detail-row">
              <span className="detail-label">Surgical Team Member{caseItem.teamMembers.length > 1 ? 's' : ''}</span>
              <span className="detail-value">
                {caseItem.teamMembers.map(member => 
                  `${member.name}${member.otherRole ? ` (${member.role} - ${member.otherRole})` : ` (${member.role})`}`
                ).join(', ')}
              </span>
            </div>
          )}

          {caseItem.amount && (
            <div className="detail-row">
              <span className="detail-label">Amount</span>
              <span className="detail-value">KES {caseItem.amount}</span>
            </div>
          )}

          {caseItem.payer && (
            <div className="detail-row">
              <span className="detail-label">Payer</span>
              <span className="detail-value">{caseItem.payer.name}</span>
            </div>
          )}

          {caseItem.paymentStatus && (
            <div className="detail-row">
              <span className="detail-label">Payment Status</span>
              <span className="detail-value">{caseItem.paymentStatus}</span>
            </div>
          )}

          {caseItem.additionalNotes && (
            <div className="detail-row">
              <span className="detail-label">Notes</span>
              <span className="detail-value">{caseItem.additionalNotes}</span>
            </div>
          )}

          {caseItem.isReferred && (
            <div className="badge referral-badge">
              Referred Case
            </div>
          )}

          {caseItem.isAutoCompleted && (
            <div className="badge auto-complete-badge">
              Auto-completed
            </div>
          )}
        </div>
      </div>

      {deleteDialogVisible && (
        <div className="dialog-overlay" onClick={() => setDeleteDialogVisible(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Delete Case</h3>
            <p className="dialog-content">
              Are you sure you want to delete this case? This action cannot be undone.
            </p>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteDialogVisible(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {removeReferralDialogVisible && (
        <div className="dialog-overlay" onClick={() => setRemoveReferralDialogVisible(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">Remove Referral</h3>
            <p className="dialog-content">
              Are you sure you want to remove this referral? The case will be returned to your queue. 
              <strong> The referee will NOT receive an SMS notification.</strong>
            </p>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setRemoveReferralDialogVisible(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleRemoveReferral}>
                Remove Referral
              </button>
            </div>
          </div>
        </div>
      )}

      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
          title={alertMessage.includes('successfully') || alertMessage.includes('completed') || alertMessage.includes('cancelled') || alertMessage.includes('deleted') ? 'Success' : 'Error'}
        />
      )}
    </div>
  );
}
