import React, { useState, useEffect } from "react";
import { getTesterTheme } from './themeConfig';

function Leaderboards({ onBack, onProfile }) {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLightMode] = useState(() => {
    const saved = localStorage.getItem('testerLightMode');
    return saved === null ? false : saved === 'true';
  });

  const theme = getTesterTheme(isLightMode);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)}/api/projects?leaderboards=true`);

      if (response.ok) {
        const data = await response.json();
        const rankings = data.leaderboards.rankings || [];

        // Transform the data to match your friend's UI expectations
        const transformedData = rankings.map(user => ({
          id: user._id,
          username: user.name,
          avatar: user.avatar,
          points: user.totalCreditsAcquired || 0,
          projectsParticipated: user.projectsParticipated,
          totalCreditsAcquired: user.totalCreditsAcquired || 0,
          reputation: Math.min(100, Math.max(0, Math.round((user.approvedBugReports / Math.max(1, user.totalBugReports)) * 100))),
          badges: user.badges || {} // Include badges
        }));

        setLeaderboardData(transformedData);
        setStatistics(data.leaderboards.statistics || {});
      } else {
        setError('Failed to load leaderboards');
      }
    } catch (error) {
      console.error('Error loading leaderboards:', error);
      setError('Error loading leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getReputationBadge = (score) => {
    if (score >= 500) return { emoji: '💎', title: 'Diamond' };
    if (score >= 250) return { emoji: '🏆', title: 'Gold' };
    if (score >= 100) return { emoji: '🥇', title: 'Silver' };
    if (score >= 50) return { emoji: '🥈', title: 'Bronze' };
    return { emoji: '🆕', title: 'Rookie' };
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: theme.background,
      position: 'relative',
      transition: 'background-color 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: '40px 30px 30px 30px'
      }}>
        <div className="d-flex justify-content-between align-items-center">
          <nav className="d-flex gap-3 align-items-center">
            <h2 style={{
              color: theme.textPrimary,
              margin: 0,
              marginRight: '20px',
              fontSize: '1.5rem',
              fontWeight: '600',
              transition: 'color 0.3s ease'
            }}>TestQuest</h2>
            <button
              onClick={onBack}
              style={{
                background: theme.buttonLight,
                transition: 'all 0.3s ease',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 28px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'Sansita, sans-serif',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = theme.buttonLightHover;
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = theme.buttonLight;
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
              }}
            >
              Dashboard
            </button>
            <button
              style={{
                background: theme.buttonDark,
                border: 'none',
                borderRadius: '10px',
                padding: '12px 28px',
                color: theme.textPrimary,
                transition: 'all 0.3s ease',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'Sansita, sans-serif',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = theme.buttonDarkHover;
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = theme.buttonDark;
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
              }}
            >
              Leaderboards
            </button>
          </nav>

          <div className="d-flex align-items-center gap-3">
            <div
              onClick={onProfile}
              style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >👤</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '0px 30px 40px 30px' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{
            color: theme.textPrimary,
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '8px',
            fontFamily: 'Sansita, sans-serif',
            transition: 'color 0.3s ease'
          }}>🏆 Leaderboards</h1>
          <button
            onClick={loadLeaderboards}
            style={{
              backgroundColor: '#007BFF',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              marginTop: '10px'
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <div style={{ color: theme.textPrimary, fontSize: '1.2rem', transition: 'color 0.3s ease' }}>Loading leaderboard...</div>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <div style={{ color: '#FF6B6B', fontSize: '1.2rem' }}>{error}</div>
          </div>
        ) : leaderboardData.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <div style={{ color: theme.textPrimary, fontSize: '1.2rem', transition: 'color 0.3s ease' }}>No leaderboard data available</div>
          </div>
        ) : (
          <>
        {/* Top 3 Podium */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'end',
          gap: '80px',
          marginBottom: '60px',
          maxWidth: '1200px',
          margin: '0 auto 60px auto'
        }}>
          {/* Second Place */}
          {leaderboardData[1] && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}>
            {/* User on top */}
            <div style={{
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                color: 'white',
                marginBottom: '15px',
                fontFamily: 'Sansita, sans-serif'
              }}>Testing Sovereign</div>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                backgroundImage: `url(${leaderboardData[1]?.avatar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                margin: '0 auto 12px',
                border: '3px solid #C0C0C0'
              }}></div>
              <h4 style={{
                color: 'white',
                fontSize: '1rem',
                fontWeight: '700',
                marginBottom: '8px',
                fontFamily: 'DM Sans, sans-serif'
              }}>{leaderboardData[1]?.username}</h4>

              {/* Badges */}
              {(leaderboardData[1]?.badges?.firstBlood || leaderboardData[1]?.badges?.bugHunter || leaderboardData[1]?.badges?.eliteTester) && (
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {leaderboardData[1]?.badges?.firstBlood && (
                    <div style={{
                      background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)',
                      borderRadius: '4px',
                      padding: '3px 6px',
                      fontSize: '0.65rem',
                      color: 'white',
                      fontWeight: '600'
                    }} title="First verified bug">🩸</div>
                  )}
                  {leaderboardData[1]?.badges?.bugHunter && (
                    <div style={{
                      background: 'linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)',
                      borderRadius: '4px',
                      padding: '3px 6px',
                      fontSize: '0.65rem',
                      color: 'white',
                      fontWeight: '600'
                    }} title="10+ verified bugs">🐛</div>
                  )}
                  {leaderboardData[1]?.badges?.eliteTester && (
                    <div style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '4px',
                      padding: '3px 6px',
                      fontSize: '0.65rem',
                      color: 'white',
                      fontWeight: '600'
                    }} title="100+ verified bugs">👑</div>
                  )}
                </div>
              )}

              <div style={{
                color: '#C0C0C0',
                fontSize: '0.9rem',
                marginBottom: '5px',
                fontFamily: 'DM Sans, sans-serif'
              }}>{leaderboardData[1]?.projectsParticipated} Projects</div>
              <div style={{
                color: '#C0C0C0',
                fontSize: '1.3rem',
                fontWeight: '700',
                fontFamily: 'Sansita, sans-serif'
              }}>{leaderboardData[1]?.points.toLocaleString()} credits</div>
            </div>

            {/* Silver Pillar */}
            <div style={{
              position: 'relative',
              width: '200px',
              height: '120px'
            }}>
              {/* Angled top with flat surface */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                left: '0',
                width: '200px',
                height: '20px',
                background: 'linear-gradient(180deg, #0B0D16 9%, #181C2A 100%)',
                clipPath: 'polygon(0% 100%, 200px 100%, 170px 0%, 30px 0%)',
                zIndex: 2
              }}></div>

              {/* Main pillar */}
              <div style={{
                width: '200px',
                height: '180px',
                background: 'linear-gradient(180deg, #252C41 0%, #0F1118 45%, #0E0F15 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1
              }}>
              </div>
            </div>
          </div>
          )}

          {/* First Place */}
          {leaderboardData[0] && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}>
            {/* User on top */}
            <div style={{
              textAlign: 'center',
              marginBottom: '20px',
              position: 'relative'
            }}>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                color: 'white',
                marginBottom: '15px',
                fontFamily: 'Sansita, sans-serif'
              }}>Bug Conqueror</div>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundImage: `url(${leaderboardData[0]?.avatar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                margin: '0 auto 15px',
                border: '4px solid #FFD700',
                boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)'
              }}></div>
              <h4 style={{
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: '700',
                marginBottom: '10px',
                fontFamily: 'DM Sans, sans-serif'
              }}>{leaderboardData[0]?.username}</h4>

              {/* Badges */}
              {(leaderboardData[0]?.badges?.firstBlood || leaderboardData[0]?.badges?.bugHunter || leaderboardData[0]?.badges?.eliteTester) && (
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {leaderboardData[0]?.badges?.firstBlood && (
                    <div style={{
                      background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      color: 'white',
                      fontWeight: '600'
                    }} title="First verified bug">🩸</div>
                  )}
                  {leaderboardData[0]?.badges?.bugHunter && (
                    <div style={{
                      background: 'linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      color: 'white',
                      fontWeight: '600'
                    }} title="10+ verified bugs">🐛</div>
                  )}
                  {leaderboardData[0]?.badges?.eliteTester && (
                    <div style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      color: 'white',
                      fontWeight: '600'
                    }} title="100+ verified bugs">👑</div>
                  )}
                </div>
              )}

              <div style={{
                color: 'white',
                fontSize: '1rem',
                marginBottom: '8px',
                fontFamily: 'DM Sans, sans-serif'
              }}>{leaderboardData[0]?.projectsParticipated} Projects</div>
              <div style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: '700',
                fontFamily: 'Sansita, sans-serif'
              }}>{leaderboardData[0]?.points.toLocaleString()} credits</div>
            </div>

            {/* Gold Pillar */}
            <div style={{
              position: 'relative',
              width: '220px',
              height: '160px'
            }}>
              {/* Angled top with flat surface */}
              <div style={{
                position: 'absolute',
                top: '-22px',
                left: '0',
                width: '220px',
                height: '22px',
                background: 'linear-gradient(180deg, #0B0D16 9%, #181C2A 100%)',
                clipPath: 'polygon(0% 100%, 220px 100%, 185px 0%, 35px 0%)',
                zIndex: 2
              }}></div>

              {/* Main pillar */}
              <div style={{
                width: '220px',
                height: '220px',
                background: 'linear-gradient(180deg, #252C41 0%, #0F1118 45%, #0E0F15 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1
              }}>
              </div>

              {/* Extension box */}
              <div style={{
                width: '220px',
                height: '40px',
                background: '#1A1A1A',
                position: 'relative',
                zIndex: -1
              }}></div>
            </div>
          </div>
          )}

          {/* Third Place */}
          {leaderboardData[2] && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}>
            {/* User on top */}
            <div style={{
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: '700',
                color: 'white',
                marginBottom: '15px',
                fontFamily: 'Sansita, sans-serif'
              }}>Cyber Warrior</div>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                backgroundImage: `url(${leaderboardData[2]?.avatar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                margin: '0 auto 12px',
                border: '3px solid #CD7F32'
              }}></div>
              <h4 style={{
                color: 'white',
                fontSize: '1rem',
                fontWeight: '700',
                marginBottom: '8px',
                fontFamily: 'DM Sans, sans-serif'
              }}>{leaderboardData[2]?.username}</h4>

              {/* Badges */}
              {(leaderboardData[2]?.badges?.firstBlood || leaderboardData[2]?.badges?.bugHunter || leaderboardData[2]?.badges?.eliteTester) && (
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {leaderboardData[2]?.badges?.firstBlood && (
                    <div style={{
                      background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)',
                      borderRadius: '4px',
                      padding: '3px 6px',
                      fontSize: '0.65rem',
                      color: 'white',
                      fontWeight: '600'
                    }} title="First verified bug">🩸</div>
                  )}
                  {leaderboardData[2]?.badges?.bugHunter && (
                    <div style={{
                      background: 'linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)',
                      borderRadius: '4px',
                      padding: '3px 6px',
                      fontSize: '0.65rem',
                      color: 'white',
                      fontWeight: '600'
                    }} title="10+ verified bugs">🐛</div>
                  )}
                  {leaderboardData[2]?.badges?.eliteTester && (
                    <div style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '4px',
                      padding: '3px 6px',
                      fontSize: '0.65rem',
                      color: 'white',
                      fontWeight: '600'
                    }} title="100+ verified bugs">👑</div>
                  )}
                </div>
              )}

              <div style={{
                color: 'white',
                fontSize: '0.9rem',
                marginBottom: '5px',
                fontFamily: 'DM Sans, sans-serif'
              }}>{leaderboardData[2]?.projectsParticipated} Projects</div>
              <div style={{
                color: 'white',
                fontSize: '1.3rem',
                fontWeight: '700',
                fontFamily: 'Sansita, sans-serif'
              }}>{leaderboardData[2]?.points.toLocaleString()} credits</div>
            </div>

            {/* Bronze Pillar */}
            <div style={{
              position: 'relative',
              width: '200px',
              height: '90px'
            }}>
              {/* Angled top with flat surface */}
              <div style={{
                position: 'absolute',
                top: '-18px',
                left: '0',
                width: '200px',
                height: '18px',
                background: 'linear-gradient(180deg, #0B0D16 9%, #181C2A 100%)',
                clipPath: 'polygon(0% 100%, 200px 100%, 170px 0%, 30px 0%)',
                zIndex: 2
              }}></div>

              {/* Main pillar */}
              <div style={{
                width: '200px',
                height: '150px',
                background: 'linear-gradient(180deg, #252C41 0%, #0F1118 45%, #0E0F15 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1
              }}>
              </div>
            </div>
          </div>
          )}
        </div>

      {/* Leaderboard Table */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: theme.cardBackground,
        borderRadius: '12px',
        padding: '20px',
        transition: 'background-color 0.3s ease'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #3C4043' }}>
              <th style={{ color: '#888', padding: '15px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '500', fontFamily: 'DM Sans, sans-serif' }}>Rank</th>
              <th style={{ color: '#888', padding: '15px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '500', fontFamily: 'DM Sans, sans-serif' }}>User name</th>
              <th style={{ color: '#888', padding: '15px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '500', fontFamily: 'DM Sans, sans-serif' }}>Projects Participated</th>
              <th style={{ color: '#888', padding: '15px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '500', fontFamily: 'DM Sans, sans-serif' }}>Total Credits Acquired</th>
              <th style={{ color: '#888', padding: '15px', textAlign: 'right', fontSize: '0.85rem', fontWeight: '500', fontFamily: 'DM Sans, sans-serif' }}>Credits</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((user, index) => (
              <tr key={user.id} style={{
                borderBottom: index < leaderboardData.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>

                {/* Rank */}
                <td style={{ padding: '20px 15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: index < 3 ?
                        (index === 0 ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
                         index === 1 ? 'linear-gradient(135deg, #C0C0C0, #A9A9A9)' :
                         'linear-gradient(135deg, #CD7F32, #B8860B)') :
                        'linear-gradient(135deg, #4ECDC4, #44A08D)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                  </div>
                </td>

                {/* User */}
                <td style={{ padding: '20px 15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundImage: `url(${user.avatar})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      border: '2px solid rgba(255, 255, 255, 0.1)'
                    }}></div>
                    <span style={{
                      color: theme.textPrimary,
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      fontFamily: 'DM Sans, sans-serif',
                      transition: 'color 0.3s ease'
                    }}>
                      {user.username}
                    </span>
                  </div>
                </td>

                {/* Projects */}
                <td style={{ padding: '20px 15px', textAlign: 'center' }}>
                  <span style={{
                    color: theme.textPrimary,
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'color 0.3s ease'
                  }}>
                    {user.projectsParticipated}
                  </span>
                </td>

                {/* Total Credits Acquired */}
                <td style={{ padding: '20px 15px', textAlign: 'center' }}>
                  <span style={{
                    color: '#4ECDC4',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    fontFamily: 'DM Sans, sans-serif'
                  }}>
                    {user.totalCreditsAcquired.toLocaleString()} credits
                  </span>
                </td>

                {/* Credits */}
                <td style={{ padding: '20px 15px', textAlign: 'right' }}>
                  <span style={{
                    color: '#4ECDC4',
                    fontSize: '1rem',
                    fontWeight: '700',
                    fontFamily: 'Sansita, sans-serif'
                  }}>
                    {user.points.toLocaleString()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      </>
        )}

      </div>

      {/* Red glow effect at top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        height: '300px',
        background: 'radial-gradient(ellipse at center top, rgba(220, 38, 38, 0.4) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>
    </div>
  );
}

export default Leaderboards;