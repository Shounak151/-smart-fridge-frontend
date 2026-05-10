import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useRef } from 'react';

function AuthButton() {
  const {
    isLoading,
    isAuthenticated,
    loginWithRedirect,
    logout,
    user,
  } = useAuth0();
  const containerRef = useRef(null);

  // Safely create icons avoiding React DOM drift errors
  useEffect(() => {
    if (window.lucide && containerRef.current) {
      window.lucide.createIcons({
        root: containerRef.current
      });
    }
  });

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
    // Attempt to get the real name from Auth0 (e.g., from Google Login) or format the email prefix intelligently
    const getDisplayName = (u) => {
      if (!u) return 'User';
      // 1. Prioritize real name components from social providers
      if (u.given_name || u.family_name) {
        return `${u.given_name || ''} ${u.family_name || ''}`.trim();
      }
      // 2. Use the full name if it's provided and not just an email
      if (u.name && !u.name.includes('@')) {
        return u.name;
      }
      // 3. Fallback: optimize the email prefix by removing numbers/special chars and capitalizing
      let prefix = (u.nickname || u.email?.split('@')[0] || '').replace(/[0-9_.-]/g, ' ').trim();
      return prefix
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ') || 'User';
    };

    const displayName = getDisplayName(user);

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