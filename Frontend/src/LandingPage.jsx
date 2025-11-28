import React, { useState, useEffect } from "react";

function LandingPage({ onGetStarted }) {
  const [scrollY, setScrollY] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Background images related to security testing and bug bounty
  const backgroundImages = [
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&q=80', // Code on screen
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1920&q=80', // Abstract tech
    'https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=1920&q=80', // Coding laptop
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1920&q=80', // Binary code
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1920&q=80'  // Developer workspace
  ];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === backgroundImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  return (
    <div style={{
      backgroundColor: '#0A0E1A',
      minHeight: '100vh',
      color: 'white'
    }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: scrollY > 50 ? 'rgba(10, 14, 26, 0.95)' : 'transparent',
        backdropFilter: scrollY > 50 ? 'blur(10px)' : 'none',
        padding: '20px 5%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        boxShadow: scrollY > 50 ? '0 4px 20px rgba(0, 0, 0, 0.3)' : 'none'
      }}>
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          letterSpacing: '2px',
          background: 'linear-gradient(45deg, #00D4FF, #00FF88)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          TESTQUEST
        </h1>

        <button
          onClick={onGetStarted}
          style={{
            padding: '12px 30px',
            backgroundColor: '#7C3AED',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#6B2FD6';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#7C3AED';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 15px rgba(124, 58, 237, 0.4)';
          }}
        >
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 5%',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Slideshow */}
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: currentImageIndex === index ? 1 : 0,
              transition: 'opacity 2s ease-in-out',
              zIndex: 0
            }}
          />
        ))}

        {/* Dark Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, rgba(10, 14, 26, 0.7) 0%, rgba(10, 14, 26, 0.85) 70%)',
          zIndex: 1
        }} />

        {/* Purple Gradient Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.25) 0%, transparent 70%)',
          zIndex: 2
        }} />
        <div style={{
          maxWidth: '900px',
          animation: 'fadeInUp 1s ease-out',
          position: 'relative',
          zIndex: 3
        }}>
          <h2 style={{
            fontSize: '3.5rem',
            fontWeight: 'bold',
            marginBottom: '20px',
            lineHeight: '1.2'
          }}>
            Secure the Digital World,
            <br />
            <span style={{
              background: 'linear-gradient(45deg, #00D4FF, #00FF88)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              One Bug at a Time
            </span>
          </h2>

          <p style={{
            fontSize: '1.3rem',
            marginBottom: '40px',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.6'
          }}>
            Connect developers with elite security testers to build more secure applications.
            Find vulnerabilities before they become threats.
          </p>

          <button
            onClick={onGetStarted}
            style={{
              padding: '16px 50px',
              backgroundColor: '#7C3AED',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.2rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 30px rgba(124, 58, 237, 0.5)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#6B2FD6';
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 40px rgba(124, 58, 237, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#7C3AED';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 30px rgba(124, 58, 237, 0.5)';
            }}
          >
            Start Testing Now
          </button>
        </div>

        {/* Scroll Indicator */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          animation: 'bounce 2s infinite',
          zIndex: 3
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </section>


      {/* Features Section */}
      <section style={{
        padding: '100px 5%',
        backgroundColor: 'rgba(20, 24, 36, 0.5)'
      }}>
        <h3 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          Why Choose TestQuest?
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Feature 1 */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '40px',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-10px)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = '#7C3AED';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🛡️</div>
            <h4 style={{ fontSize: '1.5rem', marginBottom: '15px', fontWeight: '600' }}>
              Enterprise Security
            </h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.6' }}>
              Professional-grade security testing with comprehensive vulnerability detection and detailed reporting.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '40px',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-10px)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = '#7C3AED';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👥</div>
            <h4 style={{ fontSize: '1.5rem', marginBottom: '15px', fontWeight: '600' }}>
              Expert Community
            </h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.6' }}>
              Connect with top security researchers and ethical hackers from around the world.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '40px',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-10px)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = '#7C3AED';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🏆</div>
            <h4 style={{ fontSize: '1.5rem', marginBottom: '15px', fontWeight: '600' }}>
              Competitive Rewards
            </h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.6' }}>
              Earn competitive bounties for finding vulnerabilities and climb the leaderboards.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={{
        padding: '100px 5%',
        backgroundColor: 'rgba(10, 14, 26, 1)'
      }}>
        <h3 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          How It Works
        </h3>

        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px'
        }}>
          {/* Step 1 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '40px',
            padding: '30px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              fontSize: '3rem',
              backgroundColor: '#7C3AED',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              1
            </div>
            <div>
              <h4 style={{ fontSize: '1.5rem', marginBottom: '10px', fontWeight: '600' }}>
                Choose Your Role
              </h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.6' }}>
                Sign up as a Developer to get your app tested, or as a Tester to find bugs and earn rewards.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '40px',
            padding: '30px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              fontSize: '3rem',
              backgroundColor: '#00D4FF',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: '#0A0E1A',
              flexShrink: 0
            }}>
              2
            </div>
            <div>
              <h4 style={{ fontSize: '1.5rem', marginBottom: '10px', fontWeight: '600' }}>
                Post or Browse Projects
              </h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.6' }}>
                Developers post projects with bounties. Testers browse available projects and start testing.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '40px',
            padding: '30px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '15px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              fontSize: '3rem',
              backgroundColor: '#00FF88',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: '#0A0E1A',
              flexShrink: 0
            }}>
              3
            </div>
            <div>
              <h4 style={{ fontSize: '1.5rem', marginBottom: '10px', fontWeight: '600' }}>
                Report & Get Rewarded
              </h4>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.6' }}>
                Submit detailed bug reports, get verified by developers, and receive instant payments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '100px 5%',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.2) 0%, transparent 70%)'
      }}>
        <h3 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '20px'
        }}>
          Ready to Get Started?
        </h3>
        <p style={{
          fontSize: '1.2rem',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '40px'
        }}>
          Join thousands of developers and security researchers making the web safer.
        </p>
        <button
          onClick={onGetStarted}
          style={{
            padding: '16px 50px',
            backgroundColor: '#7C3AED',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1.2rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 30px rgba(124, 58, 237, 0.5)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#6B2FD6';
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.boxShadow = '0 12px 40px rgba(124, 58, 237, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#7C3AED';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 30px rgba(124, 58, 237, 0.5)';
          }}
        >
          Join TestQuest Today
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 5%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>
          © 2025 TestQuest. All rights reserved.
        </p>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}

export default LandingPage;
