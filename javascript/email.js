// Array of available email addresses
const availableEmails = ["tron-galaxy@gmail.com", "hover-board@outlook.com", "xandar-east@gmail.com"]; // Email accounts user has linked with the app

// Initializing Quill editor
const quill = new Quill('#editor', { theme: 'snow', modules: { toolbar: '#toolbar' } });

const Placeholder = document.getElementById("editorPlaceholder");

// Handling focus and blur events
quill.root.addEventListener('focus', () => {
    Placeholder.style.display = 'none';
});

quill.root.addEventListener('blur', () => {
    if (!quill.root.textContent.trim()) {
        Placeholder.style.display = 'block';
    }
});

// Gmail-outlook combined restricted files
const restrictedFileTypes = [
    'ade', 'adp', 'apk', 'appx', 'appxbundle', 'bat', 'cab', 'chm', 'cmd', 'com', 'cpl', 'diagcab', 'diagcfg',
    'diagpack', 'dll', 'dmg', 'ex', 'ex_', 'exe', 'hta', 'img', 'ins', 'iso', 'isp', 'jar', 'jnlp', 'js', 'jse',
    'lib', 'lnk', 'mde', 'mjs', 'msc', 'msi', 'msix', 'msixbundle', 'msp', 'mst', 'nsh', 'pif', 'ps1', 'scr',
    'sct', 'shb', 'sys', 'vb', 'vbe', 'vbs', 'vhd', 'vxd', 'wsc', 'wsf', 'wsh', 'xll', 'app', 'application',
    'appref-ms', 'bas', 'bgi', 'cer', 'csh', 'der', 'fxp', 'gadget', 'grp', 'hlp', 'hpj', 'htc', 'inf', 'its',
    'mad', 'maf', 'mag', 'mam', 'maq', 'mar', 'mas', 'mat', 'mau', 'mav', 'maw', 'mcf', 'mda', 'mdb', 'mdt',
    'mdw', 'mdz', 'msc', 'msh', 'msh1', 'msh2', 'mshxml', 'msh1xml', 'msh2xml', 'msu', 'ops', 'osd', 'pcd',
    'plg', 'prf', 'prg', 'printerexport', 'pst', 'pyc', 'pyo', 'pyw', 'pyz', 'pyzw', 'reg', 'scf', 'sct',
    'shs', 'theme', 'vbp', 'vsmacros', 'vsw', 'webpnp', 'website', 'ws', 'xbap'
];

// File size limits for different email domains
const sizeLimits = {
    // 25MB
    'gmail': 25 * 1024 * 1024,
    'yahoo': 25 * 1024 * 1024,
    'icloud': 25 * 1024 * 1024,
    'me': 25 * 1024 * 1024,
    'aol': 25 * 1024 * 1024,
    'mail': 25 * 1024 * 1024,
    // 20MB
    'outlook': 20 * 1024 * 1024,
    'hotmail': 20 * 1024 * 1024,
    'live': 20 * 1024 * 1024,
    'msn': 20 * 1024 * 1024
};

// Default size limit
const defaultSizeLimit = 10 * 1024 * 1024; // 10MB

// Function to calculate total file size of attachments
async function calculateTotalFileSize() {
    return uploadedFiles.reduce((totalSize, file) => totalSize + file.size, 0);
}

function isValidEmail(email) {
    return /^[a-zA-Z0-9._%+-]+@(?!.*(\.[^\s@]+)\1)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

//Zip-File Extract
async function extractZipFiles(file) {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onload = function (event) {
            const arrayBuffer = event.target.result;
            const zip = new JSZip();

            zip.loadAsync(arrayBuffer).then(function (zip) {
                const fileList = [];
                zip.forEach(function (_, zipEntry) {
                    if (!zipEntry.dir) {
                        fileList.push(zipEntry.name.split('/').pop());
                    }
                });
                resolve(fileList);
            }).catch(function (error) {
                reject(error);
            });
        };

        reader.onerror = function (event) {
            reject(event.target.error);
        };

        reader.readAsArrayBuffer(file);
    });
}

