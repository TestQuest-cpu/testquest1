import React, { useState, useEffect } from 'react';

function ProjectDisputeModal({ project, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    description: '',
    evidence: '',
    expectedResolution: '',
    bugReportId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bugReports, setBugReports] = useState([]);
  const [loadingBugReports, setLoadingBugReports] = useState(true);

  const categories = [
    { value: 'unfair_rejection', label: 'Unfair Bug Report Rejection' },
    { value: 'payment_dispute', label: 'Payment/Reward Dispute' },
    { value: 'bias_discrimination', label: 'Bias or Discrimination' },
    { value: 'communication_issue', label: 'Communication Issues' },
    { value: 'project_requirements', label: 'Unclear Project Requirements' },
    { value: 'other', label: 'Other Issue' }
  ];

  // Fetch bug reports for this project
  useEffect(() => {
    const fetchBugReports = async () => {
      try {
        setLoadingBugReports(true);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/bug-reports?projectId=${project._id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Filter to only show reports submitted by this user
          setBugReports(data.bugReports || []);
        }
      } catch (error) {
        console.error('Error fetching bug reports:', error);
      } finally {
        setLoadingBugReports(false);
      }
    };

    if (project?._id) {
      fetchBugReports();
    }
  }, [project]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category || !formData.subject || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({
        ...formData,
        projectId: project._id,
        projectName: project.name,
        type: 'project_dispute'
      });
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to submit dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1F1F1F',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '25px 30px 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '25px',
          paddingBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: '0 0 8px 0'
              }}>
                Report Project Issue
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.95rem',
                margin: 0
              }}>
                Project: <span style={{ color: 'white', fontWeight: '600' }}>{project?.name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '0 30px 30px' }}>
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              color: '#EF4444',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          {/* Category Selection */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              color: 'white',
              fontSize: '0.95rem',
              marginBottom: '8px',
              display: 'block',
              fontWeight: '500'
            }}>
              Issue Category <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                backgroundColor: '#2A2A2A',
                border: '1px solid #404040',
                borderRadius: '8px',
                padding: '12px',
                color: 'white',
                fontSize: '0.95rem'
              }}
            >
              <option value="">Select an issue category...</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Bug Report Selection */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              color: 'white',
              fontSize: '0.95rem',
              marginBottom: '8px',
              display: 'block',
              fontWeight: '500'
            }}>
              Related Bug Report (Optional)
            </label>
            <select
              name="bugReportId"
              value={formData.bugReportId}
              onChange={handleInputChange}
              disabled={loadingBugReports}
              style={{
                width: '100%',
                backgroundColor: '#2A2A2A',
                border: '1px solid #404040',
                borderRadius: '8px',
                padding: '12px',
                color: 'white',
                fontSize: '0.95rem',
                cursor: loadingBugReports ? 'wait' : 'pointer'
              }}
            >
              <option value="">
                {loadingBugReports ? 'Loading your bug reports...' : 'Select a bug report (optional)'}
              </option>
              {bugReports.map(report => (
                <option key={report._id} value={report._id}>
                  {report.title} - {report.status} ({report.severity})
                </option>
              ))}
            </select>
            {!loadingBugReports && bugReports.length === 0 && (
              <p style={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.85rem',
                marginTop: '6px',
                fontStyle: 'italic'
              }}>
                You haven't submitted any bug reports for this project yet.
              </p>
            )}
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.85rem',
              marginTop: '6px'
            }}>
              Select a bug report if this dispute is related to a specific bug you submitted. This helps moderators review your case with full context.
            </p>
          </div>

          {/* Subject */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              color: 'white',
              fontSize: '0.95rem',
              marginBottom: '8px',
              display: 'block',
              fontWeight: '500'
            }}>
              Subject <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="Brief summary of the issue"
              required
              style={{
                width: '100%',
                backgroundColor: '#2A2A2A',
                border: '1px solid #404040',
                borderRadius: '8px',
                padding: '12px',
                color: 'white',
                fontSize: '0.95rem'
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              color: 'white',
              fontSize: '0.95rem',
              marginBottom: '8px',
              display: 'block',
              fontWeight: '500'
            }}>
              Detailed Description <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide a detailed explanation of the issue. Include specific examples, dates, and any relevant context."
              required
              rows="6"
              style={{
                width: '100%',
                backgroundColor: '#2A2A2A',
                border: '1px solid #404040',
                borderRadius: '8px',
                padding: '15px',
                color: 'white',
                fontSize: '0.95rem',
                resize: 'vertical',
                lineHeight: '1.5'
              }}
            />
          </div>

          {/* Evidence */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              color: 'white',
              fontSize: '0.95rem',
              marginBottom: '8px',
              display: 'block',
              fontWeight: '500'
            }}>
              Evidence/Supporting Information
            </label>
            <textarea
              name="evidence"
              value={formData.evidence}
              onChange={handleInputChange}
              placeholder="Include any evidence such as screenshots, links to rejected bug reports, communication records, or other supporting documentation."
              rows="4"
              style={{
                width: '100%',
                backgroundColor: '#2A2A2A',
                border: '1px solid #404040',
                borderRadius: '8px',
                padding: '15px',
                color: 'white',
                fontSize: '0.95rem',
                resize: 'vertical',
                lineHeight: '1.5'
              }}
            />
          </div>

          {/* Expected Resolution */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              color: 'white',
              fontSize: '0.95rem',
              marginBottom: '8px',
              display: 'block',
              fontWeight: '500'
            }}>
              Expected Resolution
            </label>
            <textarea
              name="expectedResolution"
              value={formData.expectedResolution}
              onChange={handleInputChange}
              placeholder="What would you like to see happen to resolve this issue? (e.g., review rejected bugs, fair payment, clearer communication)"
              rows="3"
              style={{
                width: '100%',
                backgroundColor: '#2A2A2A',
                border: '1px solid #404040',
                borderRadius: '8px',
                padding: '15px',
                color: 'white',
                fontSize: '0.95rem',
                resize: 'vertical',
                lineHeight: '1.5'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                backgroundColor: '#404040',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '0.95rem',
                fontWeight: '500',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: isSubmitting
                  ? '#666666'
                  : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.8 : 1
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectDisputeModal;