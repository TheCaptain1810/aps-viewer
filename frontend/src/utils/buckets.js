import { showNotification, clearNotification } from "./notifications";
import { onModelSelected } from "./models";

async function onBucketDeleted(bucketName) {
  if (
    !confirm(
      `Are you sure you want to delete bucket "${bucketName}"?\n\nNote: You can only delete buckets that you created with this app. Buckets created by other applications or users cannot be deleted.\n\nThis action cannot be undone.`
    )
  ) {
    return;
  }

  try {
    showNotification(`Deleting bucket <em>${bucketName}</em>...`);

    const resp = await fetch(`/api/buckets/${encodeURIComponent(bucketName)}`, {
      method: "DELETE",
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(async () => ({
        error: (await resp.text()) || "Unknown error occurred",
      }));
      throw new Error(errorData.error || "Failed to delete bucket");
    }

    await resp.json();
    const viewer = window.viewer;
    onBucketSelected(viewer, null);

    clearNotification();
    showNotification(`Bucket "${bucketName}" deleted successfully.`);
    setTimeout(clearNotification, 3000);
  } catch (err) {
    clearNotification();

    // Show user-friendly error message
    if (
      err.message.includes("Access denied") ||
      err.message.includes("privilege")
    ) {
      showNotification(
        `❌ Cannot delete bucket "${bucketName}". You can only delete buckets that you created with this app.`
      );
    } else if (err.message.includes("not found")) {
      showNotification(
        `❌ Bucket "${bucketName}" not found or already deleted.`
      );
    } else {
      showNotification(
        `❌ Failed to delete bucket "${bucketName}". ${err.message}`
      );
    }

    setTimeout(clearNotification, 5000);
    console.error("Bucket deletion error:", err);
  }
}

async function onBucketSelected(viewer, bucketUrn) {
  try {
    if (!bucketUrn) {
      // Clear models when no bucket is selected
      const modelsDropdown = document.getElementById("models");
      if (modelsDropdown) {
        modelsDropdown.innerHTML =
          '<option value="" disabled>Select a model</option>';
      }
      clearNotification();
      return;
    }

    const resp = await fetch(
      `/api/models?bucket=${encodeURIComponent(bucketUrn)}`
    );
    if (!resp.ok) {
      throw new Error(await resp.text());
    }
    const models = await resp.json();
    const modelsDropdown = document.getElementById("models");

    if (modelsDropdown) {
      modelsDropdown.innerHTML = models
        .map((model) => `<option value=${model.urn}>${model.name}</option>`)
        .join("\n");

      if (models.length === 0) {
        showNotification("No models found in this bucket.");
      } else {
        clearNotification();
        if (modelsDropdown.value) {
          onModelSelected(viewer, modelsDropdown.value);
        }
      }
    }
  } catch (err) {
    console.error("Could not list models for this bucket:", err);
    showNotification(
      "Could not load models for this bucket. Please try again."
    );
    setTimeout(clearNotification, 3000);
  }
}

export { onBucketDeleted, onBucketSelected };
