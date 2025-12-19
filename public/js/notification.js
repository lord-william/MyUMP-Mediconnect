function showNotification(message, type = "info") {
  const notification = document.getElementById("notification");
  const messageSpan = document.getElementById("notification-message");
  const closeButton = document.getElementById("notification-close");

  if (!notification || !messageSpan) return;

  // Always hide loader if a notification appears
  hideProgress();

  // Reset previous styles
  notification.className = "notification";

  // Apply type (error, success, warning, info)
  notification.classList.add(type);

  messageSpan.textContent = message;
  notification.classList.remove("hidden");

  // Close button handler
  closeButton.onclick = () => {
    notification.classList.add("hidden");
  };

  // Auto hide after 4s
  setTimeout(() => {
    notification.classList.add("hidden");
  }, 4000);
}
