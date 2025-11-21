import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { ChatProvider } from "./contexts/ChatContext.tsx";

// Initialize the app with our custom auth
const initApp = () => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AuthProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </AuthProvider>
    </StrictMode>
  );
};

// Start the app
initApp();
