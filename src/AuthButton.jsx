import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useRef } from 'react';

function getDisplayName(u) {
  if (!u) return 'User';

  if (u.given_name || u.family_name) {
    return `${u.given_name || ''} ${u.family_name || ''}`.trim();
  }

  if (u.name && !u.name.includes('@')) {
    return u.name;
  }

  const prefix = (u.nickname || u.email?.split('@')[0] || '').replace(/[0-9_.-]/g, ' ').trim();
  return prefix
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ') || 'User';
}

function AuthButton() {
  const {
    isLoading,
    isAuthenticated,
    loginWithRedirect,
    logout,
    user,
  } = useAuth0();
  const containerRef = useRef(null);
  const displayName = getDisplayName(user);

  // Safely create icons avoiding React DOM drift errors
  useEffect(() => {
    if (window.lucide && containerRef.current) {
      window.lucide.createIcons({
        root: containerRef.current
      });
    }
  });

  useEffect(() => {
    const authContext = isAuthenticated
      ? {
          userId: user?.sub || '',
          name: displayName,
          email: user?.email || '',
        }
      : {
          userId: '',
          name: '',
          email: '',
        };

    window.freshbyteAuth = authContext;
    window.dispatchEvent(new CustomEvent('freshbyte-auth-changed', { detail: authContext }));
  }, [displayName, isAuthenticated, user]);

  if (isLoading) {
    return (
      <div ref={containerRef}>
        <button className="navbar-auth" disabled>
          <i data-lucide="loader"></i> Loading...
        </button>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div ref={containerRef} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.9rem', color: '#4b5563', fontWeight: '500' }}>{displayName}</span>
        <button 
          className="navbar-auth" 
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        >
          <i data-lucide="log-out"></i> Logout
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <button 
        className="navbar-auth" 
        onClick={() => loginWithRedirect()}
      >
        <i data-lucide="log-in"></i> Login / Register
      </button>
    </div>
  );
}

export default AuthButton;