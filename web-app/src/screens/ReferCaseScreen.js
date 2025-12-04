import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import './ReferCaseScreen.css';

export default function ReferCaseScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const caseId = id;

  const [refereePhoneNumber, setRefereePhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePickContact = async () => {
    // For web, we can't access contacts directly
    // This would need to be implemented differently or removed for web
    window.alert('Contact picker is not available on web. Please enter the phone number manually.');
  };

  const handleRefer = async () => {
    if (!refereePhoneNumber) {
      window.alert('Please enter referee phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/referrals', {
        caseId,
        refereePhoneNumber
      });

      if (response.data.smsSent) {
        window.alert('Case referred successfully. SMS notification sent to referee.');
      } else if (response.data.smsWarning) {
        window.alert(`Case referred successfully, but SMS could not be sent: ${response.data.smsWarning}`);
      } else {
        window.alert('Case referred successfully');
      }
      navigate(-1);
    } catch (error) {
      window.alert(error.response?.data?.error || 'Failed to refer case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="refer-case-container">
      <div className="refer-case-content">
        <h2 className="refer-title">Refer Case to Another Doctor</h2>
        <p className="refer-subtitle">
          Enter the phone number of the doctor you want to refer this case to.
        </p>

        <div className="sms-notice">
          <div className="sms-notice-icon">📱</div>
          <div className="sms-notice-text">
            <strong>Important:</strong> The referee will receive an SMS notification with case details and instructions to access the case.
          </div>
        </div>

        <input
          type="tel"
          className="form-input"
          placeholder="Referee Phone Number (e.g., 0712345678)"
          value={refereePhoneNumber}
          onChange={(e) => setRefereePhoneNumber(e.target.value)}
        />

        <button
          className="btn btn-outlined"
          onClick={handlePickContact}
        >
          Pick from Contacts
        </button>

        <button
          className="btn btn-primary"
          onClick={handleRefer}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Referral'}
        </button>
      </div>
    </div>
  );
}
