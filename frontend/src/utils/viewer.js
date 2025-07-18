const { Autodesk } = window;
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";

async function getAccessToken(callback) {
  try {
    const resp = await fetch(`${SERVER_URL}/api/auth/token`, {
      credentials: "include", // Include cookies for session
    });
    if (!resp.ok) throw new Error(await resp.text());
    const { access_token, expires_in } = await resp.json();
    callback(access_token, expires_in);
  } catch (err) {
    alert("Could not obtain access token. See the console for more details.");
    console.error(err);
  }
}

export function initViewer(container) {
  return new Promise(function (resolve) {
    Autodesk.Viewing.Initializer(
      { env: "AutodeskProduction", getAccessToken },
      function () {
        const config = {
          extensions: ["Autodesk.DocumentBrowser"],
        };
        const viewer = new Autodesk.Viewing.GuiViewer3D(container, config);
        viewer.start();
        viewer.setTheme("light-theme");
        resolve(viewer);
      }
    );
  });
}

export function loadModel(viewer, urn) {
  function onDocumentLoadSuccess(doc) {
    const viewables = doc.getRoot().getDefaultGeometry();
    viewer.loadDocumentNode(doc, viewables);
  }

  function onDocumentLoadFailure(code, message) {
    console.error("Document load failed:", { code, message });
    alert("Could not load model. See console for more details.");
  }

  const documentId = "urn:" + urn;

  Autodesk.Viewing.Document.load(
    documentId,
    onDocumentLoadSuccess,
    onDocumentLoadFailure
  );
}
