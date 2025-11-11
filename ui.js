// /public/js/ui.js

// Spinner helpers
export function showSpinner() {
  const el = document.getElementById("spinner");
  if (el) el.style.display = "flex";
}
export function hideSpinner() {
  const el = document.getElementById("spinner");
  if (el) el.style.display = "none";
}

// Toast helper
export function toast(message, type = "success") {
  let cont = document.querySelector(".toast-container");
  if (!cont) {
    cont = document.createElement("div");
    cont.className = "toast-container";
    document.body.appendChild(cont);
  }
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = message;
  cont.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// Auto-bind: show spinner on any form submit & any link with [data-loading]
(function autoWire() {
  document.addEventListener("submit", e => {
    const form = e.target;
    // Only show for real navigations (non-AJAX)
    if (!form.hasAttribute("data-no-spinner")) showSpinner();
  });

  document.querySelectorAll("[data-loading]").forEach(a => {
    a.addEventListener("click", () => showSpinner());
  });

  // Hide spinner when page is ready
  window.addEventListener("load", hideSpinner);
})();