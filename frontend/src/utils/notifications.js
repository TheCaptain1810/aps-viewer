export function clearNotification() {
  const overlay = document.getElementById("overlay");
  overlay.innerHTML = "";
  overlay.style.display = "none";
}

export function showNotification(message) {
  const overlay = document.getElementById("overlay");
  overlay.innerHTML = `<div class="notification">${message}</div>`;
  overlay.style.display = "flex";
}
