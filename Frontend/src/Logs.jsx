import React, { useState } from "react";

function Logs({ onBack }) {
  const [selectedBug, setSelectedBug] = useState(0);

  const bugReports = [
    { id: 1, title: "Critical bug report", time: "2 hours ago", status: "Critical", type: "critical" },
    { id: 2, title: "Major bug report", time: "5 hours ago", status: "Major", type: "major" },
    { id: 3, title: "Minor bug report", time: "1 day ago", status: "Minor", type: "verified" },
  ];

  const getStatusColor = (type) => {
    switch(type) {
      case 'critical': return '#FF4757';
      case 'major': return '#FFA502';
      case 'verified': return '#00BFA5';
      default: return '#888';
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'critical': return '🔺';
      case 'major': return '⭐';
      case 'verified': return '✓';
      default: return '•';
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#0E0F15', padding: '20px' }}>
      {/* Top Nav */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button
            className="btn me-2 text-white border-0"
            style={{ backgroundColor: '#1F1F1F', padding: '10px', paddingRight: '30px', paddingLeft: '30px', fontFamily: 'Sansita' }}
            onClick={onBack}
          >
            Dashboard
          </button>
          <button
            className="btn text-white border-0"
            style={{ backgroundColor: '#1F1F1F', padding: '10px', paddingRight: '30px', paddingLeft: '30px', fontFamily: 'Sansita' }}
          >
            Leaderboards
          </button>
        </div>
        <div
          className="rounded-circle bg-secondary"
          style={{ width: "40px", height: "40px", cursor: "pointer" }}
        ></div>
      </div>

      {/* Add custom scrollbar styles */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #3C4043;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #4C5053;
          }
        `}
      </style>

      <div style={{ display: 'flex', gap: '25px', maxWidth: '1600px', margin: '0 auto' }}>
        
        {/* Left Section - Bug Reports List */}
        <div style={{ width: '450px' }}>
          <div 
            className="custom-scrollbar"
            style={{ 
            backgroundColor: '#1A1A1A', 
            borderRadius: '12px', 
            padding: '20px',
            height: '85vh',
            overflowY: 'auto'
          }}>
            <h6 style={{ color: 'white', marginBottom: '20px', fontSize: '1rem' }}>Submitted Bugs</h6>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bugReports.map((bug, index) => (
                <div 
                  key={bug.id}
                  onClick={() => setSelectedBug(index)}
                  style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '12px',
                    backgroundColor: selectedBug === index ? '#252525' : 'transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedBug !== index) {
                      e.currentTarget.style.backgroundColor = '#202020';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedBug !== index) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ 
                    marginRight: '12px', 
                    fontSize: '1rem',
                    color: getStatusColor(bug.type)
                  }}>
                    {getIcon(bug.type)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      color: 'white', 
                      fontSize: '0.85rem', 
                      margin: '0 0 4px 0',
                      lineHeight: '1.4'
                    }}>
                      {bug.title}
                    </p>
                    <span style={{ 
                      color: '#666', 
                      fontSize: '0.75rem' 
                    }}>
                      {bug.time}
                    </span>
                  </div>
                  <span style={{ 
                    color: getStatusColor(bug.type),
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    marginLeft: '10px'
                  }}>
                    {bug.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section - Bug Report Details */}
        <div style={{ flex: 1 }}>
          <div 
            className="custom-scrollbar"
            style={{ 
            backgroundColor: '#1A1A1A', 
            borderRadius: '12px', 
            padding: '30px',
            height: '85vh',
            overflowY: 'auto'
          }}>
            {/* Report Title */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ color: '#888', fontSize: '0.9rem', marginBottom: '10px', display: 'block' }}>
                Report Title:
              </label>
              <div style={{ 
                backgroundColor: '#2A2A2A',
                border: '1px solid #3C4043',
                padding: '12px 15px',
                borderRadius: '6px',
                minHeight: '45px',
                color: 'white'
              }}>
              </div>
            </div>

            {/* Bug Information & Steps */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ color: '#888', fontSize: '0.9rem', marginBottom: '10px', display: 'block' }}>
                Bug Information & Steps to Reproduce:
              </label>
              <div style={{ 
                backgroundColor: '#2A2A2A',
                border: '1px solid #3C4043',
                padding: '15px',
                borderRadius: '6px',
                minHeight: '280px',
                color: 'white'
              }}>
              </div>
            </div>

            {/* Two Column Section */}
            <div style={{ display: 'flex', gap: '20px' }}>
              {/* Expected vs Actual Behavior */}
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '0.9rem', marginBottom: '10px', display: 'block' }}>
                  Expected vs Actual Behavior:
                </label>
                <div style={{ 
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #3C4043',
                  padding: '15px',
                  borderRadius: '6px',
                  minHeight: '250px',
                  color: 'white'
                }}>
                </div>
              </div>

              {/* Attached Evidence */}
              <div style={{ flex: 1 }}>
                <label style={{ color: '#888', fontSize: '0.9rem', marginBottom: '10px', display: 'block' }}>
                  Attached Evidences:
                </label>
                <div style={{ 
                  backgroundColor: '#2A2A2A',
                  border: '1px solid #3C4043',
                  borderRadius: '6px',
                  padding: '15px',
                  minHeight: '250px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px', opacity: '0.5' }}>📎</div>
                    <p style={{ fontSize: '0.85rem', margin: 0 }}>No attachments</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Logs;