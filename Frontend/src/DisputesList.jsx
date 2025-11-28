import React, { useState, useEffect } from 'react';

function DisputesList({ projectId, onClose }) {
  const [projectDisputes, setProjectDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjectDisputes();
  }, [projectId]);

  const fetchProjectDisputes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        setError('Please log in to view reports');
        return;
      }

      console.log('Fetching project reports for project:', projectId);

      // Fetch project disputes (reports)
      const projectResponse = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/bug-reports?action=get-project-disputes&projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Project reports response:', projectResponse.status);

      if (projectResponse.ok) {
        const data = await projectResponse.json();
        setProjectDisputes(data.projectDisputes || []);
        console.log('Project reports fetched:', data.projectDisputes?.length || 0);
      }

      setError('');
    } catch (error) {
      console.error('Error fetching project reports:', error);
      setError('Error loading project reports');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: '#FEF3C7', color: '#92400E', text: 'Pending Review' },
      under_review: { bg: '#E0E7FF', color: '#3730A3', text: 'Under Review' },
      resolved: { bg: '#D1FAE5', color: '#065F46', text: 'Resolved' },
      rejected: { bg: '#FEE2E2', color: '#991B1B', text: 'Rejected' }
    };
    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600'
      }}>
        {config.text}
      </span>
    );
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Less than 1 hour ago';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1F1F1F',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px'
        }}>
          <h2 style={{
            color: 'white',
            fontSize: '24px',
            fontWeight: '700',
            margin: 0
          }}>
            Your Project Reports
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '18px',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.7)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255,255,255,0.1)',
              borderTop: '3px solid #4ECDC4',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            Loading project reports...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#FF6B6B' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ marginBottom: '8px' }}>Error Loading Reports</h3>
            <p style={{ marginBottom: '20px', opacity: 0.8 }}>{error}</p>
            <button
              onClick={fetchProjectDisputes}
              style={{
                background: '#FF6B6B',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Try Again
            </button>
          </div>
        ) : projectDisputes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
            <h3 style={{
              color: 'white',
              fontSize: '20px',
              marginBottom: '8px'
            }}>
              No Project Reports Submitted
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px'
            }}>
              You haven't submitted any project reports yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* Project Reports */}
            {projectDisputes.map((dispute) => (
              <div
                key={dispute._id}
                style={{
                  backgroundColor: '#2A2A2A',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h4 style={{
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '0',
                    flex: 1,
                    marginRight: '15px'
                  }}>
                    {dispute.subject}
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <span style={{
                      backgroundColor: '#FEF3C7',
                      color: '#92400E',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      Project Report
                    </span>
                    {getStatusBadge(dispute.status)}
                  </div>
                </div>

                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  marginBottom: '15px',
                  lineHeight: '1.5'
                }}>
                  {dispute.description.length > 150 ? dispute.description.substring(0, 150) + '...' : dispute.description}
                </p>

                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Submitted {formatTimeAgo(dispute.createdAt)}
                </div>

                {dispute.adminResponse && (
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    background: 'rgba(78, 205, 196, 0.1)',
                    border: '1px solid rgba(78, 205, 196, 0.3)',
                    borderRadius: '8px'
                  }}>
                    <h5 style={{ color: '#4ECDC4', fontSize: '14px', marginBottom: '8px' }}>
                      Admin Response
                    </h5>
                    <p style={{ color: 'white', fontSize: '13px', marginBottom: 0 }}>
                      {dispute.adminResponse.message}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DisputesList;