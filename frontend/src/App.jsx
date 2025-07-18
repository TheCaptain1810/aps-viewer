import { useEffect } from "react";
import { initTree } from "./utils/sidebar";
import { initViewer, loadModel } from "./utils/viewer";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

function App() {
  useEffect(() => {
    async function initializeApp() {
      const login = document.getElementById("login");
      try {
        const resp = await fetch(`${SERVER_URL}/api/auth/profile`, {
          credentials: "include", // Include cookies for session
        });
        if (resp.ok) {
          const user = await resp.json();
          login.innerText = `Logout (${user.name})`;
          login.onclick = () => {
            const iframe = document.createElement("iframe");
            iframe.style.visibility = "hidden";
            iframe.src = "https://accounts.autodesk.com/Authentication/LogOut";
            document.body.appendChild(iframe);
            iframe.onload = () => {
              window.location.replace(`${SERVER_URL}/api/auth/logout`);
              document.body.removeChild(iframe);
            };
          };
          const viewer = await initViewer(document.getElementById("preview"));
          initTree("#tree", (urn) => {
            loadModel(viewer, urn);
          });
        } else {
          login.innerText = "Login";
          login.onclick = () =>
            window.location.replace(`${SERVER_URL}/api/auth/login`);
        }
        login.style.visibility = "visible";
      } catch (err) {
        alert(
          "Could not initialize the application. See console for more details."
        );
        console.error(err);
      }
    }

    initializeApp();
  }, []);

  return (
    <>
      <div id="header">
        <img
          className="logo"
          src="https://cdn.autodesk.io/logo/black/stacked.png"
          alt="Autodesk Platform Services"
        />
        <span className="title">Hubs Browser</span>
        <button id="login" style={{ visibility: "hidden" }}>
          Login
        </button>
      </div>
      <div id="sidebar">
        <div id="tree"></div>
      </div>
      <div id="preview"></div>
    </>
  );
}

export default App;
