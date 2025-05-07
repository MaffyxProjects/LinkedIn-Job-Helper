// background.js

// Helper functions
async function getActiveTab() {
  // No change needed here
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function injectScript(scriptFile) {
  // No change needed here, still used for hideJobs.js
  const tab = await getActiveTab();
  if (!tab) {
      console.error("No active tab found to inject script into.");
      return;
  }
   if (!tab.url || (!tab.url.includes("linkedin.com/jobs/search/") && !tab.url.includes("linkedin.com/jobs/collections/"))) {
       console.log("Not injecting script - not on a LinkedIn job search/collection page.");
       // Optionally alert the user
       // chrome.notifications.create({ type: 'basic', iconUrl: '/images/icons/icon128.png', title: 'LinkedIn Job Hider', message: 'Hiding only works on LinkedIn job search or collection pages.' });
       return;
   }
  try {
      await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [scriptFile]
      });
  } catch (error) {
      console.error(`Error injecting script ${scriptFile}:`, error);
      // Handle potential errors, e.g., if the tab was closed or permissions are missing
  }
}

// Main functions
// function runInsertButton() { // REMOVE THIS FUNCTION - Handled by manifest
//   injectScript('insertButton.js');
// }

function runHideLinkedInJobs() {
  // Check if on correct page before injecting
  getActiveTab().then(tab => {
      if (tab && tab.url && (tab.url.includes("linkedin.com/jobs/search/") || tab.url.includes("linkedin.com/jobs/collections/"))) {
          console.log("Injecting hideJobs.js");
          injectScript('hideJobs.js');
      } else {
          console.log("Hide button clicked, but not on a relevant LinkedIn jobs page.");
          // Maybe notify user via popup feedback or an alert if desired
      }
  });
}

// Event listeners
// REMOVE this listener - Handled by manifest content_scripts
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === 'complete' && tab.url && (tab.url.includes("linkedin.com/jobs/search/") || tab.url.includes("linkedin.com/jobs/collections/"))) {
//     // Check if the URL is a job search or collections page
//     // runInsertButton(); // No longer needed here
//     // flagCompany.js is also handled by manifest
//   }
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.directive) {
    case "hideJobs":
      console.log("Received hideJobs directive.");
      runHideLinkedInJobs();
      // Optional: Send response immediately or after injection attempt
      sendResponse({ status: "hideJobs command received" });
      break;
    // Add cases for other directives if needed in the future
    default:
      console.log("Received unknown directive:", request.directive);
      sendResponse({ status: "Unknown directive" });
      break;
  }
  // Return true if you intend to send a response asynchronously (e.g., after injectScript finishes)
  // In this case, we send it synchronously above.
  return false;
});

console.log("Background service worker started."); // Log startup
