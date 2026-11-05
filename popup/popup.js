document.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggleBtn");
    const copyBtn = document.getElementById("copyBtn");
    const trackingStatus = document.getElementById("trackingStatus");
  
    let isPaused = false;
  
    toggleBtn.addEventListener("click", () => {
      isPaused = !isPaused;
      if (isPaused) {
        trackingStatus.textContent = "Paused";
        trackingStatus.style.backgroundColor = "#3b2222";
        trackingStatus.style.color = "#e74c3c";
        toggleBtn.textContent = "Resume Tracking";
      } else {
        trackingStatus.textContent = "Active";
        trackingStatus.style.backgroundColor = "#1e3a2f";
        trackingStatus.style.color = "#2ecc71";
        toggleBtn.textContent = "Pause Tracking";
      }
    });
  
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText("# DevDiary Daily Log\n- Total Focus: 00:00:00");
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy Summary";
      }, 1500);
    });
  });