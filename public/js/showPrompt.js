// globalPrompt.js
function showPrompt(message, placeholder = "", callback) {
  // Remove existing prompt if any
  const existing = document.getElementById("globalPromptOverlay");
  if (existing) existing.remove();

  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "globalPromptOverlay";
  overlay.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

  // Modal
  overlay.innerHTML = `
    <div class="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
      <h3 class="text-lg font-semibold mb-4">${message}</h3>
      <input type="text" placeholder="${placeholder}" class="w-full p-2 border rounded mb-4" />
      <div class="flex justify-end gap-2">
        <button class="cancel-btn bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded">Cancel</button>
        <button class="submit-btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const input = overlay.querySelector("input");
  const cancelBtn = overlay.querySelector(".cancel-btn");
  const submitBtn = overlay.querySelector(".submit-btn");

  input.focus();

  cancelBtn.onclick = () => {
    overlay.remove();
    callback(null);
  };

  submitBtn.onclick = () => {
    overlay.remove();
    callback(input.value.trim());
  };

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") submitBtn.click();
  });
}
