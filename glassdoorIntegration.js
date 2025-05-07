// glassdoorIntegration.js
console.log("!!! COMPANY INFO SCRIPT (glassdoorIntegration.js) IS LOADING AND PARSING - TOP LEVEL !!!");

// Constants from flagCompany.js for positioning relative to flags
// These constants are expected to be defined by flagCompany.js, which loads first.
// const FLAG_NOTE_BASE_CLASS = 'company-flag-note-base';
// const FLAG_WRAPPER_CLASS = 'flag-company-wrapper';
// const FLAG_SYMBOL_BASE_CLASS = 'company-flag-symbol-base';
const FLAG_WRAPPER_CLASS = 'flag-company-wrapper'; // Used for positioning relative to flag button
const FLAG_SYMBOL_BASE_CLASS = 'company-flag-symbol-base'; // Used for positioning in list view

const COMPANY_INFO_WRAPPER_CLASS = 'company-info-wrapper';
const COMPANY_INFO_TOGGLE_BUTTON_CLASS = 'company-info-toggle-button';
const COMPANY_INFO_DROPDOWN_MENU_CLASS = 'company-info-dropdown-menu';
const COMPANY_INFO_DROPDOWN_OPTION_CLASS = 'company-info-dropdown-option';

// --- UI Display ---

/**
 * Toggles the company info dropdown menu.
 */
function toggleCompanyInfoDropdown(event) {
    const button = event.target.closest(`.${COMPANY_INFO_TOGGLE_BUTTON_CLASS}`);
    if (!button) return;
    const wrapper = button.closest(`.${COMPANY_INFO_WRAPPER_CLASS}`);
    if (!wrapper) return;
    const menu = wrapper.querySelector(`.${COMPANY_INFO_DROPDOWN_MENU_CLASS}`);
    if (!menu) return;

    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
        // Close if clicked outside
        setTimeout(() => {
            document.addEventListener('click', function closeCompanyInfoDropdownOnClickOutside(e) {
                if (!wrapper.contains(e.target) || e.target.closest(`.${COMPANY_INFO_DROPDOWN_OPTION_CLASS}`)) {
                    menu.style.display = 'none';
                    document.removeEventListener('click', closeCompanyInfoDropdownOnClickOutside, true);
                }
            }, { capture: true, once: true });
        }, 0);
    }
}

/**
 * Handles clicks on dropdown options.
 */