// Function to Check for restricted file types including files inside a zip
const hasRestrictedFiles = async (uploadedFiles) => {
     for (const file of uploadedFiles) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
            if (fileExtension === 'zip') {
                try {
                    const fileList = await extractZipFiles(file);
                    for (const fileName of fileList) {
                        const innerFileExtension = fileName.split('.').pop().toLowerCase();
                        if (restrictedFileTypes.includes(innerFileExtension)) {
                            return true; // Found a restricted file inside the zip
                          }
                        }
                    } catch (error) {
                        console.error("Error extracting zip file:", error);
                        return true; 
                    }
                } else if (restrictedFileTypes.includes(fileExtension)) {
                    return true; // Found a restricted file
            }
        }
     return false;
};

//Maximum Subject Length
function isSubjectValid(subject, email) {
    const emailDomain = email.split('@')[1]?.split('.')[0];
    const maxSubjectLength = {
        'gmail': 78,
        'outlook': 255,
        'yahoo': 100,
        'icloud': 64,
        'me': 100,
        'aol': 64,
        'mail': 256,
        'hotmail': 104,
        'live': 104,
        'msn': 104
    };    
    

    if (subject.length > (maxSubjectLength[emailDomain] || 60)) {
        return false;
    }
    return true;
}


let sendButtonClicked = false;
let sentEmails = []; // Email Array
let timer;

