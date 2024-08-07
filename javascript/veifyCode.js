const verificationMessage = getElement('verificationMessage');
const codeInputs = document.querySelectorAll('.code-input');
const SectionS2 = document.querySelector('.S2');
const remainingTimeDisplay = document.getElementById('remainingTimeDisplay');
let displayName = '';

let _skipVerificationSection = false;
let lastActivityTime = Date.now(); //last activity time
let verificationTimer;
let verificationStartTime;
let pageReloadTimer;
let firstAttemptTimestamp;

let remainingTimeDisplayInterval;
let lastFilledInput = null;
let inputDone = false;

let incorrectAttempts = localStorage.getItem('incorrectAttempts') ? parseInt(localStorage.getItem('incorrectAttempts')) : 0;

function checkTimestampOnPageLoad() {
    const firstAttemptTimestamp = localStorage.getItem('firstAttemptTimestamp') ? parseInt(localStorage.getItem('firstAttemptTimestamp')) : null;
    if (firstAttemptTimestamp) {
      const currentTime = Date.now();
      const elapsedSinceFirstAttempt = currentTime - firstAttemptTimestamp;
      const remainingTime = 20000 - elapsedSinceFirstAttempt;
      updateTimeStamp(remainingTime);
    }
} checkTimestampOnPageLoad();
  

function handleUserActivity() {
    lastActivityTime = Date.now(); // Update last activity time
    clearInterval(remainingTimeDisplayInterval);
    remainingTimeDisplay.style.visibility = 'hidden';
    
}

// Event listeners to track user activity
['mousemove', 'keydown', 'scroll', 'click'].forEach(eventName => {
    document.addEventListener(eventName, handleUserActivity);
});

Object.defineProperty(window, 'skipVerificationSection', {
    get: function() {
        return _skipVerificationSection;
    },
    set: function(value) {
        _skipVerificationSection = value;
        setTimeout(switchUserLogo, 0);
    }
});

// Switch user logo function
function switchUserLogo() {
    if (_skipVerificationSection) {
        userAccount.style.display = 'block';
    } else {
        userAccount.style.display = 'none';
        userAccounts = [];
        userClouds = [];
    }
}

