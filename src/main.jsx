import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import AuthButton from './AuthButton.jsx'

const authRoot = document.getElementById('auth-root');
if (authRoot) {
  createRoot(authRoot).render(
    <StrictMode>
      <Auth0Provider
        domain="freshbyte.us.auth0.com"
        clientId="hx8oY97MMIB283C3KphLSQyKA9JSY1au"
        authorizationParams={{ redirect_uri: window.location.origin }}
        cacheLocation="localstorage"
        useRefreshTokens={true}
        onRedirectCallback={() => {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }}
      >
        <AuthButton />
      </Auth0Provider>
    </StrictMode>,
  )
}
