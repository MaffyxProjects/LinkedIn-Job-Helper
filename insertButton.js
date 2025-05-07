
function insertHideButton() {
  // Updated selector to target the correct pagination container on both pages
  const paginationContainer = document.querySelector('.jobs-search-results-list__pagination, .jobs-collections-list__pagination, .artdeco-pagination');

  if (paginationContainer && !document.getElementById('hideButtonDiv')) {
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'hideButtonDiv';
    buttonContainer.style.textAlign = 'center';
    buttonContainer.style.marginBottom = '15px'; // Add space below the button container
    buttonContainer.innerHTML = '<button class="jobs-save-button artdeco-button artdeco-button--3 artdeco-button--secondary" id="hideButton">Hide Jobs</button>';

    // Find the correct parent to insert before
    let insertBeforeElement = paginationContainer;

    // Check if it's the collections page pagination (where pagination is inside a container)
    if (paginationContainer.closest('.jobs-collections-list')) {
      insertBeforeElement = paginationContainer.parentNode; // Insert after the pagination's parent div
    }
    // Check if it's the search results page pagination (where pagination is directly in the list container)
    else if (paginationContainer.closest('.jobs-search-results-list')) {
      insertBeforeElement = paginationContainer; // Insert after the pagination element itself
    }
    // Fallback for other potential pagination structures (like the main feed pagination)
    else if (paginationContainer.classList.contains('artdeco-pagination')) {
        insertBeforeElement = paginationContainer; // Insert after the pagination element itself
    }


    // Insert the button container *after* the element it should follow
    if (insertBeforeElement && insertBeforeElement.parentNode) {
        // Use insertAdjacentElement for potentially simpler insertion after the target
        insertBeforeElement.insertAdjacentElement('afterend', buttonContainer);
        console.log("Hide Jobs button inserted after:", insertBeforeElement);
    } else {
        console.error("Could not find appropriate element or its parent node to insert button after.");
    }

    // Add event listener only if the button was successfully inserted and found
    const hideButton = document.getElementById('hideButton');
    if (hideButton) {
        // *** Attach the listener ***
        hideButton.addEventListener('click', hideJobs); // Use the function defined below
    } else {
        console.error("Hide button element not found after attempting insertion.");
    }

  } else if (!paginationContainer) {
    // This case is handled by waitForPaginationAndInsert, but log for debugging if somehow called directly
    console.log("Pagination container not found. Insertion deferred.");
  } else {
    // Button container div already exists
    if (!document.getElementById('hideButton')) {
        console.log("Button container div exists, but button is missing. Re-insertion attempt might be needed or check for conflicts.");
        // Optionally, try to re-add the innerHTML or listener if the button is missing but div exists
    } else {
        console.log("Hide Jobs button or container already exists.");
    }
  }
}

// *** MODIFIED Function to send message ***
function hideJobs() {
  console.log('[LinkedIn Job Hider] Hide button clicked. Attempting to send message...'); // Debug log
  console.log('[LinkedIn Job Hider] typeof chrome:', typeof chrome); // Debug log

  // Check if chrome object and runtime API are available
  if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
    console.log('[LinkedIn Job Hider] chrome.runtime.sendMessage is available. Sending message...'); // Debug log
    chrome.runtime.sendMessage({ directive: "hideJobs" }, function(response) {
      // Optional: Handle response from background if needed
      if (chrome.runtime.lastError) {
          console.error("[LinkedIn Job Hider] Error sending message:", chrome.runtime.lastError.message);
      } else {
          console.log("[LinkedIn Job Hider] hideJobs message sent successfully.");
          // You might receive a response object here if background.js sends one
          // console.log("[LinkedIn Job Hider] Response from background:", response);
      }
    });
  } else {
    // Log detailed error if APIs are missing
    console.error("[LinkedIn Job Hider] Critical Error: chrome.runtime.sendMessage is not available in this context!");
    if (typeof chrome === 'undefined') {
        console.error("[LinkedIn Job Hider] Reason: 'chrome' object is undefined.");
    } else if (typeof chrome.runtime === 'undefined') {
        console.error("[LinkedIn Job Hider] Reason: 'chrome.runtime' object is undefined.");
    } else {
        console.error("[LinkedIn Job Hider] Reason: 'chrome.runtime.sendMessage' is not a function.");
    }
    // Alert the user as a fallback
    alert("LinkedIn Job Hider Error:\nCould not communicate with the extension background.\n\nPlease try reloading the LinkedIn page.\nIf the problem persists, try reinstalling the extension or check the browser console (F12 -> Console) for more details.");
  }
} // End hideJobs

// More robust page load handling with multiple retries
function waitForPaginationAndInsert() {
  const selector = '.jobs-search-results-list__pagination, .jobs-collections-list__pagination, .artdeco-pagination';
  let paginationContainer = document.querySelector(selector);

  if (paginationContainer) {
    console.log("[LinkedIn Job Hider] Pagination container found immediately.");
    insertHideButton();
  } else {
    console.log("[LinkedIn Job Hider] Pagination container not found immediately. Starting retry mechanism...");
    const maxRetries = 10; // Maximum number of retries
    let retryCount = 0;
    const intervalId = setInterval(() => {
      paginationContainer = document.querySelector(selector); // Re-query inside interval
      if (paginationContainer) {
        console.log(`[LinkedIn Job Hider] Pagination container found after ${retryCount + 1} attempt(s).`);
        clearInterval(intervalId);
        insertHideButton();
      } else {
        retryCount++;
        console.log(`[LinkedIn Job Hider] Retry ${retryCount}/${maxRetries}: Pagination container not found.`);
        if (retryCount >= maxRetries) {
          clearInterval(intervalId);
          console.error("[LinkedIn Job Hider] Pagination container not found after multiple retries. Button not inserted.");
        }
      }
    }, 1000); // Check every second
  }
}

// Check if the page is ready and the correct LinkedIn page
function isCorrectLinkedInPage() {
  // Broaden the check slightly to accommodate variations, but keep it focused on jobs pages
  return window.location.href.includes("linkedin.com/jobs/");
}

// Initial execution logic
if (isCorrectLinkedInPage()) {
    console.log("[LinkedIn Job Hider] Correct LinkedIn jobs page detected."); // Debug log
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      console.log("[LinkedIn Job Hider] Document already loaded or interactive.");
      waitForPaginationAndInsert();
    } else {
      console.log("[LinkedIn Job Hider] Adding DOMContentLoaded listener.");
      document.addEventListener('DOMContentLoaded', waitForPaginationAndInsert);
      // As a fallback, also listen for 'load' in case DOMContentLoaded fires too early for dynamic content
      window.addEventListener('load', () => {
          // Check if button already inserted by DOMContentLoaded handler
          if (!document.getElementById('hideButtonDiv')) {
              console.log("[LinkedIn Job Hider] Running waitForPaginationAndInsert on window.load as fallback.");
              waitForPaginationAndInsert();
          }
      });
    }
} else {
    console.log("[LinkedIn Job Hider] Not a LinkedIn jobs page. Button insertion script not running.");
}