function handleCompanyInfoOptionClick(event, companyName, companyLinkData) {
    const option = event.target.closest(`.${COMPANY_INFO_DROPDOWN_OPTION_CLASS}`);
    if (!option) return;

    const action = option.dataset.action;
    let searchUrl = '';

    switch (action) {
        case 'glassdoor':
            searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`"${companyName}" Glassdoor`)}`;
            break;
        case 'careers':
            searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`"${companyName}" (careers OR jobs OR "work at")`)}`;
            break;
        case 'news':
            searchUrl = `https://news.google.com/search?q=${encodeURIComponent(`"${companyName}"`)}`;
            break;
        case 'layoffs':
            searchUrl = `https://www.google.com/search?q=${encodeURIComponent(`"${companyName}" (layoffs OR "job cuts" OR "workforce reduction" OR restructuring OR downsizing)`)}&tbs=qdr:y`; // qdr:y for past year
            break;
        case 'linkedin_jobs':
            if (companyLinkData?.id) { // Prioritize company ID
                searchUrl = `https://www.linkedin.com/jobs/search/?f_C=${companyLinkData.id}`;
            } else if (companyLinkData?.slug) { // Fallback to company page slug
                searchUrl = `https://www.linkedin.com/company/${companyLinkData.slug}/jobs/`;
            } else { // Fallback to keyword search
                searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(companyName)}`;
            }
            break;
    }

    if (searchUrl) {
        window.open(searchUrl, '_blank', 'noopener,noreferrer');
    }
    // Close dropdown
    const menu = option.closest(`.${COMPANY_INFO_DROPDOWN_MENU_CLASS}`);
    if (menu) menu.style.display = 'none';
    event.preventDefault();
    event.stopPropagation();
}

/**
 * Adds a "Company Info" button with a dropdown to the context element.
 * @param {HTMLElement} contextElement The job card or details view element.
 * @param {string} companyName The name of the company.
 * @param {object|null} companyLinkData Object with {id, slug} or null if not available.
 */
function addCompanyInfoButton(contextElement, companyName, companyLinkData = null) {
    if (!contextElement || !companyName) return;
    removeCompanyInfoButton(contextElement); // Remove previous button if any

    const wrapper = document.createElement('div');
    wrapper.className = COMPANY_INFO_WRAPPER_CLASS;
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-flex'; // For details view alignment
    wrapper.style.alignItems = 'center';

    const toggleButton = document.createElement('button');
    toggleButton.className = `${COMPANY_INFO_TOGGLE_BUTTON_CLASS} artdeco-button artdeco-button--secondary artdeco-button--muted artdeco-button--2`;
    toggleButton.textContent = "Company Info...";
    toggleButton.title = `Get more information about ${companyName}`;
    Object.assign(toggleButton.style, {
        cursor: 'pointer', lineHeight: 'normal', borderWidth: '2px',
        borderStyle: 'solid', borderColor: 'transparent'
    });
    toggleButton.addEventListener('click', toggleCompanyInfoDropdown);

    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = COMPANY_INFO_DROPDOWN_MENU_CLASS;
    Object.assign(dropdownMenu.style, {
        display: 'none', position: 'absolute', top: '100%', left: '0', backgroundColor: 'white',
        border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
        zIndex: '1001', minWidth: '180px', marginTop: '2px' // Higher z-index than flag dropdown
    });

    const options = [
        { text: 'Glassdoor Search', action: 'glassdoor' },
        { text: 'Careers Page', action: 'careers' },
        { text: 'Company News', action: 'news' },
        { text: 'Search Layoffs', action: 'layoffs' },
        { text: 'View All Jobs (LI)', action: 'linkedin_jobs' },
    ];

    options.forEach(opt => {
        const optionEl = document.createElement('button');
        optionEl.className = COMPANY_INFO_DROPDOWN_OPTION_CLASS;
        optionEl.textContent = opt.text;
        optionEl.dataset.action = opt.action;
        Object.assign(optionEl.style, {
            display: 'block', width: '100%', padding: '8px 12px', border: 'none',
            backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '0.9em',
            color: '#333'
        });
        optionEl.addEventListener('mouseenter', () => optionEl.style.backgroundColor = '#f0f0f0');
        optionEl.addEventListener('mouseleave', () => optionEl.style.backgroundColor = 'transparent');
        optionEl.addEventListener('click', (e) => handleCompanyInfoOptionClick(e, companyName, companyLinkData));
        dropdownMenu.appendChild(optionEl);
    });

    wrapper.appendChild(toggleButton);
    wrapper.appendChild(dropdownMenu);

    // --- Insertion Logic ---
    let insertionPoint = null;
    let referenceNode = null;
    let viewType = "Unknown";

    // Check for job details/posting view by looking for its specific button container
    const potentialTopButtonsInContext = contextElement.querySelector('.job-details-jobs-unified-top-card__top-buttons');

    if (contextElement.matches('.job-card-container')) { // List view
        viewType = "List";
        // Insert inside lockup content, after subtitle (or flag symbol if present)
        insertionPoint = contextElement.querySelector('.artdeco-entity-lockup__content');
        referenceNode = insertionPoint?.querySelector(`.${FLAG_SYMBOL_BASE_CLASS}`) // Prefer inserting after flag symbol
                     || insertionPoint?.querySelector('.artdeco-entity-lockup__subtitle'); // Fallback to subtitle

        if (insertionPoint && referenceNode) {
             wrapper.style.display = 'block'; // Ensure it takes its own line in list view
             wrapper.style.boxSizing = 'border-box';
             wrapper.style.marginTop = '4px';
             referenceNode.parentNode.insertBefore(wrapper, referenceNode.nextSibling);
        } else if (insertionPoint) {
             console.warn(`Company Info: Could not find preferred insertion reference in list view for "${companyName}". Appending.`);
             insertionPoint.appendChild(wrapper);
        } else {
             console.warn(`Company Info: Could not find insertion point in list view card for "${companyName}".`);
        }

    } else if (potentialTopButtonsInContext) { // This implies a job details or job posting view
        viewType = "DetailsOrJobPosting";
        const topButtonsContainer = potentialTopButtonsInContext; // This is .job-details-jobs-unified-top-card__top-buttons
        // contextElement is the card containing these buttons

        if (topButtonsContainer) {
            const flagButtonWrapper = topButtonsContainer.querySelector(`.${FLAG_WRAPPER_CLASS}`);
            const moreOptionsContainerInTopButtons = topButtonsContainer.querySelector('.artdeco-dropdown.jobs-options'); // Container of "More options"

            // Style the Glassdoor button container to be inline and match sibling button margins
            wrapper.style.display = 'inline-flex'; // Already set, but ensure it's not overridden
            wrapper.style.alignItems = 'center';
            wrapper.style.marginLeft = '8px'; // Consistent with other buttons in that row
            wrapper.style.marginTop = '0px';  // Override default block margin
            let inserted = false;

            if (flagButtonWrapper && flagButtonWrapper.parentNode === topButtonsContainer) { // Primary: Insert AFTER the flag button wrapper
                flagButtonWrapper.parentNode.insertBefore(wrapper, flagButtonWrapper.nextSibling);
                inserted = true;
            } else if (moreOptionsContainerInTopButtons && moreOptionsContainerInTopButtons.parentNode === topButtonsContainer) {
                // If flag button not found (or not in this container), insert Company Info button BEFORE the "More options" container
                topButtonsContainer.insertBefore(wrapper, moreOptionsContainerInTopButtons);
                inserted = true;
            } else {
                // Fallback: if neither flag button nor "More options" container is found, append to the top buttons container.
                console.warn(`Company Info: Neither Flag wrapper nor 'More Options' container found in top buttons. Appending Company Info button for "${companyName}".`);
                topButtonsContainer.appendChild(wrapper);
                inserted = true;
            }
        } else {
            // Fallback if topButtonsContainer is not found (should be rare for these views)
            console.warn(`Company Info: '.job-details-jobs-unified-top-card__top-buttons' not found for "${companyName}". Attempting fallback append.`);
            insertionPoint = contextElement.firstElementChild; // Main div inside the card
            referenceNode = insertionPoint?.querySelector('.display-flex.align-items-center'); // Or after header

            if (insertionPoint && referenceNode && referenceNode.parentNode) {
                referenceNode.parentNode.insertBefore(wrapper, referenceNode.nextSibling);
            } else if (insertionPoint) {
                insertionPoint.appendChild(wrapper); // Last resort
            } else {
                console.error(`Company Info: Critical - Could not find any insertion point in details view for "${companyName}".`);
            }
         }
    } else if (contextElement.matches('.org-top-card .ph5.pb5, .org-top-card-layout__card.mt2')) { // Company Page view
        viewType = "CompanyPage";
        // .ph5.pb5 or .org-top-card-layout__card.mt2 is the contextElement
        const primaryActionsInnerContainer = contextElement.querySelector('.org-top-card-primary-actions .org-top-card-primary-actions__inner');
        const primaryActionsOuterContainer = contextElement.querySelector('.org-top-card-primary-actions');
        // Prefer inserting into the __inner container if it exists
        const buttonInsertionTarget = primaryActionsInnerContainer || primaryActionsOuterContainer;

        const flagButtonWrapper = buttonInsertionTarget?.querySelector(`.${FLAG_WRAPPER_CLASS}`); // Check for flag button within the target
        const overflowContainer = contextElement.querySelector('.org-top-card-overflow');

        wrapper.style.marginLeft = '8px'; // Consistent spacing
        wrapper.style.verticalAlign = 'middle';

        let inserted = false;
        if (buttonInsertionTarget) {
            if (flagButtonWrapper) {
                // Insert after the flag button if it exists within the same target
                buttonInsertionTarget.insertBefore(wrapper, flagButtonWrapper.nextSibling);
            } else {
                // If flag button not found in target, append to the target
                buttonInsertionTarget.appendChild(wrapper);
            }
            inserted = true;
        } else if (overflowContainer && overflowContainer.parentNode) { // Fallback if no primary actions container
            // If no primary actions, insert before the overflow container
            overflowContainer.parentNode.insertBefore(wrapper, overflowContainer);
            inserted = true;
        }

        if (!inserted) {
            console.warn(`Company Info: Could not find suitable insertion point on company page for "${companyName}". Appending to context.`);
            const companyNameH1 = contextElement.querySelector('h1.org-top-card-summary__title');
            if (companyNameH1 && companyNameH1.parentNode) {
                companyNameH1.parentNode.insertBefore(wrapper, companyNameH1.nextSibling);
            } else { contextElement.appendChild(wrapper); }
        }
    }
}


function removeCompanyInfoButton(contextElement) {
    if (!contextElement) return;
    let buttonToRemove = null;

    // Try finding it directly within the context element first
    buttonToRemove = contextElement.querySelector(`.${COMPANY_INFO_WRAPPER_CLASS}`);

    if (buttonToRemove && buttonToRemove.parentNode) {
        buttonToRemove.remove();
        return;
    }

    // If not found directly, check specific containers for different views
    if (contextElement.matches('.job-details-jobs-unified-top-card__container--two-pane, .jobs-details__main-content .job-details-jobs-unified-top-card, .job-details-jobs-unified-top-card')) {
        const topButtonsContainer = contextElement.querySelector('.job-details-jobs-unified-top-card__top-buttons');
        topButtonsContainer?.querySelectorAll(`.${COMPANY_INFO_WRAPPER_CLASS}`).forEach(btn => btn.remove());
    } else if (contextElement.matches('.org-top-card .ph5.pb5, .org-top-card-layout__card.mt2')) {
        const primaryActionsContainer = contextElement.querySelector('.org-top-card-primary-actions .org-top-card-primary-actions__inner, .org-top-card-primary-actions');
        primaryActionsContainer?.querySelectorAll(`.${COMPANY_INFO_WRAPPER_CLASS}`).forEach(btn => btn.remove());
        // Check if it was inserted before overflow (less common but possible fallback)
        const overflowContainerParent = contextElement.querySelector('.org-top-card-overflow')?.parentNode;
        overflowContainerParent?.querySelectorAll(`.${COMPANY_INFO_WRAPPER_CLASS}`).forEach(btn => btn.remove());
    } else if (!buttonToRemove && contextElement.matches('.job-card-container')) {
        const contentDiv = contextElement.querySelector('.artdeco-entity-lockup__content');
        buttonToRemove = contentDiv?.querySelector(`.${COMPANY_INFO_WRAPPER_CLASS}`);
    }

    // If found, remove it
    if (buttonToRemove && buttonToRemove.parentNode) {
        buttonToRemove.remove();
        // console.log("Company Info: Removed existing button.");
    }
}

// --- Processing Logic ---

// Processes a single element (job card or details view)
async function processElementForCompanyInfo(contextElement, companyName, companyLinkData = null) {
    if (!companyName || !contextElement) return;

    try {
        // Re-select context element in case it was removed/replaced.
        let currentContextElement = null;
        if (contextElement.matches('.job-card-container')) {
            currentContextElement = document.querySelector(`.job-card-container[data-job-id="${contextElement.dataset.jobId}"]`);
            if (!currentContextElement) currentContextElement = contextElement; // Fallback
        } else if (contextElement.querySelector('.job-details-jobs-unified-top-card__top-buttons')) {
            // For job details pane or individual job posting page
            // Re-find the specific card. The contextElement passed here is already the card.
            // This re-selection logic might be overly complex if contextElement is already the correct card.
            // For now, assume contextElement is the correct card.
            currentContextElement = contextElement;
            // Example of re-finding if needed:
            // const topButtons = document.querySelector('.job-details-jobs-unified-top-card__top-buttons');
            // if (topButtons) currentContextElement = topButtons.closest('.artdeco-card, .job-details-jobs-unified-top-card__container--two-pane, .job-details-jobs-unified-top-card');
            if (!currentContextElement) currentContextElement = contextElement; // Fallback
        } else if (contextElement.matches('.org-top-card .ph5.pb5, .org-top-card-layout__card.mt2')) {
            // For company page
            currentContextElement = document.querySelector('.org-top-card .ph5.pb5, .org-top-card-layout__card.mt2');
            if (!currentContextElement) currentContextElement = contextElement; // Fallback
        } else {
            currentContextElement = contextElement; // Fallback
        }


        if (currentContextElement) { // Ensure element still exists
             addCompanyInfoButton(currentContextElement, companyName, companyLinkData);
        } else {
            // console.log(`Company Info: Context element for "${companyName}" disappeared before adding button.`);
        }

    } catch (error) {
        // This catch is primarily for unexpected errors in the processing logic itself
        console.error(`Company Info: Error processing element for "${companyName}" to add button:`, error);
    }
}

// Processes job list items
async function processListingsForCompanyInfo() {
    const jobListItems = document.querySelectorAll('li.scaffold-layout__list-item');
    const promises = [];
    let processedCount = 0;
    jobListItems.forEach(listItem => {
        const jobCard = listItem.querySelector('.job-card-container[data-job-id]'); // Ensure it's a job card with an ID
        if (!jobCard) return;

        // Check if already processed (simple check, might need refinement if UI updates frequently)
        // Using a more specific dataset key
        if (jobCard.dataset.glassdoorButtonAdded === 'true') {
             // console.log(`Company Info: Skipping job card ${jobCard.dataset.jobId}, button already added.`);
             return;
        }

        // Try to find company link first for better "View All Jobs" link
        const companyLinkElement = jobCard.querySelector('.job-card-container__company-name, .job-card-container__primary-description a, .artdeco-entity-lockup__subtitle a');
        let companyLinkData = null;
        if (companyLinkElement && companyLinkElement.href) {
            const companyUrl = new URL(companyLinkElement.href, window.location.origin);
            const pathParts = companyUrl.pathname.split('/').filter(Boolean); // e.g., ["company", "company-slug-or-id"]
            if (pathParts.length >= 2 && pathParts[0] === 'company') {
                const slugOrId = pathParts[1];
                if (/^\d+$/.test(slugOrId)) { // Check if it's a numeric ID
                    companyLinkData = { id: slugOrId, slug: null };
                } else {
                    companyLinkData = { id: null, slug: slugOrId };
                }
            }
        }

        const companyNameElement = jobCard.querySelector('.artdeco-entity-lockup__subtitle span, .job-card-container__company-name, .job-card-container__primary-description');
        const companyName = companyNameElement?.textContent?.trim(); // More robust trim

        if (companyName) {
            // Mark as processed immediately to prevent re-processing in rapid triggers
            jobCard.dataset.glassdoorButtonAdded = 'true';
            processedCount++;
            // Add processing to a list of promises
            promises.push(processElementForCompanyInfo(jobCard, companyName, companyLinkData));
        }
    });

    if (processedCount > 0) {
        // console.log(`Company Info: Queued ${processedCount} list items for button addition.`);
    }

    // Wait for all fetches/updates for this batch to settle
    await Promise.allSettled(promises);
}

// Processes the job details view
async function processDetailsViewForCompanyInfo() {
    const topButtonsContainer = document.querySelector('.job-details-jobs-unified-top-card__top-buttons');
    if (!topButtonsContainer) {
        // console.log("Company Info: '.job-details-jobs-unified-top-card__top-buttons' not found for details/job view.");
        return;
    }

    // The card that contains these buttons.
    const detailsContainer = topButtonsContainer.closest('.artdeco-card, .job-details-jobs-unified-top-card__container--two-pane, .job-details-jobs-unified-top-card');
    if (!detailsContainer) {
        console.warn("Company Info: Could not find a suitable parent card for '.job-details-jobs-unified-top-card__top-buttons'.");
        return;
    }

    // Now 'detailsContainer' is the card, and 'topButtonsContainer' is where buttons go.

     // Check if already processed
    if (detailsContainer.dataset.glassdoorButtonAdded === 'true') {
        // console.log("Company Info: Skipping details view, button already added.");
        return;
    }

    // Company name can be in an <a> tag or just a div
    const companyLinkAnchor = detailsContainer.querySelector('.job-details-jobs-unified-top-card__company-name a');
    const companyNameDivElement = detailsContainer.querySelector('.job-details-jobs-unified-top-card__company-name');
    const companyName = (companyLinkAnchor?.textContent || companyNameDivElement?.textContent)?.trim();

    let companyLinkData = null;

    if (companyLinkAnchor && companyLinkAnchor.href) {
        try {
            const companyUrl = new URL(companyLinkAnchor.href, window.location.origin);
            const pathParts = companyUrl.pathname.split('/').filter(Boolean); // e.g., ["company", "company-slug-or-id"]
            if (pathParts.length >= 2 && pathParts[0] === 'company') {
                const slugOrId = pathParts[1];
                if (/^\d+$/.test(slugOrId)) { // Check if it's a numeric ID
                    companyLinkData = { id: slugOrId, slug: null };
                } else {
                    companyLinkData = { id: null, slug: slugOrId };
                }
            }
        } catch (e) { console.error("Company Info: Error parsing company link URL", e); }
    }

    if (companyName) {
        // console.log(`Company Info: Processing details view for "${companyName}" to add button.`);
        detailsContainer.dataset.glassdoorButtonAdded = 'true'; // Mark as processed
        await processElementForCompanyInfo(detailsContainer, companyName, companyLinkData);
    }
}

// Processes the company profile page view
async function processCompanyProfilePageForCompanyInfo() {
    const companyPageTopCard = document.querySelector('.org-top-card .ph5.pb5, .org-top-card-layout__card.mt2');
    if (!companyPageTopCard) return;

    if (companyPageTopCard.dataset.glassdoorButtonAdded === 'true') {
        // console.log("Company Info: Skipping company profile page, button already added.");
        return;
    }

    const companyNameElement = companyPageTopCard.querySelector('h1.org-top-card-summary__title, .org-top-card-summary__title span[dir="ltr"]');
    const companyName = companyNameElement?.textContent?.trim();
    let companyLinkData = null;

    // Extract company slug/ID from URL or page content
    const companySlugMatch = window.location.pathname.match(/\/company\/([^/]+)/);
    if (companySlugMatch && companySlugMatch[1]) {
        const slug = companySlugMatch[1].replace(/\/$/, ''); // Remove trailing slash
        companyLinkData = { id: null, slug: slug };
        // Attempt to find a numeric ID from "xxx employees" link
        const employeesLink = companyPageTopCard.querySelector('a[href*="/search/results/people/?currentCompany="]');
        if (employeesLink && employeesLink.href) {
            try {
                const urlParams = new URLSearchParams(new URL(employeesLink.href, window.location.origin).search);
                const currentCompanyParam = urlParams.get('currentCompany');
                if (currentCompanyParam) {
                    const ids = JSON.parse(currentCompanyParam);
                    if (Array.isArray(ids) && ids.length > 0 && /^\d+$/.test(ids[0])) {
                        companyLinkData.id = ids[0]; // Prefer ID if found
                    }
                }
            } catch (e) { console.warn("Company Info: Could not parse company ID from employees link on company page.", e); }
        }
    }

    if (companyName) {
        // console.log(`Company Info: Processing company profile page for "${companyName}" to add button.`);
        companyPageTopCard.dataset.glassdoorButtonAdded = 'true'; // Mark as processed
        await processElementForCompanyInfo(companyPageTopCard, companyName, companyLinkData);
    }
}

// Main processing function
async function processPageForCompanyInfo() {
    // console.log("Company Info: Processing page for buttons...");
    await Promise.allSettled([
        processListingsForCompanyInfo(),
        processDetailsViewForCompanyInfo(), // Covers job search details and individual job posting
        processCompanyProfilePageForCompanyInfo() // Process company profile page
    ]);
    // console.log("Company Info: Finished processing page for buttons.");
}


// --- Initialization and Observation ---

function observeCompanyInfoRelevantChanges() {
    // Use same observer logic as flagCompany.js, just call different processing function
    const potentialTargetSelectors = [
        '.scaffold-layout__main',
        'main[role="main"]',
        'div.jobs-search-results-list',
        'div.jobs-search__left-rail',
        '.jobs-search__job-details--container', // For job search results page details pane
        '.jobs-details__main-content',          // For individual job posting page
        '.org-top-card'                         // For company pages
    ];

    let targetNode = null;
    let foundSelector = '';

    for (const selector of potentialTargetSelectors) {
        try {
            targetNode = document.querySelector(selector);
            if (targetNode) {
                foundSelector = selector;
                break;
            }
        } catch (error) { console.error(`Company Info: Error finding observer node with selector "${selector}":`, error); }
    }

    if (!targetNode) {
        targetNode = document.body;
        foundSelector = 'document.body';
    }

    console.log(`Company Info: Setting up MutationObserver on: ${foundSelector} for buttons.`);

    const config = { childList: true, subtree: true };

    const callback = function(mutationsList, observer) {
        let processNeeded = false;
        for (const mutation of mutationsList) {
             // Simple check: If nodes were added, check if they are relevant
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                 for (const node of mutation.addedNodes) {
                     if (node.nodeType === Node.ELEMENT_NODE) {
                         // Check for list items, details container, or elements *within* them that indicate content change
                         // Simplified job view check to '.job-details-jobs-unified-top-card'
                         if (node.matches(
                                `li.scaffold-layout__list-item, ` +
                                `.job-details-jobs-unified-top-card__container--two-pane, ` + // Job search details
                                `.job-details-jobs-unified-top-card, ` + // Individual job page (main card)
                                `.org-top-card .ph5.pb5, .org-top-card-layout__card.mt2, h1.org-top-card-summary__title` // Company page
                             ) ||
                             node.querySelector(
                                `li.scaffold-layout__list-item, ` +
                                `.job-details-jobs-unified-top-card__container--two-pane, .job-details-jobs-unified-top-card__job-title, .job-card-list__title, ` +
                                // `.jobs-details__main-content .job-details-jobs-unified-top-card, ` // Original
                                `.job-details-jobs-unified-top-card, ` + // Simplified for elements within job card
                                `.org-top-card .ph5.pb5, .org-top-card-layout__card.mt2, h1.org-top-card-summary__title`
                             )) {
                             processNeeded = true;
                             break;
                         }
                     }
                 }
            }
             // Also check if the target of the mutation is relevant (e.g., text change in company name)
             else if (mutation.type === 'characterData' || mutation.type === 'attributes') {
                 if (mutation.target && mutation.target.parentElement) {
                     const parent = mutation.target.parentElement;
                     if (parent.closest(
                        '.job-card-container, ' +
                        '.job-details-jobs-unified-top-card__container--two-pane, ' + // Job search details
                        '.job-details-jobs-unified-top-card, ' + // Individual job page card
                        '.org-top-card .ph5.pb5, .org-top-card-layout__card.mt2'
                        )) {
                         // Could potentially trigger reprocessing if text/attributes change within cards
                         // Be cautious with this, might trigger too often.
                         // processNeeded = true;
                         // break;
                     }
                 }
             }

             if (processNeeded) break;
        }

        if (processNeeded) {
            // console.log("Company Info: Observer detected relevant changes. Debouncing button processing...");
            debounceProcessPageForCompanyInfo();
        }
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);

    // Initial run
    setTimeout(processPageForCompanyInfo, 700); // Delay slightly more than flagCompany
}

// Debounce function
let debounceCompanyInfoTimer;
function debounceProcessPageForCompanyInfo() {
    clearTimeout(debounceCompanyInfoTimer);
    debounceCompanyInfoTimer = setTimeout(() => {
        processPageForCompanyInfo();
    }, 450); // Slightly different debounce time
}

// --- Start ---
function initializeCompanyInfoIntegration() {
    console.log("Company Info: Script file successfully parsed and initializeCompanyInfoIntegration() CALLED.");
    observeCompanyInfoRelevantChanges();
    // No message listener needed for this script currently
}

console.log("Company Info: Reached end of script, checking document.readyState.");

if (document.readyState === 'loading') {
    console.log("Company Info: document.readyState is 'loading'. Adding DOMContentLoaded listener.");
    document.addEventListener('DOMContentLoaded', function() {
        console.log("Company Info: DOMContentLoaded event fired.");
        initializeCompanyInfoIntegration();
    });
} else {
    console.log(`Company Info: document.readyState is '${document.readyState}'. Calling initializeCompanyInfoIntegration directly.`);
    initializeCompanyInfoIntegration();
}
