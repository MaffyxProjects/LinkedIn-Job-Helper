
// --- Helper function for creating delays ---
const HIDE_KEYWORDS_KEY = 'hideKeywords';
let recentlyHiddenJobIds = []; // For Undo functionality

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Helper Function to find the scrollable container ---
// Used primarily for scrolling to the top after page load.
function getScrollableContainer(isCollectionPage) {
  if (isCollectionPage) {
    const specificContainer = document.querySelector('.jobs-unified-list');
    if (specificContainer && specificContainer.scrollHeight > specificContainer.clientHeight) {
      // console.log("Using specific scroll container for collections");
      return specificContainer;
    }
  }
  // Default to window for scrolling to top
  // console.log("Using window for scrolling to top");
  return window;
}

// --- Undo Functionality ---
function showUndoNotification() {
  if (recentlyHiddenJobIds.length === 0) return;

  let undoBar = document.getElementById('hideJobsUndoBar');
  if (undoBar) undoBar.remove(); // Remove existing if any

  undoBar = document.createElement('div');
  undoBar.id = 'hideJobsUndoBar';
  Object.assign(undoBar.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#333',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    zIndex: '10000',
    boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  });
  undoBar.innerHTML = `<span>Hid ${recentlyHiddenJobIds.length} jobs.</span>`;

  const undoButton = document.createElement('button');
  undoButton.textContent = 'Undo';
  Object.assign(undoButton.style, { background: '#555', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' });
  undoButton.onclick = () => {
    console.log("Undo clicked. Job IDs to restore (conceptually):", recentlyHiddenJobIds);
    alert(`Undo is complex. For now, this would prevent these ${recentlyHiddenJobIds.length} jobs from being hidden in the *next* "Hide Jobs" run on this page load if you were to re-hide. A page refresh will clear this temporary exclusion.`);
    // Store IDs to be temporarily excluded in the current session
    sessionStorage.setItem('tempExcludeHideIds', JSON.stringify(recentlyHiddenJobIds));
    undoBar.remove();
  };
  undoBar.appendChild(undoButton);
  document.body.appendChild(undoBar);
  setTimeout(() => { if(undoBar) undoBar.remove(); }, 10000); // Auto-remove after 10 seconds
}

// --- Function to navigate to the next page and scroll top ---
// MODIFIED: Does NOT re-trigger the hiding process automatically.
function clickNextPageAndScrollTop(isCollectionPage) {
  console.log("Attempting to navigate to the next page...");
  // Selector finds the <li> *after* the one marked active/selected, then finds the button inside it
  const nextButton = document.querySelector('li.artdeco-pagination__indicator.active.selected + li.artdeco-pagination__indicator button');

  if (nextButton) {
    console.log("Next page button found. Clicking...");
    nextButton.click();

    // Wait for the next page's content to likely load
    setTimeout(() => {
      console.log("Scrolling to top after page change...");
      const scrollableContainer = getScrollableContainer(isCollectionPage);
      if (scrollableContainer) {
         // Use window.scrollTo for the window object, otherwise use the element's scrollTo
         if (scrollableContainer === window) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
         } else if (typeof scrollableContainer.scrollTo === 'function') {
            scrollableContainer.scrollTo({ top: 0, behavior: 'smooth' });
         } else {
             console.error("Scrollable container found, but cannot scroll", scrollableContainer);
         }
      } else {
        console.warn("Scrollable container not found after page change. Cannot scroll to top.");
      }
      console.log("Next page loaded and scrolled to top. Ready for user action.");
      // --- LOOP PREVENTION: Removed the call to restart the hiding process ---
      showUndoNotification(); // Show undo after potential page navigation

    }, 3000); // Wait 3 seconds - adjust if pages load slower/faster

  } else {
    console.log("No next page button found. Likely the last page.");
    // Optional: Notify the user
    // alert("Finished hiding jobs on the current page. No next page found!"); // Can be noisy with undo bar
    showUndoNotification(); // Show undo even if it's the last page
  }
}


