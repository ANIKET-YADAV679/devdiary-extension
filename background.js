let currentTracking = {
    domain: null,
    startTime: null
  };
  
  function extractDomain(url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.hostname;
      }
    } catch (e) {
      return null;
    }
    return null;
  }
  
  async function recordActiveTime() {
    const state = await chrome.storage.local.get(["isTrackingPaused"]);
    if (state.isTrackingPaused) return;
  
    if (!currentTracking.domain || !currentTracking.startTime) return;
  
    const now = Date.now();
    const elapsedSeconds = Math.round((now - currentTracking.startTime) / 1000);
  
    if (elapsedSeconds < 1) return;
  
    const domain = currentTracking.domain;
  
    const data = await chrome.storage.local.get(["dailyLogs"]);
    const dailyLogs = data.dailyLogs || {};
  
    const today = new Date().toISOString().split("T")[0];
  
    if (!dailyLogs[today]) {
      dailyLogs[today] = {};
    }
  
    dailyLogs[today][domain] = (dailyLogs[today][domain] || 0) + elapsedSeconds;
  
    await chrome.storage.local.set({ dailyLogs });
  
    currentTracking.startTime = now;
  }
  
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await recordActiveTime();
  
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      const domain = extractDomain(tab.url);
  
      if (domain) {
        currentTracking.domain = domain;
        currentTracking.startTime = Date.now();
      } else {
        currentTracking.domain = null;
        currentTracking.startTime = null;
      }
    } catch (error) {
      console.error(error);
    }
  });
  
  chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      await recordActiveTime();
      currentTracking.domain = null;
      currentTracking.startTime = null;
    } else {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const domain = extractDomain(tab.url);
        if (domain) {
          currentTracking.domain = domain;
          currentTracking.startTime = Date.now();
        }
      }
    }
  });