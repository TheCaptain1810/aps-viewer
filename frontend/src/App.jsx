import { useEffect, useState, useRef } from "react";
import { initTree } from "./utils/sidebar";
import { initViewer, loadModel } from "./utils/viewer";
import { useAuth } from "./hooks/useAuth";
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";
import WelcomeScreen from "./components/WelcomeScreen";

function App() {
  const { user, isLoading, error, login, logout } = useAuth();
  const [initError, setInitError] = useState(null);
  const previewRef = useRef(null);
  const treeRef = useRef(null);
  const viewerRef = useRef(null);

  const handleModelSelection = (urn) => {
    if (viewerRef.current) {
      console.log("Loading model with URN:", urn);
      loadModel(viewerRef.current, urn);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  useEffect(() => {
    const initializeViewer = async () => {
      if (user && previewRef.current && treeRef.current) {
        try {
          setInitError(null);
          console.log("Initializing viewer and tree...");

          const viewer = await initViewer(previewRef.current);
          viewerRef.current = viewer;

          initTree(treeRef.current, handleModelSelection);

          console.log("Viewer and tree initialized successfully");
        } catch (err) {
          console.error("Failed to initialize viewer:", err);
          setInitError(
            "Failed to initialize 3D viewer. Please refresh the page."
          );
        }
      }
    };

    initializeViewer();
  }, [user]); // Re-run when user changes

  if (error || initError) {
    return <ErrorBoundary error={error || initError} onRetry={handleRetry} />;
  }

  return (
    <>
      <Header
        user={user}
        isLoading={isLoading}
        onLogin={login}
        onLogout={logout}
      />

      {user ? (
        <>
          <div id="sidebar">
            <div ref={treeRef} id="tree"></div>
          </div>
          <div ref={previewRef} id="preview"></div>
        </>
      ) : (
        !isLoading && <WelcomeScreen />
      )}
    </>
  );
}

export default App;
