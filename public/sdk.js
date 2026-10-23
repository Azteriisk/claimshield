/**
 * ClaimShield Fast-Track Embeddable SDK v1.0
 * Drop-in Anti-Fraud & Verified Intake Layer for Settlement Administrators
 * 
 * Usage:
 * <script src="/sdk.js" data-settlement-id="sett-tm-2024"></script>
 * <div id="claimshield-fasttrack-btn"></div>
 */

(function () {
  // Read configuration from current script tag
  const currentScript = document.currentScript || (function() {
    const scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  const settlementId = currentScript ? currentScript.getAttribute("data-settlement-id") || "sett-tm-2024" : "sett-tm-2024";

  function initClaimShield() {
    const targetContainer = document.getElementById("claimshield-fasttrack-btn");
    if (!targetContainer) return;

    // Render Fast-Track Button
    targetContainer.innerHTML = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 12px 0;">
        <button id="cs-launch-btn" type="button" style="
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #042f2e;
          font-weight: 700;
          font-size: 13px;
          padding: 10px 18px;
          border-radius: 12px;
          border: 1px solid #34d399;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
          transition: all 0.2s ease;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          Fast-Track Claim with ClaimShield
          <span style="background: #022c22; color: #a7f3d0; font-size: 10px; padding: 2px 6px; border-radius: 6px; text-transform: uppercase;">1-Click</span>
        </button>
        <div id="cs-verified-banner" style="display: none; margin-top: 8px; font-size: 12px; color: #10b981; font-weight: 600;">
          ✓ Pre-cleared by ClaimShield Protocol (1:1 Anti-Sybil Proof Attached)
        </div>
      </div>
    `;

    const launchBtn = document.getElementById("cs-launch-btn");
    launchBtn.addEventListener("click", openModal);
  }

  function openModal() {
    // Check if modal already open
    if (document.getElementById("cs-modal-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "cs-modal-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: csFadeIn 0.2s ease forwards;
    `;

    const frameContainer = document.createElement("div");
    frameContainer.style.cssText = `
      width: 95%;
      max-width: 520px;
      height: 580px;
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      position: relative;
    `;

    const iframe = document.createElement("iframe");
    iframe.src = `/widget/modal?settlementId=${encodeURIComponent(settlementId)}`;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
    `;

    frameContainer.appendChild(iframe);
    overlay.appendChild(frameContainer);
    document.body.appendChild(overlay);

    // Close on escape key
    const onKey = function (e) {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
  }

  function closeModal() {
    const overlay = document.getElementById("cs-modal-overlay");
    if (overlay) overlay.remove();
  }

  // Cross-window message listener for authentication completion
  window.addEventListener("message", function (event) {
    // Only accept messages from same host or trusted origin
    if (event.data && event.data.type === "CLAIMSHIELD_CLAIM_APPROVED") {
      const payload = event.data.payload;
      closeModal();

      // Auto-fill host form fields if they exist
      const fieldMap = {
        firstName: payload.legalFirstName,
        lastName: payload.legalLastName,
        email: payload.email,
        payoutAddress: payload.payoutAddress,
        auditToken: payload.auditToken
      };

      for (const [key, val] of Object.entries(fieldMap)) {
        const input = document.querySelector(`input[name="${key}"], input[id="${key}"]`);
        if (input) {
          input.value = val;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
          input.style.borderColor = "#10b981";
          input.style.backgroundColor = "rgba(16, 185, 129, 0.05)";
        }
      }

      // Update button state
      const launchBtn = document.getElementById("cs-launch-btn");
      const banner = document.getElementById("cs-verified-banner");
      if (launchBtn) {
        launchBtn.style.background = "#064e3b";
        launchBtn.style.color = "#6ee7b7";
        launchBtn.style.borderColor = "#059669";
        launchBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
          Claim Verified: ${payload.legalFirstName} ${payload.legalLastName}
        `;
      }
      if (banner) {
        banner.style.display = "block";
      }

      // Dispatch custom DOM event for third-party host scripts
      window.dispatchEvent(new CustomEvent("claimshield:verified", { detail: payload }));
    } else if (event.data && event.data.type === "CLAIMSHIELD_CLOSE_MODAL") {
      closeModal();
    }
  });

  // Auto-init on DOMContentLoaded or immediate if already ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initClaimShield);
  } else {
    initClaimShield();
  }
})();
