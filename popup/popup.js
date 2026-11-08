document.addEventListener("DOMContentLoaded", async () => {
  const toggleBtn = document.getElementById("toggleBtn");
  const copyBtn = document.getElementById("copyBtn");
  const trackingStatus = document.getElementById("trackingStatus");
  const focusTimer = document.getElementById("focusTimer");

  // Seconds ko HH:MM:SS format me badalne ka helper
  function formatSeconds(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  // Aaj ki date string (YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0];

  // Storage se data uthana
  const storageData = await chrome.storage.local.get(["dailyLogs", "isTrackingPaused"]);
  const dailyLogs = storageData.dailyLogs || {};
  const todayLogs = dailyLogs[today] || {};

  // Aaj ke saare domains ka time sum karo
  let totalSeconds = 0;
  for (const domain in todayLogs) {
    totalSeconds += todayLogs[domain];
  }

  // Display timer update
  focusTimer.textContent = formatSeconds(totalSeconds);

  // Tracking pause/active state sync
  let isPaused = storageData.isTrackingPaused || false;

  function updateStatusUI(paused) {
    if (paused) {
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
  }

  updateStatusUI(isPaused);

  // Pause / Resume toggle button listener
  toggleBtn.addEventListener("click", async () => {
    isPaused = !isPaused;
    await chrome.storage.local.set({ isTrackingPaused: isPaused });
    updateStatusUI(isPaused);
  });

  // Copy Summary button: Detailed Markdown summary clipboard me bhejega
  copyBtn.addEventListener("click", () => {
    let summaryText = `# DevDiary Daily Log - ${today}\n`;
    summaryText += `**Total Focus Time:** ${formatSeconds(totalSeconds)}\n\n`;
    summaryText += `### Breakdown:\n`;

    const domains = Object.keys(todayLogs);
    if (domains.length === 0) {
      summaryText += `- No activity recorded yet.\n`;
    } else {
      domains.forEach((domain) => {
        summaryText += `- **${domain}**: ${formatSeconds(todayLogs[domain])}\n`;
      });
    }

    navigator.clipboard.writeText(summaryText);
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy Summary";
    }, 1500);
  });
});