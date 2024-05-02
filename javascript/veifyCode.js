const verificationMessage = getElement('verificationMessage');
const pseudoCorrectCode = 555555; // Pseudo Correct Code
const codeInputs = document.querySelectorAll('.code-input');
const SectionS2 = document.querySelector('.S2');
const remainingTimeDisplay = document.getElementById('remainingTimeDisplay');

let skipVerificationSection = false;
let lastActivityTime = Date.now(); //last activity time
let verificationTimer;
let verificationStartTime;
let pageReloadTimer;
let firstAttemptTimestamp;

let remainingTimeDisplayInterval;
let lastFilledInput = null;
let inputDone = false;
let flagenb = false;

localStorage.removeItem('incorrectAttempts');
localStorage.removeItem('firstIncorrectTime');

// Retrieve incorrectAttempts from localStorage if exists, otherwise set it to 0 (localstorage is for demo)
// Needs actual User Information from App
let incorrectAttempts = localStorage.getItem('incorrectAttempts') ? parseInt(localStorage.getItem('incorrectAttempts')) : 0;
let firstIncorrectTime = localStorage.getItem('firstIncorrectTime') ? parseInt(localStorage.getItem('firstIncorrectTime')) : null;

function handleUserActivity() {
    lastActivityTime = Date.now(); // Update last activity time
    clearInterval(remainingTimeDisplayInterval);
    remainingTimeDisplay.style.visibility = 'hidden';
}

// Event listeners to track user activity
['mousemove', 'keydown', 'scroll', 'click'].forEach(eventName => {
    document.addEventListener(eventName, handleUserActivity);
});

function verifyCode(Code) {
    Code = Code.toString();
    const verificationCode = [...document.querySelectorAll(".code-input")].map(input => input.value).join(""); // Verification Code from user
    if(incorrectAttempts < 5){
        if (verificationCode.length < 6 || verificationCode.trim() === "") {
            displayVerificationMessage('Please input a valid code', false);
            shake('.code-input-container');
            return;
        } else {
            if (verificationCode === Code && incorrectAttempts < 5) {
                clearTimeout(pageReloadTimer);
                verificationStartTime = Date.now();
                if (currentButton === 'send-email-button') {
                    transitionSections('S2', 'S4');
                } else if (currentButton === 'save-cloud-button') {
                    transitionSections('S2', 'S3');
                    if(transferOpen) {
                        setTimeout(() => {
                        showModal(transferModal);
                    }, 400);
                    }
                }
                setTimeout(() => {
                    clearCodeFields();
                }, 1000);
                flagenb = false;

                // Skiping verification section for future transitions
                skipVerificationSection = true;
                startVerificationTimer();
            } else {
                incorrectAttempts++; // Increment incorrect attempts
                localStorage.setItem('incorrectAttempts', incorrectAttempts); // Save incorrectAttempts to localStorage
                displayVerificationMessage('Incorrect verification code', false);
                shake('.code-input-container');
            }
        }
    } else if (incorrectAttempts >= 5) { // 5 incorrect attempts reached
        if (!localStorage.getItem('firstAttemptTimestamp')) {
            // Record the timestamp of the first time 5 incorrect attempts threshold is exceeded
            localStorage.setItem('firstAttemptTimestamp', Date.now());
        }
        firstAttemptTimestamp = parseInt(localStorage.getItem('firstAttemptTimestamp'));
        const currentTime = Date.now();
        const elapsedSinceFirstAttempt = currentTime - firstAttemptTimestamp;
        const remainingTime = (20000) - elapsedSinceFirstAttempt;

        if (remainingTime <= 0) {
            // Reset incorrect attempts and firstAttemptTimestamp after 15 minutes
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
        return; 
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
        if (id === 'save-cloud-button' && !filesUploaded()) {
            // For save cloud button, check if files are uploaded
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
            flagenb = false;
        } else if (isSelectionAtStart) {
            input.setRangeText('', input.selectionStart - 1, input.selectionStart, 'end');
            flagenb = false;
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
        verifyCode(pseudoCorrectCode);
    }

    const allInputsFilled = Array.from(codeInputs).every(input => input.value.trim().length === maxLength);
    const isValidInput = event.code !== "ArrowLeft" && event.code !== "ArrowRight" && event.code !== "Backspace";
    if (allInputsFilled && isValidInput) {
        if (!flagenb) {
            verifyCode(pseudoCorrectCode);
            flagenb = true;
        } else if (/^\d$/.test(event.key)) {
            verifyCode(pseudoCorrectCode);
        }
    }
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
    verifyCode(pseudoCorrectCode);
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