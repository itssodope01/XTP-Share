let uploadedFiles = [];
let encryptedFiles = []; 
let currentButton = '';
let userEnteredCode = '';
let transferButtonClicked = false;
let transferstarted = false;
let transferOpen = false;
let userEmails = [];
let userClouds = [];
let userAccounts = [];
let transferHistory = [];

const getElement = id => document.getElementById(id);

const attachmentContainer = document.querySelector('.attachment-container');
const attachment = document.querySelector('.attach-contain');
const editor = document.querySelector('#editor');
const attachmentToggle = document.querySelector('#attachment-container-toggle');
const attachmentText = document.querySelector('.attachment-text');
const selectedFilesContainer = getElement('selected-files-container');
const transferModal = getElement('transferModal');
const transferHistoryErrorDiv = document.querySelector(".transferHistoryError");
const transferHistoryTable = document.querySelector(".transfer-history-table");


// hamburger menu
$(document).ready(function() {
    $(function() {
        var hamburgerMenu = document.querySelector('.hamburger-menu');
        var headerButtons = document.querySelector('.header-buttons');

        hamburgerMenu.addEventListener('click', function() {
            headerButtons.classList.toggle('show');
            hamburgerMenu.classList.toggle('active'); 
        });

        document.addEventListener('click', function(event) {
            if (!headerButtons.contains(event.target) && !hamburgerMenu.contains(event.target)) {
                headerButtons.classList.remove('show');
                hamburgerMenu.classList.remove('active'); 
            }
        });
    });

    // Function to handle screen resize
    function handleResize() {
        var hamburgerMenu = document.querySelector('.hamburger-menu');
        var headerButtons = document.querySelector('.header-buttons');
        
        if (window.innerWidth > 750) {
            headerButtons.classList.remove('show');
            hamburgerMenu.classList.remove('active'); 
        } 
    }

    handleResize();
    window.addEventListener('resize', handleResize);
});


// Function to display temporary message in File-Drop-Box
let fileTextTimeout;
const fileDropText = document.querySelector('.file-drop-text');
const originalText = fileDropText.textContent;
function displayTemporaryMessage(message, green=false, time=1200) {
    clearTimeout(fileTextTimeout);
    clearTemporarymessage();
  
    fileDropText.textContent = message;
    fileDropText.classList.remove('file-drop-text');
    if(!green){
    fileDropText.classList.add('red-text');
    } else {
      fileDropText.classList.add('green-text');
    }
    fileTextTimeout=setTimeout(() => {
        clearTemporarymessage();
    }, time);
}

function clearTemporarymessage() {
    if (fileDropText.textContent !== originalText) {
        fileDropText.textContent = originalText;
    }
    if (!fileDropText.classList.contains('file-drop-text')) {
        fileDropText.classList.add('file-drop-text');
    }
    fileDropText.classList.remove('red-text', 'green-text');
}

// Function to transition sections
function transitionSections(currentSectionId, previousSectionId, isBackButton = false, atFlag = false) {
    if (skipVerificationSection && previousSectionId === 'S2' && currentSectionId === 'S1') {
        skipVerificationSection = false;
        if (currentButton === 'send-email-button') {
            transitionSections('S1', 'S2');
            transitionSections('S2', 'S4');
        } else if (currentButton === 'save-cloud-button') {
            transitionSections('S1', 'S2');
            transitionSections('S2', 'S3');
        }
        skipVerificationSection = true;
        return;
    }

    const currentSection = getElement(currentSectionId);
    const previousSection = getElement(previousSectionId);
    var backArrow = getElement("backArrow");
    if (currentSection && previousSection) {
        if (previousSection.id === 'S1') {
            ['.container', '.title', '.subtitle'].forEach(selector => document.querySelector(selector).classList.replace('S', 'transition'));          
        }



        if(currentSection.id === 'S1'){
            document.querySelectorAll('.container, .title, .subtitle').forEach(element => {
                element.classList.remove('transition');
                element.classList.add('S');
            });   
        }
        currentSection.classList.replace('active', isBackButton ? 'next' : 'prev');
        previousSection.classList.replace('prev', 'next');

        if (!isBackButton) {
            history.pushState({ sectionId: previousSectionId }, '');   
        }
        
        previousSection.classList.replace('next', 'active');
        flagenb = false;

        setTimeout(function() {
            if (previousSection.id !== 'S1' && !atFlag) {
                backArrow.style.opacity = "1";
                backArrow.style.cursor = "pointer";
            }
        }, 400);

        if (previousSection.id === 'S1') {
            backArrow.style.opacity = "0";
            backArrow.style.cursor = "";
        }


    }
}