// --- Function to hide job listings on the search page ---
// MODIFIED: Added async/await and delay between clicks. Increased final delay.
// MODIFIED: Added keyword filtering.
async function hideSearchListings(isCollectionPage, keywords = []) {
  console.log("hideSearchListings called (manual trigger)");
  const jobListings = document.querySelectorAll('.scaffold-layout__list-item');
  let hiddenCount = 0;
  recentlyHiddenJobIds = []; // Reset for this run
  const clickDelay = 200; // Delay in milliseconds (e.g., 200ms = 0.2 seconds)
  const tempExcludeIds = JSON.parse(sessionStorage.getItem('tempExcludeHideIds') || '[]');
  if (tempExcludeIds.length > 0) {
    console.log("Applying temporary exclusion for IDs:", tempExcludeIds);
    sessionStorage.removeItem('tempExcludeHideIds'); // Clear after use for this run
  }

  if (jobListings.length === 0) {
    console.log("No job listings found on search page to hide.");
    // Still attempt to go to the next page if the user clicked hide on an empty page
    setTimeout(() => clickNextPageAndScrollTop(isCollectionPage), 500);
    return;
  }

  // Use for...of loop with await for delays
  for (const job of jobListings) {
    const jobCard = job.querySelector('.job-card-container');
    const jobId = jobCard?.dataset.jobId || job.dataset.occludableJobId;

    if (jobId && tempExcludeIds.includes(jobId)) {
        console.log(`Skipping job ${jobId} due to temporary undo exclusion.`);
        continue;
    }

    // Keyword Check
    let keywordMatch = false;
    if (keywords.length > 0 && jobCard) {
        const titleElement = jobCard.querySelector('.job-card-list__title, .job-card-container__title');
        const companyElement = jobCard.querySelector('.job-card-container__primary-description, .job-card-container__company-name, .job-card-container__subtitle'); // Added subtitle for company
        // Description is harder on list view, usually truncated. Focus on title/company.
        const jobTextContent = `${titleElement?.textContent || ''} ${companyElement?.textContent || ''}`.toLowerCase();

        for (const keyword of keywords) { // Keywords are already stored as lowercase
            if (jobTextContent.includes(keyword)) {
                keywordMatch = true;
                console.log(`Keyword match for "${keyword}" in job: ${jobId || 'Unknown ID'} (Title/Company: ${jobTextContent.substring(0,100)}...)`);
                break;
            }
        }
    }

    const buttonLocation = job.querySelector('.job-card-list__actions-container');
    if (buttonLocation) {
      const useElement = buttonLocation.querySelector('use');
      if (useElement) {
        const buttonType = useElement.getAttribute('href');
        if (buttonType === '#close-small' || buttonType === '#close-medium') {
          const hideButton = buttonLocation.querySelector('button[aria-label^="Dismiss"], button[aria-label^="Not interested"]');
          if (hideButton && (keywordMatch || keywords.length === 0)) { // Hide if keyword match OR no keywords (manual mode)
            // console.log("Hiding a job from search");
            hideButton.click();
            hiddenCount++;
            if (jobId) recentlyHiddenJobIds.push(jobId);
            await delay(clickDelay); // Wait before processing the next job
          }
        }
      }
    } else if (keywordMatch && jobCard) { // If keyword matched but no standard dismiss button, try a more generic one on the card
        const genericDismissButton = jobCard.querySelector('button[aria-label^="Dismiss"], button[aria-label^="Not interested"]');
        if (genericDismissButton) {
            console.log(`Keyword matched for job ${jobId || 'Unknown ID'}, using generic dismiss button.`);
            genericDismissButton.click();
            hiddenCount++;
            if (jobId) recentlyHiddenJobIds.push(jobId);
            await delay(clickDelay);
        } else {
            console.warn(`Keyword matched for job ${jobId || 'Unknown ID'}, but no dismiss button found.`);
        }
    }
  } // End for...of loop

  console.log(`Finished hiding ${hiddenCount} jobs on current search page. Scheduling next page action.`);
  // Wait a longer moment after the *last* hide button click, then go to next page
  setTimeout(() => clickNextPageAndScrollTop(isCollectionPage), 1500); // *** INCREASED DELAY HERE ***
}

