import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible((prev) => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting,
          }));
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleGetStarted = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleIHaveAccount = () => {
    navigate('/login');
  };

  const features = [
    {
      icon: 'petition',
      title: 'Create Petitions',
      description: 'Easily draft and launch petitions to bring important local issues to the attention of officials and neighbors.',
      color: 'blue',
    },
    {
      icon: 'community',
      title: 'Engage Locally',
      description: "Join discussions, see what's happening in your area, and become an active voice in your community.",
      color: 'purple',
    },
    {
      icon: 'impact',
      title: 'Drive Real Change',
      description: 'Connect directly with decision-makers and hold them accountable, turning community ideas into action.',
      color: 'orange',
    },
  ];

  const heroFeatures = [
    'Connect with 10,000+ active citizens',
    'Launch petitions in minutes',
    'Direct access to decision-makers',
  ];

  const stats = [
    { icon: 'flash', value: '50K+', label: 'Petitions Created' },
    { icon: 'users', value: '100K+', label: 'Active Citizens' },
    { icon: 'growth', value: '85%', label: 'Success Rate' },
    { icon: 'support', value: '24/7', label: 'Support Available' },
  ];

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="Civix Logo" className="navbar-logo" />
            <span className="brand-text">Civix</span>
          </div>
          
          <div className="navbar-actions">
            <button className="btn-login" onClick={handleLogin}>Login</button>
            <button className="btn-signup" onClick={handleGetStarted}>Sign up</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-background">
          <div className="particles">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  width: Math.random() * 4 + 2 + 'px',
                  height: Math.random() * 4 + 2 + 'px',
                  top: Math.random() * 100 + '%',
                  left: Math.random() * 100 + '%',
                  animationDelay: Math.random() * 3 + 's',
                  animationDuration: Math.random() * 3 + 2 + 's',
                }}
              />
            ))}
          </div>
        </div>

        <div className="hero-content">
          <div className="hero-grid">
            <div className="hero-text">
              <div className="hero-badge">
                <svg className="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Digital Civic Engagement Platform</span>
              </div>
              
              <h1 className="hero-title">
                Shape Your Community with{' '}
                <span className="hero-title-gradient">Civix</span>
              </h1>
              
              <p className="hero-description">
                Voice your opinions, start petitions, and connect with local officials. The digital platform making civic engagement simple and impactful.
              </p>
              
              <div className="hero-features">
                {heroFeatures.map((text, idx) => (
                  <div
                    key={idx}
                    className="hero-feature-item"
                    style={{ animationDelay: `${idx * 0.2}s` }}
                  >
                    <svg className="check-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z"/>
                    </svg>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              
              <div className="hero-buttons">
                <button className="btn-primary" onClick={handleGetStarted}>
                  <span>Get Started Free</span>
                  <svg className="btn-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button className="btn-secondary" onClick={handleIHaveAccount}>I have an account</button>
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="visual-bg-blur"></div>
              <div className="visual-card">
                <img src="/logo.png" alt="Civix Community" className="hero-logo" />
              </div>
            </div>
          </div>
        </div>

        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F0F4FF"/>
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section" id="features" data-animate>
        <div className="section-header">
          <div className="section-badge">Why Choose Civix</div>
          <h2 className="section-title">Empower Your Voice</h2>
          <p className="section-description">
            Everything you need to make a real difference in your community
          </p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`feature-card feature-card-${feature.color} ${
                isVisible.features ? 'animate-slide-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${idx * 0.2}s` }}
            >
              <div className={`feature-icon-wrapper feature-icon-bg-${feature.color}`}>
                {feature.icon === 'petition' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {feature.icon === 'community' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
                {feature.icon === 'impact' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                )}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <button className={`feature-link feature-link-${feature.color}`}>
                <span>Learn more</span>
                <svg className="link-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section" id="stats" data-animate>
        <div className="stats-content">
          <div className={`stats-grid ${isVisible.stats ? 'animate-fade-in' : 'opacity-0'}`}>
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="stat-item"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="stat-icon-wrapper">
                  <div className="stat-icon-bg">
                    {stat.icon === 'flash' && (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 9V3L3 13h7v8l10-10h-7z"/>
                      </svg>
                    )}
                    {stat.icon === 'users' && (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58A2.01 2.01 0 000 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85A6.95 6.95 0 0020 14c-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>
                      </svg>
                    )}
                    {stat.icon === 'growth' && (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/>
                      </svg>
                    )}
                    {stat.icon === 'support' && (
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                      </svg>
                    )}
                  </div>
                </div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="cta-section">
        <h2 className="cta-title">Ready to Make a Difference?</h2>
        <p className="cta-description">
          Join thousands of citizens creating positive change in their communities
        </p>
        <button className="cta-button" onClick={handleGetStarted}>Get Started Today</button>
      </div>
    </div>
  );
}