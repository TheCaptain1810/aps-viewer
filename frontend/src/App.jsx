import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/Header";
import ViewerInitializer from "./components/ViewerInitializer";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";

const AppContent = () => {
  const { isAuthenticated, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Initializing APS Viewer...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return (
    <>
      <Header />
      <div id="preview"></div>
      <div id="overlay"></div>
      <Sidebar>
        <ViewerInitializer />
      </Sidebar>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