// --- Function to hide job listings on the collections page ---
// MODIFIED: Added async/await and delay between clicks. Increased final delay.
// MODIFIED: Added keyword filtering
async function hideCollectionListings(isCollectionPage, keywords = []) {
  console.log("hideCollectionListings called (manual trigger)");
  const jobListings = document.querySelectorAll('.scaffold-layout__list-item');
  let hiddenCount = 0;
  recentlyHiddenJobIds = []; // Reset for this run
  const clickDelay = 200; // Delay in milliseconds (e.g., 200ms = 0.2 seconds)
  const tempExcludeIds = JSON.parse(sessionStorage.getItem('tempExcludeHideIds') || '[]');
  if (tempExcludeIds.length > 0) sessionStorage.removeItem('tempExcludeHideIds'); // Clear after use


  if (jobListings.length === 0) {
    console.log("No job listings found on collections page to hide.");
     // Still attempt to go to the next page if the user clicked hide on an empty page
    setTimeout(() => clickNextPageAndScrollTop(isCollectionPage), 500);
    return;
  }

  // Use for...of loop with await for delays
  for (const job of jobListings) {
    const jobCard = job.querySelector('.job-card-container');
    const jobId = jobCard?.dataset.jobId || job.dataset.occludableJobId;

    if (jobId && tempExcludeIds.includes(jobId)) {
        console.log(`Skipping job ${jobId} due to temporary undo exclusion.`);
        continue;
    }

    let keywordMatch = false;
    if (keywords.length > 0 && jobCard) {
        const titleElement = jobCard.querySelector('.job-card-list__title, .job-card-container__title');
        const companyElement = jobCard.querySelector('.job-card-container__primary-description, .job-card-container__company-name, .job-card-container__subtitle');
        const jobTextContent = `${titleElement?.textContent || ''} ${companyElement?.textContent || ''}`.toLowerCase();
        for (const keyword of keywords) { // Keywords are already lowercase
            if (jobTextContent.includes(keyword)) {
                keywordMatch = true;
                console.log(`Keyword match for "${keyword}" in collection job: ${jobId || 'Unknown ID'}`);
                break;
            }
        }
    }

    let hideButtonClicked = false;
    if (keywordMatch || keywords.length === 0) { // Hide if keyword match OR no keywords (manual mode)
        const dismissSelectors = [
            'button.job-card-container__action[aria-label^="Dismiss"]',
            'button.job-card-container__action[aria-label^="Not interested"]',
            '.job-card-list__actions-container button[aria-label^="Dismiss"]',
            '.job-card-list__actions-container button[aria-label^="Not interested"]'
        ];
        for (const selector of dismissSelectors) {
            const hideButton = job.querySelector(selector);
            if (hideButton) {
                // console.log("Hiding a job from collection using selector:", selector);
                hideButton.click();
                hiddenCount++;
                if (jobId) recentlyHiddenJobIds.push(jobId);
                hideButtonClicked = true;
                break; // Found and clicked a button
            }
        }
        if (!hideButtonClicked) {
             console.warn(`Job ${jobId || 'Unknown ID'} matched criteria but no dismiss button found in collection view.`);
        }
    }
    // If a button was clicked for this job, wait
    if (hideButtonClicked) {
        await delay(clickDelay); // Wait before processing the next job
    }
  } // End for...of loop

   console.log(`Finished hiding ${hiddenCount} jobs on current collection page. Scheduling next page action.`);
  // Wait a longer moment after the *last* hide button click, then go to next page
  setTimeout(() => clickNextPageAndScrollTop(isCollectionPage), 1500); // *** INCREASED DELAY HERE ***
}

// --- Initial Execution Logic ---
// MODIFIED: This function is now the entry point when the script is injected via background.js
// It determines the page type and calls the appropriate hiding function *once*.
async function startHidingProcess() { // Made async to await keyword fetch
    console.log("LinkedIn Job Hider: Hiding process initiated by user.");
    let isCollectionPage = false; // Default to search page
    let keywords = [];

    try {
        const result = await chrome.storage.local.get([HIDE_KEYWORDS_KEY]);
        keywords = result[HIDE_KEYWORDS_KEY] || [];
        if (keywords.length > 0) {
            console.log("Using keywords for hiding:", keywords.join(', '));
        } else {
            console.log("No keywords configured. Hiding all dismissible jobs.");
        }
    } catch (e) {
        console.error("Error fetching hideKeywords:", e);
    }

    if (window.location.href.includes("linkedin.com/jobs/search/")) {
        console.log("Detected Job Search page.");
        isCollectionPage = false;
        await hideSearchListings(isCollectionPage, keywords); // await to ensure it completes before any other script logic if added later
    } else if (window.location.href.includes("linkedin.com/jobs/collections/")) {
        console.log("Detected Job Collections page.");
        isCollectionPage = true;
        await hideCollectionListings(isCollectionPage, keywords);
    } else {
        console.log("Not on a recognized LinkedIn Job Search or Collections page. Cannot hide.");
        alert("LinkedIn Job Hider: Not on a job search or collections page.");
    }
}
// --- Execute the hiding process ---
// This runs immediately when the script is injected.
startHidingProcess();