$(document).ready(function () {
    const overlay = document.getElementById("overlay");
    const toField = document.querySelector('input[name="to"]');
    const toLabel = document.getElementById('to');
    const subjectField = document.querySelector('input[name="subject"]');
    const subjectLabel = document.getElementById('subject');

    toField.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ';' || event.key === ',') {
            event.preventDefault();
            const currentValue = toField.value.trim();
            if (currentValue !== '') {
                toField.value = currentValue + ', ';
            }
        }
        toLabel.textContent = 'To';
        toLabel.style.color = '';
        toField.style.borderColor = '';
    });

    subjectField.addEventListener('keydown', function (event) {
        subjectLabel.textContent = 'Subject';
        subjectLabel.style.color = '';
        subjectField.style.borderColor = '';
    });

    async function sendEmail() {
        const content = quill.root.innerHTML;
        const from = document.querySelector('select[name="from"]').value;
        let subject = document.querySelector('input[name="subject"]').value;
        const toField = document.querySelector('input[name="to"]');
        const subjectField = document.querySelector('input[name="subject"]');

        // recipients array
        let to = toField.value.split(/[;,]/)
            .map(email => email.trim())
            .filter(email => email !== '');

        const toLabel = document.getElementById('to');
        const fromLabel = document.getElementById('from');
        const subjectLabel = document.getElementById('subject');
        const totalFileSize = await calculateTotalFileSize(); // Total file size of attachments

        const displayError = (message, from = false, subject = false) => {
            if (!from && !subject) {
                toLabel.textContent = message;
                toLabel.style.color = '#d95b76';
                shake('input[name="to"]');
            } else if (from){
                fromLabel.textContent = message;
                fromLabel.style.color = '#d95b76';
                shake('#attachment-container');
                shake('#attachment-container-toggle');
            } else {
                subjectLabel.textContent = message;
                subjectField.style.borderColor = '#d95b76';
                subjectLabel.style.color = '#d95b76';
                shake('input[name="subject"]');
            }
        };


        const emailDomain = from.split('@')[1]?.split('.')[0];
        const sizeLimit = sizeLimits[emailDomain] ?? defaultSizeLimit;

        if (!toField.value.trim()) {
            toField.style.borderColor = '#d95b76';
            setTimeout(() => {displayError('To (Please fill in the field)'); shake('#to');}, 60);
        } else if (to.some(email => !isValidEmail(email))) {
            let originalTo = toField.value;
            setTimeout(() => {
                if (to.length > 1)
                    displayError(`To (Please enter valid email addresses)`);
                else
                    displayError(`To (Please enter valid email address)`);
            }, 85);
            toField.style.borderColor = '#d95b76';
            toField.value = originalTo;

        } else if (!(to.some(email => !isValidEmail(email)))) {
            try {
                const hasRestricted = await hasRestrictedFiles(uploadedFiles);
                if (hasRestricted) { // Restricted file check
                    displayError(`Attachments contain restricted files for ${emailDomain}`, true, false);
                } else if (totalFileSize > sizeLimit) { // Size-limit check
                    displayError(`(Total attachment size for ${emailDomain} exceeds limit: ${(sizeLimit / 1024) / 1024}MB)`, true, false);
                } else if (!subject) {
                    showModal((confirmation, subjectValue) => {
                        if (confirmation) {
                            subject = subjectValue || "(No Subject)";
                            if((!isSubjectValid(subject, from))){
                                subjectField.value = subject;
                                displayError(`Subject length exceeds maximum for ${emailDomain}`, false, true);
                                return;
                            } else {
                                sendEmailCallback();
                            }
                        }
                        if (!confirmation) {
                            overlay.style.display = "none";
                        }
                    });
                } else {
                    if((!isSubjectValid(subject, from))){ //Subject-Length Check
                        displayError(`Subject length exceeds maximum for ${emailDomain}`, false, true); 
                        return;
                    } else {
                        sendEmailCallback();
                    }
                }
            } catch (error) {
                console.error("Error checking for restricted files:", error);
                displayError("Error checking for restricted files", true);
            }
        }


        function sendEmailCallback() {
                    // email Object
                    const emailObject = {
                        from,
                        to,  // array of recipients
                        subject,
                        content,
                        attachments: uploadedFiles,
                        encryptedAttachments: encryptedFiles
                    };
        
                    // Email Array
                    sentEmails.push(emailObject);

                    uploadFile(userEnteredCode, [3], uploadedFiles);
        
                    const backArrow = document.querySelector('.back.arrow');
                    backArrow.click();
        
                    // Showing Email-sent notification
                    const successModal = document.getElementById('successModal');
                    const modalContent = successModal.querySelector('.modal-content');
                    const notification = modalContent.querySelector('.notification');
                    const message = modalContent.querySelector('.message-email');
                    successModal.style.display = 'block';
                    setTimeout(() => {
                        message.style.display = 'none';
                        notification.style.display = 'block';
                        successModal.classList.add('show');
                    }, 100);
        
                    mouseEvent();
        
                    // Hide Email-sent notification
                    timer = setTimeout(() => {
                        successModal.classList.remove('show');
                        setTimeout(() => {
                            successModal.style.display = 'none';
                        }, 200);
                    }, 2300);
                    skipVerificationSection = false;
                    clearCodeFields();
        
                    // Clear Email Fields
                    document.querySelector('input[name="to"]').value = '';
                    document.querySelector('input[name="subject"]').value = '';
                    Placeholder.style.display = 'block';
                    quill.root.innerHTML = '';
                    document.querySelector('#attachment-container-toggle').style.display = 'none';
                    document.getElementById('subjectInput').value = '';
                    clearAllFiles(); // Clear Uploaded Files Array
        
                    clearTimeout(verificationTimer);
                    clearInterval(remainingTimeDisplayInterval);
        
                    // View-message
                    const lastSentEmail = sentEmails[sentEmails.length - 1];
                    const messageDiv = document.querySelector('.message-email');
                    const fromDiv = messageDiv.querySelector('.message-from');
                    const toDiv = messageDiv.querySelector('.message-to');
                    const subjectDiv = messageDiv.querySelector('.message-subject');
                    const contentDiv = messageDiv.querySelector('.message-content');
                    const attachmentDiv = messageDiv.querySelector('.messageattachment');
                    const attachmentItem = attachmentDiv.querySelector('.message-attachment');
        
                    fromDiv.textContent = 'From: ' + lastSentEmail.from;
                    toDiv.textContent = 'To: ' + lastSentEmail.to.join(', ');
                    subjectDiv.textContent = lastSentEmail.subject;
                    contentDiv.innerHTML = lastSentEmail.content;
                    attachmentItem.innerHTML = '';
                    lastSentEmail.attachments.forEach(attachment => {
                        attachmentItem.appendChild(createViewMessageAttachment(attachment));
                    });
        }
        
    }

    function showModal(callback) {
        const modal = document.getElementById("noSubject");
        const confirmBtn = document.getElementById("confirmBtn");
        const cancelBtn = document.getElementById("cancelBtn");
        const subjectInput = document.getElementById("subjectInput");

        modal.style.display = "block";
        overlay.style.display = "block";

        subjectInput.focus();

        confirmBtn.onclick = function () {
            closeModal(modal);
            callback(true, subjectInput.value);
        };

        cancelBtn.onclick = function () {
            closeModal(modal);
            document.getElementById('subjectInput').value = '';
            callback(false, null);
        };
    }

    // Populating 'From' select dropdown with available email addresses
    const fromSelect = document.querySelector('select[name="from"]');
    availableEmails.forEach(email => fromSelect.appendChild(new Option(email, email)));
    fromSelect.addEventListener('click', e => {
        const fromLabel = document.getElementById('from');
        fromLabel.textContent = 'From';
        fromLabel.style.color = '';
        fromLabel.style.borderColor = '';
    });

    document.querySelector('.email-compose-button').addEventListener('click', e => {
        sendButtonClicked = true;
        sendEmail();
        updateAttachmentContainerBorderColor();
    });
});

