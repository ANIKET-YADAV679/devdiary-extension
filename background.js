// Background Service Worker - DevDiary Engine

let currentTracking = {
  domain: null,
  startTime: null
};

// URL se clean domain nikalne ka helper function
function extractDomain(url) {
  try {
    const parsed = new URL(url);
    // Browser ke internal pages (chrome://, extension://) ko ignore karo
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.hostname;
    }
  } catch (e) {
    return null;
  }
  return null;
}

// Time delta calculate karke local storage me persist karne ka function
async function recordActiveTime() {
  if (!currentTracking.domain || !currentTracking.startTime) return;

  const now = Date.now();
  const elapsedSeconds = Math.round((now - currentTracking.startTime) / 1000);

  // Agar user 1 second se kam time ruka toh skip karo
  if (elapsedSeconds < 1) return;

  const domain = currentTracking.domain;

  // Chrome storage se existing data fetch karo
  const data = await chrome.storage.local.get(["dailyLogs"]);
  const dailyLogs = data.dailyLogs || {};

  // Aaj ki date string (YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0];

  if (!dailyLogs[today]) {
    dailyLogs[today] = {};
  }

  // Domain ka time aggregate karo
  dailyLogs[today][domain] = (dailyLogs[today][domain] || 0) + elapsedSeconds;

  await chrome.storage.local.set({ dailyLogs });
  console.log(`[DevDiary] Logged ${elapsedSeconds}s to ${domain}`);

  // Timer reset karo current time pe
  currentTracking.startTime = now;
}

// Event 1: Jab user active tab switch kare
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Pehle puraane tab ka waqt hisaab karke save karo
  await recordActiveTime();

  // Naye tab ki details uthao
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    const domain = extractDomain(tab.url);

    if (domain) {
      currentTracking.domain = domain;
      currentTracking.startTime = Date.now();
      console.log(`[DevDiary] Switched to: ${domain}`);
    } else {
      currentTracking.domain = null;
      currentTracking.startTime = null;
    }
  } catch (error) {
    console.error("[DevDiary] Error fetching active tab:", error);
  }
});

// Event 2: Jab user poori browser window minimize kare ya doosre app pe chala jaye
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser window unfocus ho gayi (user ne VS Code ya games khola)
    await recordActiveTime();
    currentTracking.domain = null;
    currentTracking.startTime = null;
    console.log("[DevDiary] Browser unfocused. Tracking paused.");
  } else {
    // Wapas browser par aaya, active tab dhundho
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const domain = extractDomain(tab.url);
      if (domain) {
        currentTracking.domain = domain;
        currentTracking.startTime = Date.now();
        console.log(`[DevDiary] Resumed on: ${domain}`);
      }
    }
  }
});