function verifyCode() {
    const verificationCode = [...document.querySelectorAll(".code-input")].map(input => input.value).join(""); // Verification Code from user
    userEnteredCode = verificationCode;

    if (verificationCode.length < 6 || verificationCode.trim() === "") {
        displayVerificationMessage('Please input a valid code', false);
        shake('.code-input-container');
        return;
    }

    if (incorrectAttempts < 5) {
        // Send the verification code to the server
        fetch(`https://xtpshareapimanagement.azure-api.net/api/auth/GetByOTC?code=${encodeURIComponent(verificationCode)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                handleFailure('Invalid response from server');
            }
            return response.json();
        })
        .then(data => {
            // Handle the response
            if (Array.isArray(data) && data.length > 0 && data[0].displayName) {
                displayName = data[0].displayName;
                data.forEach(auth => {
                    const authenticationType = auth.authType;
                    const authenticationID = auth.authID;
                    if (authenticationType === 0) {
                        addUniqueItem(userEmails, {account: auth.displayName, authID: authenticationID });
                        const domain = getCapitalizedDomain(auth.displayName);
                        addUniqueItem(userAccounts, {platform: domain, account: auth.displayName});
                    } else if (authenticationType === 1 || authenticationType === 2) {
                        addUniqueItem(userClouds, { account: auth.displayName, auth: authenticationType, authID: authenticationID });
                        const userPlatform = (authenticationType === 1) ? 'OneDrive' : 'GoogleDrive';
                        addUniqueItem(userAccounts, {platform: userPlatform, account: auth.displayName});
                    }
                });
                handleSuccess();
                return;
            } else {
                handleFailure('Invalid response from server');
            }
        })
        .catch(error => {
            handleFailure('An error occurred. Please try again later.');
            console.error(error);
        });
    } else if (incorrectAttempts >= 5) {
        // Handle 5 incorrect attempts scenario
        if (!localStorage.getItem('firstAttemptTimestamp')) {
            localStorage.setItem('firstAttemptTimestamp', Date.now());
        }
        const firstAttemptTimestamp = parseInt(localStorage.getItem('firstAttemptTimestamp'), 10);
        const currentTime = Date.now();
        const elapsedSinceFirstAttempt = currentTime - firstAttemptTimestamp;
        const remainingTime = 20000 - elapsedSinceFirstAttempt;
        updateTimeStamp(remainingTime);
        return;
    }
}

function handleSuccess() {
    clearTimeout(pageReloadTimer);
    verificationStartTime = Date.now();
    const displayNamep = document.querySelector('#displayName')
    displayNamep.textContent = `Hi, ${displayName}!`
    loadUserEmails();
    loadCloudAccounts();
    addCloudEventListners();
    if (currentButton === 'send-email-button') {
        transitionSections('S2', 'S4');
    } else if (currentButton === 'save-cloud-button') {
        transitionSections('S2', 'S3');
    }
    setTimeout(() => {
        clearCodeFields();
    }, 1000);

    // Skiping verification section for future transitions
    skipVerificationSection = true;
    startVerificationTimer();
    incorrectAttempts = 0;
    localStorage.removeItem('incorrectAttempts');
}

function handleFailure(message) {
    if (incorrectAttempts < 5){
        incorrectAttempts++; // Increment incorrect attempts
        localStorage.setItem('incorrectAttempts', incorrectAttempts); // Save incorrectAttempts to localStorage
        displayVerificationMessage('Incorrect Code', false);
        shake('.code-input-container');
    }  
}

function updateTimeStamp(remainingTime) {
    if (remainingTime <= 0) {
        // Reset incorrect attempts and firstAttemptTimestamp after 15 minutes (demo 20s)
        localStorage.removeItem('incorrectAttempts');
        localStorage.removeItem('firstAttemptTimestamp');
        incorrectAttempts = 0;
        displayVerificationMessage(``);
    } else {
        // Update remaining time
        const remainingMinutes = Math.floor(remainingTime / (60 * 1000));
        const remainingSeconds = Math.floor((remainingTime % (60 * 1000)) / 1000);
        displayVerificationMessage(`Too many incorrect attempts \nPlease try again in: ${remainingMinutes}m ${remainingSeconds}s`, false); 
    }
}

function shake(containerSelector) {
    const codeContainer = document.querySelector(containerSelector);
    if (!codeContainer) {
        console.error("Container not found:", containerSelector);
        return;
    }
    codeContainer.classList.add('shake');
    setTimeout(() => {
        codeContainer.classList.remove('shake');
    }, 400);
}

// Function to display verification message
function displayVerificationMessage(message, isSuccess) {
    verificationMessage.innerHTML = message.replace(/\n/g, "<br>");
    isSuccess ? verificationMessage.classList.add('success') : verificationMessage.classList.remove('success');
}

function startVerificationTimer() {

    clearTimeout(verificationTimer);
    verificationTimer = setTimeout(() => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - lastActivityTime;
        const remainingTime = (15 * 60 * 1000) - elapsedTime; // 15 min of inactivity (ask for reverification)

        if (remainingTime <= 0 ) { 
            dota();
            if (remainingTime>=-(60*60*1000)) {
            startPagereloadTimer(currentTime);
            } else { // has been inactive for more than 1 hr.
                window.location.reload();
            }
        } else {
            if(remainingTime<=(1.5 * 60 * 1000) && remainingTime >= 0 ) { //show remainig time on screen when 1 min 30s remain
            updateRemainingTimeDisplay(remainingTime); 
            } 
            startVerificationTimer();
        }
    }, 1000);
}

function updateRemainingTimeDisplay(remainingTime) {
    
    clearInterval(remainingTimeDisplayInterval);

    remainingTimeDisplayInterval = setInterval(() => {
        if (remainingTime <= 0) {
            clearInterval(remainingTimeDisplayInterval);
            return;
        } else { 
            const minutes = Math.floor(remainingTime / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);
            const remainingTimeString = `${minutes}m ${seconds}s`;
            remainingTimeDisplay.style.visibility='visible';
            remainingTimeDisplay.textContent = remainingTimeString;
            remainingTime -= 1000; 
        } 
    }, 1000);
}

function dota(){
    const currentSection = document.querySelector('.section.active');
    skipVerificationSection = false;
    clearCodeFields();
    remainingTimeDisplay.style.visibility='hidden';
    clearInterval(remainingTimeDisplayInterval);
    verificationMessage.textContent = 'Reverification Required';
    closeAllModal();
    if (currentSection.id === 'S3' || currentSection.id === 'S4') {
        transitionSections(currentSection.id, 'S2', true);
        currentButton = (currentSection.id === 'S3') ? 'save-cloud-button' : 'send-email-button';
    }
}

function startPagereloadTimer(Time) {
    clearTimeout(verificationTimer);
    clearTimeout(pageReloadTimer);

    pageReloadTimer = setTimeout (() => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - Time;
        const remainingTime = (10 * 60 * 1000) - elapsedTime; // user gets 10 mins to re-verify or page reloads

        if(remainingTime<=0 && !skipVerificationSection){
            window.location.reload();
        } else {
            startPagereloadTimer(Time);
        }
    }, 1000);
}

function clearCodeFields() {
    codeInputs.forEach(input => {
        input.value = '';
    });
    verificationMessage.classList.remove('success');
    verificationMessage.textContent = '';
}

['send-email-button', 'save-cloud-button'].forEach(id => {
    const button = getElement(id);
    button.addEventListener('click', () => {
        if (!filesUploaded()) {
            displayTemporaryMessage("Please upload files", false, 1200);
            return; 
        }             
        currentButton = id;
        transitionSections('S1', 'S2');
    });
});

// Event listeners to each input field to track changes
document.querySelectorAll('.code-input').forEach(input => {
    input.addEventListener('input', () => {
        lastFilledInput = input;
        inputDone = true; 
    });
});

SectionS2.addEventListener('transitionend', function(event) {
    if (event.target.classList.contains('S2') && event.target.classList.contains('active')) {
        if (inputDone) {
            focusOnNextInput();
        } else {
            focusOnFirstInput();
        }
    }
});

function focusOnFirstInput() {
    var firstInput = document.querySelector(".code-input");
    if (firstInput) {
        firstInput.focus();
    }
}

function focusOnNextInput() {
    if (lastFilledInput) {
        var nextInput = lastFilledInput.nextElementSibling;
        if (nextInput && nextInput.classList.contains('code-input')) {
            nextInput.focus();
        } else {
            var allInputsFilled = Array.from(document.querySelectorAll('.code-input')).every(input => input.value.trim() !== '');
            if (allInputsFilled) {
                lastFilledInput.focus();
            } else {
                focusOnFirstInput();
            }
        }
    } else {
        focusOnFirstInput(); 
    }
}

// Function to handle code input Logic
function handleCodeInput(event) {
    const input = event.target;
    const maxLength = parseInt(input.getAttribute('maxlength'));
    const currentLength = input.value.length;
    const isBackspace = event.code === "Backspace";
    const isArrowRight = event.code === "ArrowRight";
    const isArrowLeft = event.code === "ArrowLeft";

    const isNonNumeric = /\D/.test(input.value);
    if (isNonNumeric) {
        shake('.code-input-container');
        input.value = input.value.replace(/\D/g, '');
    }
    
    if (isBackspace) {
        const isFirstInput = input.selectionStart === 0 && input.selectionEnd === input.value.length && input.previousElementSibling;
        const isSelectionAtStart = input.selectionStart === input.selectionEnd && input.selectionStart > 0;

        if (isFirstInput) {
            const previousInput = input.previousElementSibling;
            previousInput.focus();
            previousInput.value = '';
            lastFilledInput = previousInput.previousElementSibling;
        } else if (isSelectionAtStart) {
            input.setRangeText('', input.selectionStart - 1, input.selectionStart, 'end');
        }
    }

    if (isArrowRight && input.selectionEnd === input.value.length && input.nextElementSibling) {
        input.nextElementSibling.focus();
    } else if (isArrowLeft) {
        event.preventDefault();
        const previousInput = input.previousElementSibling;
        if (previousInput) {
            previousInput.focus();
        }
    } else if (event.code === "ArrowUp" || event.code === "ArrowDown") {
        event.preventDefault();
    }

    if (!isArrowLeft && currentLength >= maxLength && input.nextElementSibling && /^\d+$/.test(input.value)) {
        input.nextElementSibling.focus();
    }

    if (event.key === "Enter") {
        event.preventDefault();
        verifyCode();
    }

    // --Auto-verify on first attempt
    const allInputsFilled = Array.from(codeInputs).every(input => input.value.trim().length === (maxLength));
    if (allInputsFilled && incorrectAttempts === 0) {
            verifyCode();
    }

    if (allInputsFilled)
    checkTimestampOnPageLoad();
}


codeInputs.forEach(function(input) {
    input.addEventListener('input', function(event) {
        if (!SectionS2.classList.contains('active')) {
            event.preventDefault();
            return;
        }
        handleCodeInput(event);
    });
    input.addEventListener('keydown', function(event) {
        if (!SectionS2.classList.contains('active')) {
            event.preventDefault();
            return;
        }
        handleCodeInput(event);
    });
});


document.getElementById('verifyCodeButton').addEventListener('click', () => {
    verifyCode();
});

// Accounts for if the user accidentally de-focuses the input fields
document.addEventListener('keydown', function(event) {
    if (!SectionS2.classList.contains('active')) {
        return;
    }
    const focusedInput = document.querySelector('.code-input:focus');
    
    if (!focusedInput && (!isNaN(parseInt(event.key)))) {
        event.preventDefault();

        const emptyInput = Array.from(codeInputs).find(input => input.value.trim() === '');

        if (!isNaN(parseInt(event.key)) && emptyInput) {
            emptyInput.value = event.key;
            emptyInput.dispatchEvent(new Event('input'));
        } 
    }
});


// Function to extract and capitalize domain name without TLD
function getCapitalizedDomain(displayName) {
    const emailParts = displayName.split('@');
    if (emailParts.length === 2) {
      const domain = emailParts[1];
      const mainDomain = domain.split('.')[0];
      return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
    }
    return null;
}
