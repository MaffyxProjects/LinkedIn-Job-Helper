// flagCompany.js
console.log("!!! FLAG COMPANY SCRIPT (flagCompany.js) IS LOADING AND PARSING - TOP LEVEL !!!"); // ADDED THIS LINE

try { // ADDED TRY

    // --- Storage Key ---
    const COMPANY_FLAGS_KEY = 'companyFlags';

    // --- CSS Classes ---
    const FLAG_WRAPPER_CLASS = 'flag-company-wrapper';
    const FLAG_TOGGLE_BUTTON_CLASS = 'flag-company-toggle-button';
    const FLAG_DROPDOWN_MENU_CLASS = 'flag-company-dropdown-menu';
    const FLAG_DROPDOWN_OPTION_CLASS = 'flag-company-dropdown-option';
    const RED_FLAG_NOTE_CLASS = 'company-flag-note-red';
    const GREEN_FLAG_NOTE_CLASS = 'company-flag-note-green';
    const YELLOW_FLAG_NOTE_CLASS = 'company-flag-note-yellow';
    const RED_FLAG_SYMBOL_CLASS = 'company-flag-symbol-red';
    const GREEN_FLAG_SYMBOL_CLASS = 'company-flag-symbol-green';
    const YELLOW_FLAG_SYMBOL_CLASS = 'company-flag-symbol-yellow';
    // Add a general class for easier removal/checking
    const FLAG_NOTE_BASE_CLASS = 'company-flag-note-base';
    const FLAG_SYMBOL_BASE_CLASS = 'company-flag-symbol-base';
    // Glassdoor class from the other script for positioning reference
    const GLASSDOOR_SCORE_BOX_CLASS = 'glassdoor-score-box'; // Ensure this matches glassdoorIntegration.js


    // --- Flag Symbols & Colors ---
    const FLAG_TYPES = {
        red: {
            symbol: '🚩',
            name: 'Red',
            noteClass: `${RED_FLAG_NOTE_CLASS} ${FLAG_NOTE_BASE_CLASS}`, // Add base class
            symbolClass: `${RED_FLAG_SYMBOL_CLASS} ${FLAG_SYMBOL_BASE_CLASS}`, // Add base class
            bgColor: '#fff0f0',
            textColor: '#a94442',
            borderColor: '#ebccd1',
            btnBorderColor: '#ffb3b3'
        },
        green: {
            symbol: '✅',
            name: 'Green',
            noteClass: `${GREEN_FLAG_NOTE_CLASS} ${FLAG_NOTE_BASE_CLASS}`, // Add base class
            symbolClass: `${GREEN_FLAG_SYMBOL_CLASS} ${FLAG_SYMBOL_BASE_CLASS}`, // Add base class
            bgColor: '#f0fff0',
            textColor: '#3c763d',
            borderColor: '#d6e9c6',
            btnBorderColor: '#b3ffb3'
        },
        yellow: {
            symbol: '⚠️',
            name: 'Yellow',
            noteClass: `${YELLOW_FLAG_NOTE_CLASS} ${FLAG_NOTE_BASE_CLASS}`, // Add base class
            symbolClass: `${YELLOW_FLAG_SYMBOL_CLASS} ${FLAG_SYMBOL_BASE_CLASS}`, // Add base class
            bgColor: '#fff8e1',
            textColor: '#8a6d3b',
            borderColor: '#faebcc',
            btnBorderColor: '#ffe0b3'
        }
    };

    // --- State Variable ---
    // Removed lastProcessedDetailsCompanyName

    // --- Helper Functions (Storage) ---
    async function getCompanyFlags() {
        try {
            if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                console.error(`LinkedIn Job Flagger: chrome.storage.local API is not available.`);
                return {};
            }
            const result = await chrome.storage.local.get([COMPANY_FLAGS_KEY]);
            if (chrome.runtime.lastError) {
                console.error(`LinkedIn Job Flagger: Error getting company flags:`, chrome.runtime.lastError.message);
                return {};
            }
            return result[COMPANY_FLAGS_KEY] || {};
        } catch (error) {
            console.error(`LinkedIn Job Flagger: Exception getting company flags:`, error);
            return {};
        }
    }

    async function saveCompanyFlags(flags) {
        try {
            if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
                console.error(`LinkedIn Job Flagger: chrome.storage.local API is not available for saving.`);
                return;
            }
            await chrome.storage.local.set({ [COMPANY_FLAGS_KEY]: flags });
            if (chrome.runtime.lastError) {
                console.error(`LinkedIn Job Flagger: Error saving company flags:`, chrome.runtime.lastError.message);
            }
        } catch (error) {
            console.error(`LinkedIn Job Flagger: Exception saving company flags:`, error);
        }
    }

    // --- Helper Functions (UI & Dropdown) ---

    function toggleFlagDropdown(event) {
        const button = event.target.closest(`.${FLAG_TOGGLE_BUTTON_CLASS}`);
        if (!button) return;
        const wrapper = button.closest(`.${FLAG_WRAPPER_CLASS}`);
        if (!wrapper) return;
        const menu = wrapper.querySelector(`.${FLAG_DROPDOWN_MENU_CLASS}`);
        if (!menu) return;

        const isVisible = menu.style.display === 'block';
        menu.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            setTimeout(() => {
                document.addEventListener('click', closeDropdownOnClickOutside, { capture: true, once: true });
            }, 0);
        }
    }

    function closeDropdownOnClickOutside(event) {
        const openDropdown = document.querySelector(`.${FLAG_DROPDOWN_MENU_CLASS}[style*="display: block"]`);
        if (!openDropdown) return;
        const wrapper = openDropdown.closest(`.${FLAG_WRAPPER_CLASS}`);
        if (wrapper && !wrapper.contains(event.target)) {
            openDropdown.style.display = 'none';
        } else if (!wrapper) {
            openDropdown.style.display = 'none';
        }
    }

    async function handleFlagOptionClick(event) {
        const option = event.target.closest(`.${FLAG_DROPDOWN_OPTION_CLASS}`);
        if (!option) return;

        const wrapper = option.closest(`.${FLAG_WRAPPER_CLASS}`);
        // Let's try to find the detailsContainer more broadly, as it might be the card itself on job view pages
        const detailsContainer = wrapper?.closest('.artdeco-card, .job-details-jobs-unified-top-card__container--two-pane, .job-details-jobs-unified-top-card');
        const menu = wrapper?.querySelector(`.${FLAG_DROPDOWN_MENU_CLASS}`);

        if (!wrapper || !menu || !detailsContainer) {
            console.error("LinkedIn Job Flagger: Dropdown option clicked, but couldn't find necessary parent elements.");
            console.log("LinkedIn Job Flagger: Wrapper found:", !!wrapper);
            console.log("LinkedIn Job Flagger: Menu found:", !!menu);
            console.log("LinkedIn Job Flagger: DetailsContainer found:", !!detailsContainer, detailsContainer);
            return;
        }
        console.log("LinkedIn Job Flagger: Found wrapper, menu, and detailsContainer for flag action.");

        menu.style.display = 'none';

        const companyName = wrapper.dataset.companyName;
        const action = option.dataset.action;
        const flagType = option.dataset.type;

        if (!companyName) {
            console.error("LinkedIn Job Flagger: Company name not found on wrapper dataset. Wrapper dataset:", wrapper.dataset);
            return;
        }

        console.log(`LinkedIn Job Flagger: Handling flag option click for "${companyName}".`);
        console.log(`LinkedIn Job Flagger: Action: ${action}, Type: ${flagType}`);

        const allFlags = await getCompanyFlags();
        const currentFlagData = allFlags[companyName];
        let refreshNeeded = false;

        if (action === 'unflag') {
            if (currentFlagData && confirm(`Are you sure you want to remove the ${currentFlagData.type} flag for "${companyName}"?`)) {
                delete allFlags[companyName];
                await saveCompanyFlags(allFlags);
                alert(`Flag removed for "${companyName}". Refreshing view...`);
                refreshNeeded = true;
            } else if (!currentFlagData) {
                 console.warn(`LinkedIn Job Flagger: Tried to unflag "${companyName}", but no flag was found.`);
            }
        } else if (action === 'add' || action === 'edit') {
            if (!flagType || !FLAG_TYPES[flagType]) {
                console.error(`LinkedIn Job Flagger: Invalid flag type "${flagType}" selected.`);
                return;
            }

            console.log("LinkedIn Job Flagger: Proceeding to show prompt for add/edit.");
            const config = FLAG_TYPES[flagType];
            let promptMessage = `Enter note for ${config.name} flag (${config.symbol}) for "${companyName}":`;
            let existingNote = (action === 'edit' && currentFlagData && currentFlagData.type === flagType) ? currentFlagData.note : '';
            if (action === 'edit' && currentFlagData && currentFlagData.type !== flagType) {
                promptMessage = `Changing to ${config.name} flag (${config.symbol}) for "${companyName}". Enter note:`;
                existingNote = '';
            }
            console.log("LinkedIn Job Flagger: Prompt message:", promptMessage, "Existing note:", existingNote);

            const note = prompt(promptMessage, existingNote);

            if (note === null) {
                console.log(`LinkedIn Job Flagger: User cancelled flag prompt for "${companyName}".`);
                return;
            }

            const trimmedNote = note.trim();
            if (trimmedNote === '') {
                if (currentFlagData && confirm(`Note is empty. Remove the current ${currentFlagData.type} flag for "${companyName}"?`)) {
                    delete allFlags[companyName];
                    await saveCompanyFlags(allFlags);
                    alert(`Flag removed for "${companyName}" due to empty note. Refreshing view...`);
                    refreshNeeded = true;
                } else {
                     console.log(`LinkedIn Job Flagger: Empty note provided for "${companyName}", no action taken.`);
                }
            } else {
                const newFlagData = { note: trimmedNote, type: flagType };
                allFlags[companyName] = newFlagData;
                await saveCompanyFlags(allFlags);
                alert(`"${companyName}" ${flagType} flagged with note:\n${trimmedNote}\nRefreshing view...`);
                refreshNeeded = true;
            }
        }

        if (refreshNeeded) {
            console.log("LinkedIn Job Flagger: Triggering content refresh after flag action.");
            await processPageContent();
        }
    }

    // --- UI Display/Removal Functions ---


    /**
     * Removes *all* flag symbols from the job list view.
     */
    function removeAllListViewFlags() {
        // Target the container holding the job list items more specifically
        const listContainer = document.querySelector('.jobs-search-results-list__list-items, .scaffold-layout__list > ul');
        if (!listContainer) {
            // console.warn("LinkedIn Job Flagger: Could not find list container to remove flags.");
            return;
        }
        listContainer.querySelectorAll(`.${FLAG_SYMBOL_BASE_CLASS}`).forEach(el => el.remove());
        // console.log("LinkedIn Job Flagger: Removed all list view flag symbols."); // Debug log
    }


    /**
     * Adds the appropriate flag symbol to a job card in the list view.
     * Assumes cleanup has already happened.
     */
    function addSymbolToListView(jobCardElement, flagData, companyName) {
        if (!jobCardElement || !flagData || !flagData.type || !FLAG_TYPES[flagData.type]) return;

        const flagType = flagData.type;
        const note = flagData.note || "(No note)";
        const config = FLAG_TYPES[flagType];

        // Check if a flag symbol *already exists* for this specific item.
        if (jobCardElement.querySelector(`.${FLAG_SYMBOL_BASE_CLASS}`)) {
            // console.warn(`LinkedIn Job Flagger: Symbol already exists for "${companyName}" in list view. Skipping add.`);
            return;
        }

        const subtitleElement = jobCardElement.querySelector('.artdeco-entity-lockup__subtitle');
        const companyNameSpan = subtitleElement?.querySelector('span'); // Select the first span inside subtitle

        if (companyNameSpan && subtitleElement) {
            const flagSymbol = document.createElement('span');
            flagSymbol.className = config.symbolClass;
            flagSymbol.textContent = ` ${config.symbol}`;
            flagSymbol.title = `${config.name} Flag: ${note}`;
            Object.assign(flagSymbol.style, { cursor: 'help', fontSize: '1.1em', verticalAlign: 'middle' });
            // Insert after the company name span
            companyNameSpan.parentNode.insertBefore(flagSymbol, companyNameSpan.nextSibling);
        } else {
            console.warn(`LinkedIn Job Flagger: Could not find subtitleElement or companyNameSpan in list view for:`, companyName);
        }
    }

    /**
     * Adds a flag note to the job details view or individual job posting view.
     */
    function addNoteToDetailsView(cardElement, flagData, companyName) {
        if (!cardElement || !flagData || !flagData.type || !FLAG_TYPES[flagData.type]) return;

        // Remove existing note from this card first
        cardElement.querySelectorAll(`.${FLAG_NOTE_BASE_CLASS}`).forEach(el => el.remove());

        const config = FLAG_TYPES[flagData.type];
        const note = flagData.note || "(No note)";
        const flagDiv = document.createElement('div');
        flagDiv.className = config.noteClass;
        Object.assign(flagDiv.style, {
            backgroundColor: config.bgColor, color: config.textColor, border: `1px solid ${config.borderColor}`,
            padding: '8px 12px', borderRadius: '4px', fontSize: '0.9em', lineHeight: '1.4',
            wordBreak: 'break-word', marginTop: '10px', marginBottom: '10px', display: 'block'
        });
        flagDiv.textContent = `${config.symbol} ${config.name} Flag: ${note}`;
        flagDiv.title = `Company: ${companyName}\n${config.name} Note: ${note}`;

        // Insertion logic for the note within the cardElement (e.g., .artdeco-card)
        // Structure for job view: .artdeco-card > .relative > .p5 > (header, title, description, etc.)
        const p5Container = cardElement.querySelector('.p5'); // Specific to job view card structure
        const targetContainerForNote = p5Container || cardElement; // Fallback to cardElement

        // Insert after the block containing company name/job title/primary description.
        // A good reference is often the container of the "Apply" and "Save" buttons.
        const applySaveButtonsContainer = targetContainerForNote.querySelector('.mt4 > .display-flex'); // Contains Apply/Save
        const primaryDescriptionBlock = targetContainerForNote.querySelector('.job-details-jobs-unified-top-card__primary-description-container');

        let referenceNodeForNoteInsertion = applySaveButtonsContainer || primaryDescriptionBlock;

        if (referenceNodeForNoteInsertion && referenceNodeForNoteInsertion.parentNode) {
            referenceNodeForNoteInsertion.parentNode.insertBefore(flagDiv, referenceNodeForNoteInsertion.nextSibling);
        } else {
            // Fallback: append to the targetContainerForNote (e.g., inside .p5 or the card itself)
            const headerBlock = targetContainerForNote.querySelector('.display-flex.align-items-center'); // company logo/name/top-buttons
            if (headerBlock && headerBlock.parentNode) {
                headerBlock.parentNode.insertBefore(flagDiv, headerBlock.nextSibling);
            } else {
                targetContainerForNote.appendChild(flagDiv);
            }
            console.warn(`LinkedIn Job Flagger: Could not find precise reference for note in details view for "${companyName}". Used fallback append.`);
        }
    }


    function updateButtonAndDropdown(wrapper, companyName, flagData) {
        if (!wrapper) return;
        const toggleButton = wrapper.querySelector(`.${FLAG_TOGGLE_BUTTON_CLASS}`);
        const dropdownMenu = wrapper.querySelector(`.${FLAG_DROPDOWN_MENU_CLASS}`);
        if (!toggleButton || !dropdownMenu) {
            console.error("LinkedIn Job Flagger: Could not find toggle button or dropdown menu to update.");
            return;
        }

        wrapper.dataset.companyName = companyName;

        let newText, newTitle, newBorderColor;
        if (flagData && flagData.type && FLAG_TYPES[flagData.type]) {
            const config = FLAG_TYPES[flagData.type];
            newText = `Flagged ${config.symbol}`;
            newTitle = `Edit ${config.name} flag for ${companyName}. Current note: ${flagData.note || '(No note)'}`;
            newBorderColor = 'transparent'; // Maintain transparent border
        } else {
            newText = 'Flag Company...';
            newTitle = `Flag ${companyName} (Red/Yellow/Green) with a note`;
            newBorderColor = 'transparent'; // Keep transparent when no flag is set
        }

        if (toggleButton.textContent !== newText) toggleButton.textContent = newText;
        if (toggleButton.title !== newTitle) toggleButton.title = newTitle;
        if (toggleButton.style.borderColor !== newBorderColor) toggleButton.style.borderColor = newBorderColor;
        if (toggleButton.style.backgroundColor !== '') toggleButton.style.backgroundColor = '';

        dropdownMenu.innerHTML = '';
        const createOption = (text, action, type = null) => {
            const option = document.createElement('button');
            option.className = FLAG_DROPDOWN_OPTION_CLASS;
            option.textContent = text;
            option.dataset.action = action;
            if (type) option.dataset.type = type;
            Object.assign(option.style, {
                display: 'block', width: '100%', padding: '8px 12px', border: 'none',
                backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '0.9em',
                color: '#333'
            });
            option.addEventListener('mouseenter', () => option.style.backgroundColor = '#f0f0f0');
            option.addEventListener('mouseleave', () => option.style.backgroundColor = 'transparent');
            option.addEventListener('click', handleFlagOptionClick);
            return option;
        };

        if (flagData && flagData.type && FLAG_TYPES[flagData.type]) {
            const currentType = flagData.type;
            Object.keys(FLAG_TYPES).forEach(type => {
                const config = FLAG_TYPES[type];
                const isCurrent = type === currentType;
                const text = `${isCurrent ? 'Edit Current' : 'Change to'} ${config.name} ${config.symbol}`;
                dropdownMenu.appendChild(createOption(text, 'edit', type));
            });
            const separator = document.createElement('hr');
            Object.assign(separator.style, { margin: '4px 0', border: 'none', borderTop: '1px solid #ccc' });
            dropdownMenu.appendChild(separator);
            dropdownMenu.appendChild(createOption('Remove Flag', 'unflag'));
        } else {
            Object.keys(FLAG_TYPES).forEach(type => {
                const config = FLAG_TYPES[type];
                dropdownMenu.appendChild(createOption(`Flag ${config.name} ${config.symbol}`, 'add', type));
            });
        }
    }

    // --- Processing Functions ---

    /**
     * Processes visible job listings, adding flags where appropriate.
     * Assumes removeAllListViewFlags() has already been called.
     */
    async function processJobListings(allFlags) {
        const jobListItems = document.querySelectorAll('li.scaffold-layout__list-item');
        if (jobListItems.length === 0) return;

        jobListItems.forEach(listItem => {
            const jobCard = listItem.querySelector('.job-card-container');
            if (!jobCard) return;

            // Cleanup is now done globally before this loop
            // REMOVED: removeFlagDisplay(jobCard);

            const companyNameElement = jobCard.querySelector('.artdeco-entity-lockup__subtitle span');
            const companyName = companyNameElement?.textContent.trim();

            if (companyName) {
                const flagData = allFlags[companyName];
                if (flagData && flagData.type && FLAG_TYPES[flagData.type])
                    addSymbolToListView(jobCard, flagData, companyName);
            } else {
                 // console.warn("LinkedIn Job Flagger: Could not find company name element in list item using '.artdeco-entity-lockup__subtitle span':", listItem);
            }
        });
    }

    /**
     * Processes the job details view in the right pane.
     * Ensures the flag button and note are correctly displayed or removed.
     */
    async function processJobDetailsView(allFlags) {
        const topButtonsContainer = document.querySelector('.job-details-jobs-unified-top-card__top-buttons');
        if (!topButtonsContainer) {
            // console.log("LinkedIn Job Flagger: '.job-details-jobs-unified-top-card__top-buttons' not found for details/job view.");
            return;
        }

        // The card that contains these buttons. This will be our main context for company name, notes.
        const detailsContainer = topButtonsContainer.closest('.artdeco-card, .job-details-jobs-unified-top-card__container--two-pane, .job-details-jobs-unified-top-card');
        if (!detailsContainer) {
            console.warn("LinkedIn Job Flagger: Could not find a suitable parent card for '.job-details-jobs-unified-top-card__top-buttons'.");
            return;
        }

        // The 'actionsContainer' is where the button itself will be inserted.
        // For job details/posting view, this is the topButtonsContainer.
        const actionsContainer = topButtonsContainer;
        
        // Note removal is handled by addNoteToDetailsView before adding a new one.

        // Company name can be in an <a> tag or just a div
        const companyNameLinkElement = detailsContainer.querySelector('.job-details-jobs-unified-top-card__company-name a');
        const companyNameDivElement = detailsContainer.querySelector('.job-details-jobs-unified-top-card__company-name');
        const companyName = (companyNameLinkElement?.textContent || companyNameDivElement?.textContent)?.trim();
        if (!companyName) { console.warn("LinkedIn Job Flagger: Company name could not be extracted in processJobDetailsView.", detailsContainer); return; }

        const flagData = allFlags[companyName] || null;

        // --- Locate Insertion Points ---
        // actionsContainer is already defined as topButtonsContainer
        
        let flagWrapper = detailsContainer.querySelector(`.${FLAG_WRAPPER_CLASS}`);
        let buttonCreatedOrFound = !!flagWrapper;

        // --- Create or Find Button ---
        if (!flagWrapper && actionsContainer) {
            try {
                flagWrapper = document.createElement('div');
                flagWrapper.className = FLAG_WRAPPER_CLASS;
                Object.assign(flagWrapper.style, { position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '8px' });

                const toggleButton = document.createElement('button');
                toggleButton.className = `${FLAG_TOGGLE_BUTTON_CLASS} artdeco-button artdeco-button--secondary artdeco-button--muted artdeco-button--2`;
                toggleButton.type = 'button';
                Object.assign(toggleButton.style, {
                    borderWidth: '2px', borderStyle: 'solid', borderColor: 'transparent',
                    lineHeight: 'normal'
                });
                toggleButton.addEventListener('click', toggleFlagDropdown);

                const dropdownMenu = document.createElement('div');
                dropdownMenu.className = FLAG_DROPDOWN_MENU_CLASS;
                Object.assign(dropdownMenu.style, {
                    display: 'none', position: 'absolute', top: '100%', left: '0', backgroundColor: 'white',
                    border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                    zIndex: '1000', minWidth: '150px', marginTop: '2px'
                });

                flagWrapper.appendChild(toggleButton);
                flagWrapper.appendChild(dropdownMenu);

                let inserted = false;
                // Find the "More options" dropdown container within the actionsContainer
                const moreOptionsContainerInTopButtons = actionsContainer.querySelector('.artdeco-dropdown.jobs-options');

                if (moreOptionsContainerInTopButtons) {
                    // Insert flagWrapper before the "More options" container
                    actionsContainer.insertBefore(flagWrapper, moreOptionsContainerInTopButtons);
                    inserted = true;
                } else {
                    console.warn(`LinkedIn Job Flagger: "More options" container not found in actions. Appending flag button for "${companyName}".`);
                    try {
                        actionsContainer.appendChild(flagWrapper);
                        inserted = true;
                    } catch (appendError) {
                         console.error(`LinkedIn Job Flagger: Fallback appendChild also FAILED for "${companyName}":`, appendError);
                    }
                }

                if (inserted) {
                    buttonCreatedOrFound = true;
                } else {
                     flagWrapper = null;
                }

            } catch (error) {
                console.error(`LinkedIn Job Flagger: UNEXPECTED ERROR during button creation/insertion logic for "${companyName}":`, error);
                flagWrapper = null;
            }
        } else if (!actionsContainer && !flagWrapper) { // Only warn if no actionsContainer AND no button was found
            console.warn(`LinkedIn Job Flagger: Cannot add button - actionsContainer NOT FOUND for "${companyName}".`);
        }

        // --- Update Button Content and Display Note ---
        if (buttonCreatedOrFound && flagWrapper) {
            updateButtonAndDropdown(flagWrapper, companyName, flagData);
        } else if (buttonCreatedOrFound && !flagWrapper) {
            console.error(`LinkedIn Job Flagger: Logic indicated button should exist or was created, but flagWrapper is null. Cannot update button for "${companyName}".`);
        }

        if (flagData && flagData.type && FLAG_TYPES[flagData.type]) {
            addNoteToDetailsView(detailsContainer, flagData, companyName);
        }
    }

    /**
     * Processes the company profile page view.
     * Ensures the flag button and note are correctly displayed or removed.
     */
    async function processCompanyProfilePage(allFlags) {
        // More specific selector for the top card content area on company pages
        const companyPageTopCard = document.querySelector('.org-top-card .ph5.pb5, .org-top-card-layout__card.mt2');
        if (!companyPageTopCard) return;

        // Remove any existing flag notes from this specific context before adding a new one
        companyPageTopCard.querySelectorAll(`.${FLAG_NOTE_BASE_CLASS}`).forEach(el => el.remove());

        const companyNameElement = companyPageTopCard.querySelector('h1.org-top-card-summary__title, .org-top-card-summary__title span[dir="ltr"]');
        const companyName = companyNameElement?.textContent?.trim() || "Unknown Company (Profile)";
        const flagData = allFlags[companyName] || null;

        // --- Locate Insertion Points ---
        // Primary actions container (Follow, Message buttons)
        const primaryActionsInnerContainer = companyPageTopCard.querySelector('.org-top-card-primary-actions .org-top-card-primary-actions__inner');
        const primaryActionsOuterContainer = companyPageTopCard.querySelector('.org-top-card-primary-actions');
        const buttonInsertionTarget = primaryActionsInnerContainer || primaryActionsOuterContainer;
        // Overflow menu container (ellipsis button)
        const overflowContainer = companyPageTopCard.querySelector('.org-top-card-overflow');

        let flagWrapper = companyPageTopCard.querySelector(`.${FLAG_WRAPPER_CLASS}`);
        let buttonCreatedOrFound = !!flagWrapper;

        // --- Create or Find Button ---
        if (!flagWrapper && (buttonInsertionTarget || overflowContainer)) {
            try {
                flagWrapper = document.createElement('div');
                flagWrapper.className = FLAG_WRAPPER_CLASS;
                Object.assign(flagWrapper.style, { position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '8px', verticalAlign: 'middle' });

                const toggleButton = document.createElement('button');
                toggleButton.className = `${FLAG_TOGGLE_BUTTON_CLASS} artdeco-button artdeco-button--secondary artdeco-button--muted artdeco-button--2`; // Match style of other buttons
                toggleButton.type = 'button';
                Object.assign(toggleButton.style, {
                    borderWidth: '2px', borderStyle: 'solid', borderColor: 'transparent',
                    lineHeight: 'normal'
                });
                toggleButton.addEventListener('click', toggleFlagDropdown);

                const dropdownMenu = document.createElement('div');
                dropdownMenu.className = FLAG_DROPDOWN_MENU_CLASS;
                Object.assign(dropdownMenu.style, {
                    display: 'none', position: 'absolute', top: '100%', left: '0', backgroundColor: 'white',
                    border: '1px solid #ccc', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                    zIndex: '1000', minWidth: '150px', marginTop: '2px'
                });

                flagWrapper.appendChild(toggleButton);
                flagWrapper.appendChild(dropdownMenu);

                let inserted = false;
                if (buttonInsertionTarget) {
                    // Insert after existing buttons in primary actions, or at the end
                    buttonInsertionTarget.appendChild(flagWrapper);
                    inserted = true;
                } else if (overflowContainer && overflowContainer.parentNode) {
                    // If no primary actions container, insert before the overflow menu container
                    overflowContainer.parentNode.insertBefore(flagWrapper, overflowContainer);
                    inserted = true;
                }

                if (inserted) {
                    buttonCreatedOrFound = true;
                } else {
                    console.warn(`LinkedIn Job Flagger: Could not find suitable insertion point on company page for "${companyName}".`);
                    flagWrapper = null;
                }
            } catch (error) {
                console.error(`LinkedIn Job Flagger: UNEXPECTED ERROR during button creation/insertion on company page for "${companyName}":`, error);
                flagWrapper = null;
            }
        } else if (!buttonInsertionTarget && !overflowContainer && !flagWrapper) {
            console.warn(`LinkedIn Job Flagger: Cannot add button - no actions or overflow container found on company page for "${companyName}".`);
        }

        // --- Update Button Content ---
        if (buttonCreatedOrFound && flagWrapper) {
            updateButtonAndDropdown(flagWrapper, companyName, flagData);
        }

        // --- Display Flag Note (Company Page) - After buttons ---
        if (flagData && flagData.type && FLAG_TYPES[flagData.type]) {
            const config = FLAG_TYPES[flagData.type];
            const noteDiv = document.createElement('div');
            noteDiv.className = config.noteClass; // This includes FLAG_NOTE_BASE_CLASS
            Object.assign(noteDiv.style, {
                backgroundColor: config.bgColor, color: config.textColor, border: `1px solid ${config.borderColor}`,
                padding: '8px 12px', borderRadius: '4px', fontSize: '0.9em', lineHeight: '1.4',
                wordBreak: 'break-word', marginTop: '10px', marginBottom: '10px', display: 'block', clear: 'both'
            });
            noteDiv.textContent = `${config.symbol} ${config.name} Flag: ${flagData.note || "(No note)"}`;
            noteDiv.title = `Company: ${companyName}\n${config.name} Note: ${flagData.note || "(No note)"}`;

            // Find the container of the action buttons.
            // We want to insert the note AFTER the entire 'org-top-card-primary-actions' block
            // or after the 'org-top-card-overflow' block if the primary actions are missing.
            const referenceNodeForNote = primaryActionsOuterContainer || overflowContainer;

            if (referenceNodeForNote && referenceNodeForNote.parentNode) {
                // Insert the note after this block of actions.
                referenceNodeForNote.parentNode.insertBefore(noteDiv, referenceNodeForNote.nextSibling);
            } else {
                // Fallback: if no clear actions block, insert after company name/tagline
                // This part of the fallback should ideally not be reached if the page structure is as expected.
                const companyTagline = companyPageTopCard.querySelector('.org-top-card-summary-info-list');
                const refNode = companyTagline || companyNameElement;
                if (refNode && refNode.parentNode) {
                    refNode.parentNode.insertBefore(noteDiv, refNode.nextSibling);
                } else {
                    companyPageTopCard.appendChild(noteDiv); // Absolute fallback
                }
                console.warn(`LinkedIn Job Flagger: Could not find actions block for note on company page for "${companyName}". Used fallback.`);
            }
        }
    }

    /**
     * Main function to process the entire page content for flags.
     * Cleans list view flags globally, then processes list and details.
     */
    async function processPageContent() {
        // console.log("LinkedIn Job Flagger: processPageContent running.");
        const allFlags = await getCompanyFlags();
        // console.log("LinkedIn Job Flagger: Fetched flags:", allFlags);
        try {
            removeAllListViewFlags(); // Clean up list view symbols first
            await processJobListings(allFlags); // Add correct list view symbols
            await processJobDetailsView(allFlags); // Process details view (button & note)
            await processCompanyProfilePage(allFlags); // Process company profile page
        } catch (error) {
            console.error("LinkedIn Job Flagger: Error during page processing:", error);
        }
        // console.log("LinkedIn Job Flagger: processPageContent finished.");
    }

    // --- Debounce Function ---
    let debouncePageTimer;
    function debounceProcessPageContent() {
        clearTimeout(debouncePageTimer);
        debouncePageTimer = setTimeout(() => {
            console.log("LinkedIn Job Flagger: Debounced processing running."); // Keep this log
            processPageContent();
        }, 350); // Debounce time
    }

    // --- Observer Function ---
    function observeJobListChanges() {
        const potentialTargetSelectors = [
            '.scaffold-layout__main', // Main content area
            'main[role="main"]',      // Alternative main area selector
            '.jobs-search-two-pane__wrapper' // Wrapper for the two-pane layout
        ];
        let targetNode = null;
        let foundSelector = '';
        for (const selector of potentialTargetSelectors) {
            try {
                targetNode = document.querySelector(selector);
                if (targetNode) { foundSelector = selector; break; }
            } catch (error) { console.error(`LinkedIn Job Flagger: Error using selector "${selector}":`, error); }
        }
        if (!targetNode) {
            console.error("LinkedIn Job Flagger: CRITICAL - Could not find a suitable specific container node for MutationObserver. Observing may be inefficient or fail.");
            targetNode = document.body; // Keep body as last resort
            foundSelector = 'document.body (fallback)';
        }

        console.log(`LinkedIn Job Flagger: Setting up MutationObserver on: ${foundSelector}`);
        // Observe changes to child nodes and attributes within the subtree
        const config = { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }; // Added attributes observation

        const callback = function(mutationsList, observer) {
            let processNeeded = false;
            for (const mutation of mutationsList) {
                // Check 1: If nodes were added/removed that are relevant
                if (mutation.type === 'childList') {
                    for (const node of [...mutation.addedNodes, ...mutation.removedNodes]) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.matches(`li.scaffold-layout__list-item, .job-details-jobs-unified-top-card, .jobs-search-results-list, .jobs-search__job-details--container, .job-card-list__title, .job-details-jobs-unified-top-card__job-title, .org-top-card, h1.org-top-card-summary__title`) ||
                                node.querySelector(`li.scaffold-layout__list-item, .job-details-jobs-unified-top-card, .job-card-list__title, .job-details-jobs-unified-top-card__job-title, .org-top-card, h1.org-top-card-summary__title`))
                            {
                                processNeeded = true;
                                break;
                            }
                        }
                    }
                }
                // Check 2: If attributes changed on relevant elements (like the 'active' class on list items)
                else if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                     if (mutation.target.nodeType === Node.ELEMENT_NODE &&
                         mutation.target.closest('li.scaffold-layout__list-item, .job-details-jobs-unified-top-card__container--two-pane, .jobs-details__main-content .job-details-jobs-unified-top-card, .org-top-card .ph5.pb5, .org-top-card-layout__card')) {
                         processNeeded = true;
                     }
                }
                if (processNeeded) break;
            }

            if (processNeeded) {
                // console.log("LinkedIn Job Flagger: Observer triggered debounced processing.");
                debounceProcessPageContent();
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
        setTimeout(processPageContent, 500); // Initial run
    }

    // --- Initialization Function ---
    function initializeFlagging() {
        console.log("LinkedIn Job Flagger: Initializing...");
        observeJobListChanges();
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage && !chrome.runtime.onMessage.hasListener(messageListener)) {
            chrome.runtime.onMessage.addListener(messageListener);
            console.log("LinkedIn Job Flagger: Message listener added.");
        } else if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) {
            console.warn("LinkedIn Job Flagger: chrome.runtime.onMessage not available. Cannot add listener.");
        } else {
             console.log("LinkedIn Job Flagger: Message listener already exists.");
        }
    }

    // --- Message Listener ---
    const messageListener = (request, sender, sendResponse) => {
        if (request.directive === "refreshFlags") {
            console.log("LinkedIn Job Flagger: Received refreshFlags message.");
            clearTimeout(debouncePageTimer); // Clear any pending debounce
            processPageContent(); // Process immediately
            sendResponse({ status: "Flags refreshed immediately" });
            return true; // Indicate async response
        }
        return false; // Indicate sync response or no response for other messages
    };

    // --- Final Execution Block ---
    if (typeof window.flaggingInitialized === 'undefined') {
        window.flaggingInitialized = true;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeFlagging);
        } else {
            initializeFlagging();
        }
    } else {
        console.log("LinkedIn Job Flagger: Already initialized, skipping re-initialization.");
        // Optional: Re-run processPageContent if re-initialization is skipped but might be needed
        // setTimeout(processPageContent, 100);
    }

} catch (e) { // ADDED CATCH
    console.error("!!! CRITICAL ERROR IN flagCompany.js GLOBAL SCOPE OR INITIALIZATION !!!", e);
}
