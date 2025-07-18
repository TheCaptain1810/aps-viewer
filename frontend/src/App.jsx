import { useEffect, useState, useRef } from "react";
import { initTree } from "./utils/sidebar";
import { initViewer, loadModel } from "./utils/viewer";
import { useAuth } from "./hooks/useAuth";
import Header from "./components/Header";
import ErrorBoundary from "./components/ErrorBoundary";
import WelcomeScreen from "./components/WelcomeScreen";
import BucketManager from "./components/BucketManager";

function App() {
  const { user, isLoading, error, login, logout } = useAuth();
  const [initError, setInitError] = useState(null);
  const [viewMode, setViewMode] = useState("tree"); // 'tree' or 'bucket'
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
            <div style={{ padding: "1rem", borderBottom: "1px solid #ddd" }}>
              <button
                onClick={() => setViewMode("tree")}
                style={{
                  marginRight: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: viewMode === "tree" ? "#1976d2" : "#f5f5f5",
                  color: viewMode === "tree" ? "white" : "#333",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Tree View
              </button>
              <button
                onClick={() => setViewMode("bucket")}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor:
                    viewMode === "bucket" ? "#1976d2" : "#f5f5f5",
                  color: viewMode === "bucket" ? "white" : "#333",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Bucket Manager
              </button>
            </div>

            {viewMode === "tree" ? (
              <div ref={treeRef} id="tree"></div>
            ) : (
              <BucketManager viewer={viewerRef.current} />
            )}
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
