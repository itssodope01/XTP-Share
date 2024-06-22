const userAccount = document.getElementById('userAccount');
const userDropdownMenu = document.getElementById('userDropdownMenu');
const arrowUp = document.getElementById('arrowUp');
const darkToggle = document.querySelector(".toggle-container");
const logOut = document.querySelector("#logoutLink");
const transferHistoryLink = document.getElementById('transferHistoryLink');
const transferHistoryModal = document.getElementById('transferHistoryModal');
const closeHistoryModal = document.getElementById('history-close');
const historyTable = document.querySelector("#transferHistoryModal .modal-content");
let searchOn = false;

// Event listeners
userAccount.addEventListener('click', toggleDropdown);
logOut.addEventListener('click', logoutUser);
transferHistoryLink.addEventListener('click', openTransferHistoryModal);
closeHistoryModal.addEventListener('click', closeTransferHistoryModal);

window.addEventListener('click', closeDropdownOnClickOutside);
window.addEventListener('resize', handleWindowResize);

// Elements for filtering
const searchBar = document.getElementById("search-bar");
const filterWindow = document.querySelector('#filter-window');
const filterBy = document.getElementById("filter-by");
const filterApply = document.getElementById('apply-filter');
const platformFilters = document.querySelectorAll('.platform-filter');
const statusFilters = document.querySelectorAll('.status-filter');
const fromDateInput = document.getElementById('from-date');
const toDateInput = document.getElementById('to-date');

// Search bar events
searchBar.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        searchData();
    }
});

searchBar.addEventListener("input", function(event) {
    if (searchBar.value.length === 0) {
        resetSearch();
    }
});

// Filter events
filterBy.addEventListener('click', toggleFilterWindow);

filterApply.addEventListener('click', applyFilters);

document.addEventListener('click', closeFilterWindowOnClickOutside);

// Function definitions
function toggleDropdown() {
    userDropdownMenu.style.display = userDropdownMenu.style.display === 'block' ? 'none' : 'block';
    if (userDropdownMenu.style.display === 'block') {
        positionDropdown();
    }
}

function positionDropdown() {
    const userAccountRect = userAccount.getBoundingClientRect();
    const arrowOffset = 65;
    userDropdownMenu.style.top = `${userAccountRect.bottom + window.scrollY + 15}px`;
    userDropdownMenu.style.left = `${userAccountRect.left + window.scrollX - userDropdownMenu.offsetWidth / 2 + userAccountRect.width / 2 - arrowOffset}px`;
}

function logoutUser() {
    skipVerificationSection = false;
    userDropdownMenu.style.display = 'none';
    clearAllFiles();
    const currentSection = document.querySelector('.section.active');
    if (currentSection && (currentSection.id === 'S3' || currentSection.id === 'S4')) {
        transitionSections(currentSection.id, 'S2', true);
        transitionSections('S2', 'S1', true);
    }
    setTimeout(() => window.location.reload(), 350);
}

function openTransferHistoryModal(e) {
    e.preventDefault();
    getTransferHistory(userEnteredCode);
    setTimeout( ()=> {
        populateTable(transferHistory);
        userDropdownMenu.style.display = 'none';
        showModal(transferHistoryModal);
        setTimeout(() => {
            transferHistoryModal.style.left = "50%";
        }, 50);
    }, 80);
}

function closeTransferHistoryModal() {
    transferHistoryModal.style.left = "200%";
    setTimeout(() => {
        closeModal(transferHistoryModal);
    }, 1000);
}

function closeDropdownOnClickOutside(e) {
    if (!userAccount.contains(e.target) && !userDropdownMenu.contains(e.target) && !darkToggle.contains(e.target)) {
        userDropdownMenu.style.display = 'none';
    }
}

function handleWindowResize() {
    if (userDropdownMenu.style.display === 'block') {
        positionDropdown();
    }
    if (window.innerWidth < 950) {
        historyTable.style.width = '100%';
    } else if (filterWindow.style.visibility === 'visible') {
        historyTable.style.width = '70%';
    }
}

function searchData() {
    searchOn = true;
    const searchTerm = searchBar.value.toLowerCase();
    let filteredData = transferHistory.slice(); // Copy original data

    if (searchTerm) {
        filteredData = filteredData.filter((transfer) => {
            const transferText =
                transfer.id.toLowerCase() +
                transfer.date.toLowerCase() +
                transfer.platform.toLowerCase() +
                transfer.status.toLowerCase();
            return transferText.includes(searchTerm);
        });
    }
    clearFilters();
    populateTable(filteredData);
}

function resetSearch() {
    if (searchOn) {
        populateTable(transferHistory);
    }
}

