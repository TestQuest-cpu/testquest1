import React, { useState } from 'react';

function ModeratorExam({ onBack, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    {
      id: 1,
      question: "What is the primary role of a moderator on TestQuest?",
      options: [
        "To find bugs in projects",
        "To review and resolve disputes between testers and developers",
        "To develop new features for the platform",
        "To approve all bug reports automatically"
      ],
      correct: 1
    },
    {
      id: 2,
      question: "When reviewing a project dispute, what should be your first step?",
      options: [
        "Immediately side with the developer",
        "Immediately side with the tester",
        "Carefully review all evidence and communication from both parties",
        "Reject the dispute to save time"
      ],
      correct: 2
    },
    {
      id: 3,
      question: "A tester submits a dispute claiming a bug was unfairly rejected. What should you do?",
      options: [
        "Auto-approve the bug report",
        "Dismiss the dispute without review",
        "Review the bug report details, developer's rejection reason, and platform guidelines",
        "Ask the tester to resubmit the bug"
      ],
      correct: 2
    },
    {
      id: 4,
      question: "How should moderators handle conflicts of interest?",
      options: [
        "Proceed anyway if no one notices",
        "Recuse yourself from disputes involving friends or known parties",
        "Only recuse if both parties complain",
        "Moderators never have conflicts of interest"
      ],
      correct: 1
    },
    {
      id: 5,
      question: "What is the appropriate way to communicate a dispute resolution?",
      options: [
        "Send a one-word response",
        "Provide a clear, detailed explanation citing platform rules and evidence",
        "Don't explain, just mark it resolved",
        "Only explain if the user complains"
      ],
      correct: 1
    },
    {
      id: 6,
      question: "A developer is repeatedly rejecting valid bug reports. What should you do?",
      options: [
        "Ignore it, it's not your problem",
        "Ban the developer immediately",
        "Document the pattern and escalate to platform administrators",
        "Tell the tester to stop submitting bugs"
      ],
      correct: 2
    },
    {
      id: 7,
      question: "What information is most important when reviewing a bug dispute?",
      options: [
        "Only the tester's complaint",
        "Only the developer's response",
        "Bug severity, reproduction steps, evidence, and both parties' arguments",
        "The reputation scores of both parties"
      ],
      correct: 2
    },
    {
      id: 8,
      question: "How should you prioritize disputes in your queue?",
      options: [
        "Random order",
        "Always help developers first",
        "By urgency/priority level and submission time",
        "Only handle disputes from high-reputation users"
      ],
      correct: 2
    },
    {
      id: 9,
      question: "A tester is using abusive language in a dispute. What should you do?",
      options: [
        "Respond with abusive language back",
        "Ignore the dispute entirely",
        "Address the dispute professionally and report the behavior if it violates platform rules",
        "Automatically rule against them"
      ],
      correct: 2
    },
    {
      id: 10,
      question: "What should you do if you're unsure about how to resolve a complex dispute?",
      options: [
        "Guess and hope for the best",
        "Dismiss it to avoid making a mistake",
        "Consult platform guidelines and escalate to senior moderators if needed",
        "Ask the users to resolve it themselves"
      ],
      correct: 2
    },
    {
      id: 11,
      question: "How should moderators maintain impartiality?",
      options: [
        "Always favor testers since they do the work",
        "Always favor developers since they pay for testing",
        "Base decisions solely on evidence and platform guidelines, regardless of personal feelings",
        "Alternate between favoring testers and developers"
      ],
      correct: 2
    },
    {
      id: 12,
      question: "What is the best practice for handling duplicate disputes?",
      options: [
        "Resolve each one separately with different outcomes",
        "Ignore all duplicates",
        "Consolidate related disputes and apply consistent resolution",
        "Only resolve the first one submitted"
      ],
      correct: 2
    },
    {
      id: 13,
      question: "When should a dispute be marked as 'investigating'?",
      options: [
        "Never, always resolve immediately",
        "When you need more time to gather information or clarification from parties",
        "Only if the user specifically requests it",
        "When you don't want to deal with it"
      ],
      correct: 1
    },
    {
      id: 14,
      question: "What is the minimum passing score for this moderator exam?",
      options: [
        "50%",
        "60%",
        "80%",
        "100%"
      ],
      correct: 2
    },
    {
      id: 15,
      question: "As a moderator, confidentiality is important. What should you do with dispute information?",
      options: [
        "Share interesting disputes on social media",
        "Keep dispute details confidential and only share with authorized platform staff",
        "Discuss disputes with friends to get their opinion",
        "Post screenshots in public forums"
      ],
      correct: 1
    }
  ];

  const handleAnswer = (optionIndex) => {
    setAnswers({
      ...answers,
      [currentQuestion]: optionIndex
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    // Calculate score
    let correctAnswers = 0;
    questions.forEach((q, index) => {
      if (answers[index] === q.correct) {
        correctAnswers++;
      }
    });

    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    setScore(finalScore);
    setShowResults(true);
  };

  const handleSendApplication = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (!token) {
        alert('Please log in to submit application');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')}/api/user-profile?action=moderator-application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          examScore: score
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Application submitted successfully! The admin will review your application.');
        onComplete && onComplete(score);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application. Please try again.');
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
  };

  if (showResults) {
    const passed = score >= 80;

    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0E0F15',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          backgroundColor: '#1A1A1A',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'center',
          border: passed ? '2px solid #10B981' : '2px solid #EF4444'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
            {passed ? '🎉' : '😔'}
          </div>

          <h2 style={{
            color: 'white',
            fontSize: '2rem',
            marginBottom: '16px',
            fontFamily: 'Sansita, sans-serif'
          }}>
            {passed ? 'Congratulations!' : 'Not Quite There'}
          </h2>

          <p style={{
            color: '#888',
            fontSize: '1.1rem',
            marginBottom: '24px'
          }}>
            You scored <span style={{ color: passed ? '#10B981' : '#EF4444', fontSize: '2rem', fontWeight: 'bold' }}>{score}%</span>
          </p>

          {passed ? (
            <>
              <p style={{
                color: 'white',
                fontSize: '1rem',
                marginBottom: '32px',
                lineHeight: '1.6'
              }}>
                You've passed the moderator exam! You now have the knowledge to help maintain fairness and resolve disputes on TestQuest.
              </p>

              <button
                onClick={handleSendApplication}
                style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px 32px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginRight: '12px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Send Application to Admin
              </button>
            </>
          ) : (
            <>
              <p style={{
                color: 'white',
                fontSize: '1rem',
                marginBottom: '32px',
                lineHeight: '1.6'
              }}>
                You need at least 80% to pass. Review the platform guidelines and try again when you're ready.
              </p>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={handleRetry}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '14px 32px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  Try Again
                </button>

                <button
                  onClick={onBack}
                  style={{
                    background: '#2A2A2A',
                    color: 'white',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    padding: '14px 32px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#3A3A3A';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#2A2A2A';
                  }}
                >
                  Back to Profile
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0E0F15',
      padding: '40px 20px'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto 40px',
        textAlign: 'center'
      }}>
        <h1 style={{
          color: 'white',
          fontSize: '2.5rem',
          marginBottom: '8px',
          fontFamily: 'Sansita, sans-serif'
        }}>
          🛡️ Moderator Certification Exam
        </h1>
        <p style={{
          color: '#888',
          fontSize: '1rem',
          marginBottom: '24px'
        }}>
          Passing score: 80% • {questions.length} Questions
        </p>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#2A2A2A',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            transition: 'width 0.3s ease'
          }}></div>
        </div>

        <div style={{
          color: '#888',
          fontSize: '0.9rem',
          marginTop: '8px'
        }}>
          Question {currentQuestion + 1} of {questions.length}
        </div>
      </div>

      {/* Question Card */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#1A1A1A',
        borderRadius: '16px',
        padding: '40px',
        border: '1px solid #2A2A2A'
      }}>
        <h2 style={{
          color: 'white',
          fontSize: '1.5rem',
          marginBottom: '32px',
          lineHeight: '1.5',
          fontWeight: '600'
        }}>
          {currentQ.question}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {currentQ.options.map((option, index) => (
            <div
              key={index}
              onClick={() => handleAnswer(index)}
              style={{
                backgroundColor: answers[currentQuestion] === index ? '#667eea' : '#2A2A2A',
                border: answers[currentQuestion] === index ? '2px solid #764ba2' : '2px solid transparent',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                color: 'white',
                fontSize: '1rem'
              }}
              onMouseEnter={(e) => {
                if (answers[currentQuestion] !== index) {
                  e.target.style.backgroundColor = '#3A3A3A';
                }
              }}
              onMouseLeave={(e) => {
                if (answers[currentQuestion] !== index) {
                  e.target.style.backgroundColor = '#2A2A2A';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: answers[currentQuestion] === index ? '2px solid white' : '2px solid #666',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {answers[currentQuestion] === index && (
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: 'white'
                    }}></div>
                  )}
                </div>
                <span>{option}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div style={{
          marginTop: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={onBack}
            style={{
              background: '#2A2A2A',
              color: '#888',
              border: '1px solid #404040',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#3A3A3A';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#2A2A2A';
              e.target.style.color = '#888';
            }}
          >
            Exit Exam
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            {currentQuestion > 0 && (
              <button
                onClick={handlePrevious}
                style={{
                  background: '#2A2A2A',
                  color: 'white',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#3A3A3A';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#2A2A2A';
                }}
              >
                ← Previous
              </button>
            )}

            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={answers[currentQuestion] === undefined}
                style={{
                  background: answers[currentQuestion] !== undefined
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#2A2A2A',
                  color: answers[currentQuestion] !== undefined ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: answers[currentQuestion] !== undefined ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (answers[currentQuestion] !== undefined) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length !== questions.length}
                style={{
                  background: Object.keys(answers).length === questions.length
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : '#2A2A2A',
                  color: Object.keys(answers).length === questions.length ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: Object.keys(answers).length === questions.length ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (Object.keys(answers).length === questions.length) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModeratorExam;
