import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThirdwebProvider } from 'thirdweb/react'
import { createThirdwebClient } from 'thirdweb'
import App from './App'
import './index.css'

// Initialize the thirdweb client
const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID as string,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="dark">
      <ThirdwebProvider>
        <App />
      </ThirdwebProvider>
    </div>
  </React.StrictMode>,
)