function toggleFilterWindow() {
    if (filterWindow.style.visibility === 'visible') {
        hideFilterWindow();
        return;
    }
    filterWindow.style.visibility = 'visible';
    filterWindow.style.width = '30%';
    filterWindow.style.height = 'auto';
    filterWindow.style.minWidth = '250px';
    if (window.innerWidth > 950) {
        historyTable.style.width = '70%';
    }
}

function hideFilterWindow() {
    filterWindow.style.visibility = 'hidden';
    filterWindow.style.width = '0';
    filterWindow.style.height = '0';
    historyTable.style.width = '100%';
}

function closeFilterWindowOnClickOutside(event) {
    const isDescendantOfFilterWindow = filterWindow.contains(event.target);
    if (!filterBy.contains(event.target) && !isDescendantOfFilterWindow && !darkToggle.contains(event.target) && window.innerWidth < 950) {
        hideFilterWindow();
    }
}

function applyFilters() {
    const platforms = Array.from(platformFilters).filter(cb => cb.checked).map(cb => cb.value);
    const statuses = Array.from(statusFilters)
    .filter(cb => cb.checked)
    .map(cb => (cb.value === "InProgress" ? "In Progress" : cb.value));
    const fromDate = fromDateInput.value;
    const toDate = toDateInput.value;

    if (window.innerWidth < 950) {
        hideFilterWindow();
    }
    filterTransferHistory(platforms, statuses, fromDate, toDate);
}

function filterTransferHistory(platforms, statuses, fromDate, toDate) {
    let filteredData = transferHistory.slice(); // Copy original data

    if (platforms.length > 0) {
        filteredData = filteredData.filter(transfer => platforms.includes(transfer.platform));
    }

    if (statuses.length > 0) {
        filteredData = filteredData.filter(transfer => statuses.includes(transfer.status));
    }

    if (fromDate) {
        filteredData = filteredData.filter(transfer => {
            const transferDate = new Date(transfer.date.split('/').reverse().join('-'));
            return transferDate >= new Date(fromDate);
        });
    }

    if (toDate) {
        filteredData = filteredData.filter(transfer => {
            const transferDate = new Date(transfer.date.split('/').reverse().join('-'));
            return transferDate <= new Date(toDate);
        });
    }
    searchOn = false;
    searchBar.value = '';
    if (filteredData) {
    populateTable(filteredData);
    } else if (filteredData.length < 1){
        handleTransferHistoryFailure("No Matching Records Found.")
    }
}

function clearFilters() {
    // Clear all platform checkboxes
    platformFilters.forEach(cb => cb.checked = false);

    // Clear all status checkboxes
    statusFilters.forEach(cb => cb.checked = false);

    // Reset date inputs
    fromDateInput.value = '';
    toDateInput.value = '';
}

// Function to populate the transfer history table
function populateTable(data) {
    const tableBody = document.querySelector(".transfer-history-actual");
    tableBody.innerHTML = ""; // Clear existing content

    for (const transfer of data) {
        const tableRow = `
            <tr>
                <td>${transfer.id}</td>
                <td>${transfer.date}<br>${transfer.time}</td>
                <td>${transfer.platform}</td>
                <td>${transfer.status}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", tableRow);
    }
}

// Event listener for clear filters button
document.getElementById('clear-filters').addEventListener('click', () => {
    clearFilters();
    populateTable(transferHistory);
    searchBar.value = '';
});

const connectedAccountsContainer = document.getElementById('connectedAccountsContainer');
const connectedAccountsList = document.getElementById('connectedAccountsList');


// Show connected accounts
function showUserAccounts() {
    connectedAccountsContainer.classList.toggle('open');
    if (connectedAccountsContainer.classList.contains('open')) {
        populateConnectedAccounts(); // Populate the connected accounts dynamically
    }
}


function populateConnectedAccounts() {

    let html = '';

    userAccounts.forEach(({ platform, account }) => {
        const platformData = platforms.find(p => p.name == platform);
        console.log(platform);
        console.log(platformData);
        if (!platformData) return;

        html += `
            <a class="connected-account" style="--hover-color: ${platformData.hover_color}">
                <div class="icon-container">
                    <img src="${baseURL}${platformData.src}" alt="${platformData.name} Logo">
                </div>
                <span class="account-data">
                    <span>${account}</span>
                    <span class="platformName">${platformData.name}</span>
                </span>
            </a>
        `;
    });

    connectedAccountsList.innerHTML = html;
    connectedAccountsList.onclick = () => {
        connectedAccountsContainer.classList.add('open');
    };
}
