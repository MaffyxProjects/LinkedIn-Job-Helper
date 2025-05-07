# LinkedIn Job Helper

The LinkedIn Job Helper Chrome extension is designed to streamline your job search experience on LinkedIn. It allows you to hide jobs you've already seen or are not interested in, flag companies with custom notes, and quickly access relevant company information directly from LinkedIn pages.

## Installation (for local development/testing)

1.  Download the latest version of the extension (ZIP file) from the following link: [Download LinkedIn Job Helper 1.0.zip](https://foxhunt.s3.us-west-2.amazonaws.com/Chrome+Extensions/LinkedIn+Job+Helper/LinkedIn+Job+Helper+1.0.zip).
2.  Once downloaded, or if you have the extension files locally from a development folder, follow these steps:
    1.  Open Google Chrome.
    2.  Navigate to `chrome://extensions` in your address bar.
    3.  Enable "Developer mode" using the toggle switch, usually found in the top right corner.
    4.  Click the "Load unpacked" button.
    5.  Select the directory where you've placed the extension files (the folder containing `manifest.json`).
    6.  The extension should now be installed and active. You'll see its icon in your Chrome toolbar.

## Features

### Extension Popup

Click the LinkedIn Job Helper icon in your Chrome toolbar to open the popup.

#### Actions Tab:

![Hide Jobs Button in Popup](https://github.com/MaffyxProjects/LinkedIn-Job-Helper/blob/main/Screenshot%202025-05-07%20101423.png?raw=true)

*   **Hide Jobs on This Page:** When on a LinkedIn job search or collections page, this button attempts to click the "Dismiss" (X) button on all visible jobs. It will then try to navigate to the next page of results.

#### Help Tab:
![Help and Troubleshooting](https://github.com/MaffyxProjects/LinkedIn-Job-Helper/blob/main/Screenshot%202025-05-07%20101436.png?raw=true)

*   **Main Action Explanation:** Details about the "Hide Jobs on This Page" button.
*   **Company Flags Data Management:**
    *   **Clear All Flagged Companies:** Permanently removes all companies and notes you've flagged.
    *   **Export Flagged Companies:** Downloads a CSV file of your flagged companies, their flag type (red/yellow/green), and notes.
    *   **Import Flagged Companies:** Allows you to upload a CSV file (matching the export format) to add or update your flagged companies.
*   **Quick Info Buttons Explanation:** Describes the on-page "Company Info..." buttons.
*   **Flagging Companies Explanation:** Describes the on-page "Flag Company..." buttons.
*   **Troubleshooting Guide:** Common issues and solutions.

### On-Page Features (LinkedIn Website)

#### "Hide Jobs" Button (on Job Search/Collections Pages)

![Hide Jobs Button](https://github.com/MaffyxProjects/LinkedIn-Job-Helper/blob/main/Screenshot%202025-04-22%20151021.png?raw=true)

An additional "Hide Jobs" button is inserted near the pagination controls on LinkedIn job search and collections pages. Clicking this button performs the same action as the "Hide Jobs on This Page" button in the popup.

#### Flagging Companies & Quick Info Buttons ("Company Info...")

![Flag Company and Company Info Buttons on company page](https://github.com/MaffyxProjects/LinkedIn-Job-Helper/blob/main/Screenshot%202025-05-07%20095306.png?raw=true)

On LinkedIn job details pages and company profile pages, a "Flag Company..." button will appear.

![Flag Dropdown](https://github.com/MaffyxProjects/LinkedIn-Job-Helper/blob/main/Screenshot%202025-05-07%20095618.png?raw=true)

![Setting Flag Note](https://github.com/MaffyxProjects/LinkedIn-Job-Helper/blob/main/Screenshot%202025-05-07%20102627.png?raw=true)

![Note Set Confirmation](https://github.com/MaffyxProjects/LinkedIn-Job-Helper/blob/main/Screenshot%202025-05-07%20102636.png?raw=true)

![Note Example on page](https://github.com/MaffyxProjects/LinkedIn-Job-Helper/blob/main/Screenshot%202025-05-07%20102641.png?raw=true)

*   Click this button to open a dropdown menu.
*   Select a flag type:
    *   **Red 🚩:** For companies you want to avoid or have negative notes about.
    *   **Yellow ⚠️:** For companies you're neutral or cautious about.
    *   **Green ✅:** For companies you're positive about or want to pursue.
*   You'll be prompted to enter a note for the flag. Leaving the note blank and confirming will remove an existing flag or cancel adding a new one.
*   Once flagged:
    *   The corresponding symbol (🚩, ⚠️, ✅) will appear next to the company name in job listings.
    *   A colored box displaying your note will appear on the job details page and company profile page.
    *   The button text changes to "Flagged 🚩/⚠️/✅". Clicking it again allows you to edit the note, change the flag type, or remove the flag.

![Green Flag](https://github.com/MaffyxProjects/LinkedIn-Job-Helper/blob/main/Screenshot%202025-05-07%20095823.png?raw=true)

![Yellow Flag](https://github.com/MaffyxProjects/LinkedIn-Job-Helper/blob/main/Screenshot%202025-05-07%20095840.png?raw=true)

![Red Flag](https://github.com/MaffyxProjects/LinkedIn-Job-Helper/blob/main/Screenshot%202025-05-07%20095804.png?raw=true)

![Long Note Warning](https://github.com/MaffyxProjects/LinkedIn-Job-Helper/blob/main/Screenshot%202025-05-07%20100856.png?raw=true)


A "Company Info..." button appears on:

*   Job cards in the search results list.
*   Job details pages (in the top card actions).
*   Company profile pages (in the top card actions).

Clicking this button reveals a dropdown menu with quick links:

![Company Info Expanded](https://github.com/MaffyxProjects/LinkedIn-Job-Helper/blob/main/Screenshot%202025-05-07%20095633.png?raw=true)

*   **Glassdoor Search:** Opens a Google search for the company's Glassdoor reviews.
*   **Careers Page:** Opens a Google search for the company's careers/jobs page.
*   **Company News:** Opens a Google News search for the company.
*   **Search Layoffs:** Opens a Google search for recent news about layoffs at the company (past year).
*   **View All Jobs (LI):** Opens a LinkedIn job search filtered for that specific company.

## Troubleshooting

For common issues and solutions, please refer to the "Troubleshooting" section within the "Help" tab of the extension popup. Key things to check:

*   Ensure you are on a supported LinkedIn page (job search, collections, job details, or company page).
*   Try reloading the LinkedIn page.
*   Check the browser console (F12 > Console) for error messages, especially those prefixed with "[LinkedIn Job Hider]", "[LinkedIn Job Flagger]", or "[Company Info]".
*   If importing flags, ensure your CSV format is correct ("Company Name", "Flag Type", "Note").

---

&copy; LinkedIn Job Helper
