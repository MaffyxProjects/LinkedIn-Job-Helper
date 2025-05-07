// --- Storage Key ---
const COMPANY_FLAGS_KEY = 'companyFlags'; // Single key for all flags

// --- CSV Handling ---

// Helper function to escape CSV fields (no changes needed)
function escapeCsvField(field) {
    if (field === null || field === undefined) { return ''; }
    let stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        stringField = stringField.replace(/"/g, '""');
        return `"${stringField}"`;
    }
    return stringField;
}

// Basic CSV parser - Expects "Company Name", "Flag Type", "Note"
// Returns array of objects: [{ "Company Name": "...", "Flag Type": "red|green|yellow", "Note": "..." }, ...]
function parseCsv(csvContent) {
    const lines = csvContent.replace(/\r\n/g, '\n').split('\n');
    const result = [];
    const headers = ["Company Name", "Flag Type", "Note"]; // Expected headers

    if (!lines[0] || !lines[0].trim().startsWith(headers[0])) {
        console.error("CSV header mismatch or missing. Expected:", headers.join(','));
        throw new Error(`CSV file must start with header row: ${headers.join(',')}`);
    }

    for (let i = 1; i < lines.length; i++) { // Start from 1 to skip header
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const values = [];
        let currentVal = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                if (inQuotes && line[j + 1] === '"') {
                    currentVal += '"'; j++;
                } else { inQuotes = !inQuotes; }
            } else if (char === ',' && !inQuotes) {
                values.push(currentVal.trim()); currentVal = '';
            } else { currentVal += char; }
        }
        values.push(currentVal.trim()); // Add the last value

        if (values.length >= headers.length) { // Allow extra columns, ignore them
            const obj = {};
            obj[headers[0]] = values[0]; // Company Name
            obj[headers[1]] = values[1]?.toLowerCase(); // Flag Type (lowercase)
            obj[headers[2]] = values[2]; // Note
            result.push(obj);
        } else {
            console.warn(`Skipping malformed CSV line ${i + 1}: Expected at least ${headers.length} fields, found ${values.length}`, line);
        }
    }
    return result;
}


// --- Export Logic ---

// Function to trigger the CSV download with timestamp (no changes needed)
function downloadCsv(csvContent) {
    const date = new Date();
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const filename = `flagged_companies_${dateString}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Function to handle the export process (uses single flag key)
async function exportFlaggedCompanies() {
    console.log("Export Flags button clicked.");
    try {
        const result = await chrome.storage.local.get([COMPANY_FLAGS_KEY]);
        const allFlags = result[COMPANY_FLAGS_KEY] || {};
        const companyNames = Object.keys(allFlags);

        if (companyNames.length === 0) {
            alert("No flagged companies found to export.");
            return;
        }

        console.log(`Found ${companyNames.length} companies with flags to export.`);

        // Prepare CSV content with new 3-column header
        let csvContent = "Company Name,Flag Type,Note\n"; // Header row

        companyNames.forEach(companyName => {
            const flagData = allFlags[companyName];
            const flagType = flagData?.type || ""; // red, green, yellow, or empty
            const note = flagData?.note || "";
            csvContent += `${escapeCsvField(companyName)},${escapeCsvField(flagType)},${escapeCsvField(note)}\n`;
        });

        downloadCsv(csvContent);
        alert("Export started. Check your downloads folder.");

    } catch (error) {
        console.error("Error during export:", error);
        alert("Error exporting flags. Check browser console.");
    }
}

// --- Import Logic ---

// Function to handle file selection and processing (uses single flag key)
async function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) { console.log("No file selected for import."); return; }
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
        alert("Please select a valid CSV file (.csv).");
        event.target.value = null; return;
    }

    console.log(`Importing file: ${file.name}`);
    const reader = new FileReader();

    reader.onload = async function(e) {
        const csvContent = e.target.result;
        try {
            const importedData = parseCsv(csvContent); // Expects 3 columns now
            if (importedData.length === 0) {
                alert("CSV file appears empty or could not be parsed correctly (check header: Company Name,Flag Type,Note).");
                return;
            }
            console.log(`Parsed ${importedData.length} rows from CSV.`);

            // Get current flags to merge
            const result = await chrome.storage.local.get([COMPANY_FLAGS_KEY]);
            const currentFlags = result[COMPANY_FLAGS_KEY] || {};

            let addedCount = 0, updatedCount = 0, removedCount = 0;

            // Merge strategy:
            // - If Type is 'red', 'green', or 'yellow' and Note exists -> Add/Update flag
            // - If Type or Note is empty/invalid -> Remove existing flag for that company
            importedData.forEach(item => {
                const companyName = item["Company Name"];
                const flagType = item["Flag Type"]; // Already lowercased by parser
                const note = item["Note"];

                if (companyName) {
                    // *** UPDATED: Accept 'yellow' as valid type ***
                    const isValidType = flagType === 'red' || flagType === 'green' || flagType === 'yellow';
                    const hasNote = note !== undefined && note !== null && note.trim() !== '';

                    if (isValidType && hasNote) { // Add or Update
                        if (currentFlags.hasOwnProperty(companyName)) { updatedCount++; }
                        else { addedCount++; }
                        currentFlags[companyName] = { type: flagType, note: note };
                    } else { // Remove if type/note invalid or empty
                        if (currentFlags.hasOwnProperty(companyName)) {
                            console.log(`Removing flag for "${companyName}" due to empty/invalid type or note in import.`);
                            delete currentFlags[companyName];
                            removedCount++;
                        }
                        // If it didn't exist anyway, do nothing
                    }
                } else {
                    console.warn("Skipping row with empty company name during import.");
                }
            });

            // Save merged data
            await chrome.storage.local.set({ [COMPANY_FLAGS_KEY]: currentFlags });

            console.log(`Import successful: Added: ${addedCount}, Updated: ${updatedCount}, Removed: ${removedCount}`);
            alert(`Import successful!\nAdded: ${addedCount}\nUpdated: ${updatedCount}\nRemoved: ${removedCount}\n\nRefreshing job page view...`);
            triggerContentScriptRefresh();

            // Refresh dashboard if visible
            if (document.getElementById('dashboardContent') && document.getElementById('dashboardContent').classList.contains('active')) {
                loadDashboardData();
            }
        } catch (parseError) {
            console.error("Error processing CSV file:", parseError);
            alert(`Error processing CSV file. Please ensure it's correctly formatted (Header: Company Name,Flag Type,Note).\nError: ${parseError.message}`);
        } finally {
             event.target.value = null; // Reset file input
        }
    };
    reader.onerror = function(e) {
        console.error("Error reading file:", e);
        alert("Error reading the selected file.");
        event.target.value = null;
    };

    reader.readAsText(file);
}

