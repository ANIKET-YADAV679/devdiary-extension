document.addEventListener("DOMContentLoaded", async () => {
  const toggleBtn = document.getElementById("toggleBtn");
  const copyBtn = document.getElementById("copyBtn");
  const trackingStatus = document.getElementById("trackingStatus");
  const focusTimer = document.getElementById("focusTimer");
  const domainList = document.getElementById("domainList");
  const siteCount = document.getElementById("siteCount");

  function formatSeconds(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  const today = new Date().toISOString().split("T")[0];

  const storageData = await chrome.storage.local.get(["dailyLogs", "isTrackingPaused"]);
  const dailyLogs = storageData.dailyLogs || {};
  const todayLogs = dailyLogs[today] || {};

  let totalSeconds = 0;
  const domains = Object.keys(todayLogs);

  if (domains.length > 0) {
    domainList.innerHTML = "";
    siteCount.textContent = `${domains.length} sites`;

    domains
      .sort((a, b) => todayLogs[b] - todayLogs[a])
      .forEach((domain) => {
        const timeSpent = todayLogs[domain];
        totalSeconds += timeSpent;

        const li = document.createElement("li");
        li.className = "domain-item";

        const nameSpan = document.createElement("span");
        nameSpan.className = "domain-name";
        nameSpan.textContent = domain;

        const timeSpan = document.createElement("span");
        timeSpan.className = "domain-time";
        timeSpan.textContent = formatSeconds(timeSpent);

        li.appendChild(nameSpan);
        li.appendChild(timeSpan);
        domainList.appendChild(li);
      });
  } else {
    siteCount.textContent = "0 sites";
  }

  focusTimer.textContent = formatSeconds(totalSeconds);

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

  toggleBtn.addEventListener("click", async () => {
    isPaused = !isPaused;
    await chrome.storage.local.set({ isTrackingPaused: isPaused });
    updateStatusUI(isPaused);
  });

  copyBtn.addEventListener("click", () => {
    let summaryText = `# DevDiary Daily Log - ${today}\n`;
    summaryText += `**Total Focus Time:** ${formatSeconds(totalSeconds)}\n\n`;
    summaryText += `### Breakdown:\n`;

    if (domains.length === 0) {
      summaryText += `- No activity recorded yet.\n`;
    } else {
      domains
        .sort((a, b) => todayLogs[b] - todayLogs[a])
        .forEach((domain) => {
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