//Back Arrow
const backArrow = document.querySelector('.back.arrow');
document.addEventListener('click', event => {
    if (event.target.classList.contains('back')) {
        document.querySelector('.button-container').style.marginLeft='20px';
        document.querySelector('#send-email-button').innerHTML = '<strong>Send Email</strong>';
        const currentSection = document.querySelector('.section.active');
        const currentSectionID = currentSection.id;
        var previousSectionID = currentSectionID === 'S4' || currentSectionID === 'S3' ? 'S2' : currentSection.previousElementSibling?.id;
        
    if((currentSectionID === 'S3' || currentSectionID === 'S4') && previousSectionID === 'S2')
    {
        transferButtonClicked = false;
        transitionSections(currentSectionID, 'S2', true, true);
        var attachmentsLink = document.querySelector('.attachments-link');
        transitionSections('S2' , 'S1', true, true);
        if ((currentSectionID === 'S4') && (attachmentsLink.textContent === 'Hide Attachments')) {
            attachmentsLink.click();
        } 
        return;
    }
        const previousSection = getElement(previousSectionID);

        if (previousSection) {
            transitionSections(currentSectionID, previousSectionID, true);
        }
    }
});

// Listen for the popstate event (triggered when the browser's back or forward buttons are clicked)
window.addEventListener('popstate', handleBrowserBackButton);

function handleBrowserBackButton() {
    const currentSection = document.querySelector('.section.active');
    const currentSectionID = currentSection.id;

        if (transferHistoryModal.style.display === 'block') {
        transferHistoryModal.style.left = "200%";
        setTimeout(() => {
        closeModal(transferHistoryModal);
        }, 1000); 
        history.pushState({ sectionId: S3 }, '');
        return;
        }

    if (currentSectionID === 'S1') {
        window.history.back();
        clearCodeFields();
        return;
    }

    if(!transferOpen) {
        closeAllModal();
        const backArrow = document.querySelector('.back.arrow');
        backArrow.click();
    }
}

// Function to handle browser forward button
function preventForwardNavigation() {
    history.pushState(null, null, document.URL);
    window.addEventListener('popstate', function () {
        history.pushState(null, null, document.URL);
    });
}

preventForwardNavigation();

window.addEventListener('pageshow', function(event) {
    // If the page is loaded from the bfcache (back-forward cache), reload it
    if (event.persisted) {
        window.location.reload();
    }
});

let codeflag = false;

function toggleCodeInfo() {
    const codeInfo = getElement('codeInfo');
    const device = whichDevice();
    const screenWidth = window.innerWidth;

    if ((device === "iOS" || device === "Android" || screenWidth < 950) && !codeflag) {
        codeInfo.style.zIndex = '3';
        if (screenWidth < 950) {
            const closeButton = getElement('closeButton');
            if (!closeButton) {
                codeInfo.innerHTML += '<button id="closeButton" onclick="toggleCodeInfo()">✖</button>';
            }
        }
        codeflag = true;
    } else if ((device === "iOS" || device === "Android" || screenWidth < 950) && codeflag) {
        codeInfo.style.zIndex = '1';
        codeflag = false;
        const closeButton = getElement('closeButton');
        if (closeButton) {
            closeButton.remove();
        }
    } else {
        codeInfo.style.left = codeflag ? "50%" : "calc(50% + 300px)";

        codeflag = !codeflag;
    }
}

$(document).on('dragover dragenter', function(e) {
    e.preventDefault();
    e.stopPropagation();
    e.originalEvent.dataTransfer.dropEffect = 'none';
});

$(document).on('dragleave drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
});


// Function to convert date and time
function formatDateAndTime(dateTimeStr) {
    const dateTime = new Date(dateTimeStr);
    
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const time = dateTime.toLocaleTimeString('en-US', timeOptions); // hh:mm
  
    const date = dateTime.toLocaleDateString('en-GB'); // dd/mm/yyyy
    return { date, time };
}


// Transfer History
function getTransferHistory(code) {
    if (transferHistory.length > 0) return;
    transferHistory = [];
    fetch(`https://xtpshareapimanagement.azure-api.net/api/transfer/GetHistoryByOTC?code=${encodeURIComponent(code)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            handleTransferHistoryFailure('Invalid response from server');
        }
        return response.json();
    })
    .then(data => {
        // Handle the response
        if (Array.isArray(data) && data.length > 0) {
            transferHistory = data.map(item => {
                const { date, time } = formatDateAndTime(item.transferStartTime);
                const platforms = item.authentications.length > 0 
                    ? item.authentications.map(auth => getPlatformName(auth.authType, auth.displayName)).join(', ')
                    : "Unknown";
                return {
                    id: `#${item.transferID}`,
                    date: date,
                    time: time,
                    platform: platforms,
                    status: item.transferState
                };
            });
            transferHistory = transferHistory.reverse();
            populateTable(transferHistory);
        } else {
            handleTransferHistoryFailure('No transfer history');
        }
    })
    .catch(error => {
        handleTransferHistoryFailure('An error occurred. Please try again later.');
    });
}

function getPlatformName(authType, displayName) {
    switch (authType) {
        case 0:
            return getCapitalizedDomain(displayName);
        case 1:
            return 'OneDrive';
        case 2:
            return 'GoogleDrive';
        default:
            return 'Unknown';
    }
}

function handleTransferHistoryFailure(message) {
    transferHistoryTable.style.visibility = 'hidden';
    transferHistoryErrorDiv.textContent = '';
    transferHistoryErrorDiv.textContent = `${message}`;
}