// Helper to trigger content script refresh for all relevant scripts
function triggerContentScriptRefresh() {
     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
         if (tabs[0] && tabs[0].id && tabs[0].url && (tabs[0].url.includes("linkedin.com/jobs/") || tabs[0].url.includes("linkedin.com/company/"))) {
             const directives = ["refreshFlags", "refreshQuickInfoButtons"]; // Removed "refreshJobTracking"
             directives.forEach(directive => {
                 chrome.tabs.sendMessage(tabs[0].id, { directive }, function(response) {
                     if (chrome.runtime.lastError) {
                         console.warn(`Could not send ${directive} message:`, chrome.runtime.lastError.message);
                     } else {
                         console.log(`Sent ${directive} message. Response:`, response);
                     }
                 });
             });
         } else {
             console.log("Not on an active LinkedIn jobs page; refresh messages not sent.");
         }
      });
}

function escapeHtml(unsafe) {
    if (unsafe === null || typeof unsafe === 'undefined') return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            const tabId = button.dataset.tab + "Content";
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('buttonHide').addEventListener('click', hideJobs );
  setupTabs();

  // Listener for the Clear Flags button
  const clearFlagsButton = document.getElementById('clearFlags');
  if (clearFlagsButton) {
      clearFlagsButton.addEventListener('click', function() {
          // Confirmation message remains the same, action uses single key
          if (confirm('Are you sure you want to clear ALL flagged companies and their notes? This cannot be undone.')) {
              chrome.storage.local.remove(COMPANY_FLAGS_KEY, function() { // Use single key
                  if (chrome.runtime.lastError) {
                      console.error("Error clearing flags:", chrome.runtime.lastError);
                      alert('Error clearing flags. Check browser console.');
                  } else {
                      console.log('All company flags cleared from storage.');
                      alert('All flagged companies have been cleared!');
                      triggerContentScriptRefresh();
                      // No dashboard to refresh
                  }
              });
          }
      });
  } else {
      console.error("Clear Flags button not found in popup HTML.");
  }

  // Listener for the Export Flags button
  const exportFlagsButton = document.getElementById('exportFlags');
  if (exportFlagsButton) {
      exportFlagsButton.addEventListener('click', exportFlaggedCompanies);
  } else {
      console.error("Export Flags button not found in popup HTML.");
  }

  // Listener for the Import Flags button
  const importFlagsButton = document.getElementById('importFlags');
  const importFileInput = document.getElementById('importFile');

  if (importFlagsButton && importFileInput) {
      importFlagsButton.addEventListener('click', function() {
          importFileInput.click();
      });
      importFileInput.addEventListener('change', handleImportFile);
  } else {
      console.error("Import Flags button or file input not found in popup HTML.");
  }

  // Listener for the Open Documentation button in Actions tab
  const openDocButton = document.getElementById('openDocumentation');
  if (openDocButton) {
    openDocButton.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('documentation.html') });
    });
  }
  // Listener for the Open Documentation link in Help tab
  const openDocLinkHelp = document.getElementById('openDocumentationLinkHelp');
  if (openDocLinkHelp) {
    openDocLinkHelp.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default link behavior
        chrome.tabs.create({ url: chrome.runtime.getURL('documentation.html') });
    });
  }
});//End loaded listener

//sends message to run the hide jobs script. (no changes needed)
function hideJobs() {
  console.log("Popup sending hideJobs message...");
  chrome.runtime.sendMessage({directive: "hideJobs"}, function(response) {
      if (chrome.runtime.lastError) {
          console.error("Error sending hideJobs message:", chrome.runtime.lastError.message);
      } else {
          console.log("hideJobs message sent, response:", response);
      }
  });
  window.close();
}
