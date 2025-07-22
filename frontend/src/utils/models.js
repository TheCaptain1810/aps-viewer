import { showNotification, clearNotification } from "./notifications";
import { loadModel } from "./viewer";

async function onModelSelected(viewer, urn) {
  if (window.onModelSelectedTimeout) {
    clearTimeout(window.onModelSelectedTimeout);
    delete window.onModelSelectedTimeout;
  }
  window.location.hash = urn;
  try {
    const resp = await fetch(`/api/models/${urn}/status`);
    if (!resp.ok) {
      throw new Error(await resp.text());
    }
    const status = await resp.json();
    switch (status.status) {
      case "n/a":
        showNotification(`Model has not been translated.`);
        break;
      case "inprogress":
        showNotification(`Model is being translated (${status.progress})...`);
        window.onModelSelectedTimeout = setTimeout(
          onModelSelected,
          5000,
          viewer,
          urn
        );
        break;
      case "failed":
        showNotification(
          `Translation failed. <ul>${status.messages
            .map((msg) => `<li>${JSON.stringify(msg)}</li>`)
            .join("")}</ul>`
        );
        break;
      default:
        clearNotification();
        loadModel(viewer, urn);
        break;
    }
  } catch (err) {
    alert("Could not load model. See the console for more details.");
    console.error(err);
  }
}

export { onModelSelected };