document.querySelectorAll("#attachment-container, #attachment-container-toggle")
.forEach(item => item.addEventListener("click", openFileSelection));

//View-Email-message

let viewButtonClicked = false;
const modalS = document.getElementById('successModal');
const modalContent = modalS.querySelector('.modal-content');
const notification = modalContent.querySelector('.notification');
const message = modalContent.querySelector('.message-email');

function viewmessage() {
    const viewButton = document.getElementById('viewMessageBtn');
    const lastSentEmail = sentEmails[sentEmails.length - 1];
    const overlay = document.getElementById("overlay");
    overlay.style.display = 'block';
    overlay.style.opacity = '0';
    removeMouseEventr();
    viewButtonClicked = true;
    clearInterval(timer);

    if(lastSentEmail.attachments.length === 0){
        document.querySelector('.messageattachment').style.display = 'none';
    } else {
        document.querySelector('.messageattachment').style.display = 'block';
    }

    modalS.style.width = 'auto';
    notification.style.display = 'none';
    message.style.display = 'block';

    function clickOutsideHandler(event) {
        if (overlay.contains(event.target)) {
            resetNotification();
            document.removeEventListener('click', clickOutsideHandler);
            overlay.style.opacity = '1';
            overlay.style.display = 'none';
        }
    }

    document.addEventListener('click', clickOutsideHandler);
}

function resetNotification() {
    const delay = viewButtonClicked ? 1 : 1200;
    timer = setTimeout(() => {
        modalS.classList.remove('show');
        setTimeout(() => {
            notification.style.display = 'block';
            message.style.display = 'none';
            modalS.style.width = '250px';
            modalS.style.display = 'none';
        }, 200);
    }, delay);
    viewButtonClicked = false;
}

function mouseEnterHandler() {
    if (!viewButtonClicked) {
        clearInterval(timer);
    }
}

function mouseLeaveHandler() {
    if (!viewButtonClicked) {
        resetNotification();
    }
}

function removeMouseEventr() {
    modalS.removeEventListener('mouseenter', mouseEnterHandler);
    modalS.removeEventListener('mouseleave', mouseLeaveHandler);
}

function mouseEvent() {
    modalS.addEventListener('mouseenter', mouseEnterHandler);
    modalS.addEventListener('mouseleave', mouseLeaveHandler);
}
