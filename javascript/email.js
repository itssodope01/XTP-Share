
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

// size limit
const SizeLimit = 20 * 1024 * 1024; // 20MB

// Function to calculate total file size of attachments
async function calculateTotalFileSize() {
    return uploadedFiles.reduce((totalSize, file) => totalSize + file.size, 0);
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
                        return false; 
                    }
                } else if (restrictedFileTypes.includes(fileExtension)) {
                    return true; // Found a restricted file
            }
        }
     return false;
};


let sendButtonClicked = false;
let sentEmails = []; // Email Array
let timer;

$(document).ready(function () {
    const overlay = document.getElementById("overlay");

    async function sendEmail() {
        const from = document.querySelector('select[name="from"]').value;
        const emailError = document.querySelector('.emailError');

        // recipients array
        // let to = toField.value.split(/[;,]/)
        //     .map(email => email.trim())
        //     .filter(email => email !== '');

        const fromLabel = document.getElementById('from');
        const totalFileSize = await calculateTotalFileSize(); // Total file size of attachments

        const displayError = (message) => {
            emailError.textContent = message;
            emailError.style.color = '#d95b76';
            shake('#attachment-container');
        };

        try {
            const hasRestricted = await hasRestrictedFiles(uploadedFiles);
            if (hasRestricted) { // Restricted file check
                displayError(`Attachments contain restricted files.`);
            } else if (totalFileSize > SizeLimit) { // Size-limit check
                displayError(`Total attachment size exceeds limit: 20 MB.`);
            } else {
                sendEmailCallback();
            }
        } catch (error) {
            console.error("Error checking for restricted files:", error);
            displayError("Error checking for restricted files");
        }


        function sendEmailCallback() {
                    // email Object
                    const emailObject = {
                        from,
                        attachments: uploadedFiles,
                    };
        
                    // Email Array
                    sentEmails.push(emailObject);

                    const userAuthID = userEmails.map(email => email.authID);

                    uploadFile(userEnteredCode, userAuthID, uploadedFiles);

                    clearAllFiles(); 
        
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
                    document.querySelector('#attachment-container-toggle').style.display = 'none';
                    document.getElementById('subjectInput').value = '';
        
                    clearTimeout(verificationTimer);
                    clearInterval(remainingTimeDisplayInterval);
        
                    // View-message
                    const lastSentEmail = sentEmails[sentEmails.length - 1];
                    const messageDiv = document.querySelector('.message-email');
                    const fromDiv = messageDiv.querySelector('.message-from');
                    const attachmentDiv = messageDiv.querySelector('.messageattachment');
                    const attachmentItem = attachmentDiv.querySelector('.message-attachment');
        
                    fromDiv.textContent = 'From: ' + lastSentEmail.from;
                    attachmentItem.innerHTML = '';
                    lastSentEmail.attachments.forEach(attachment => {
                        attachmentItem.appendChild(createViewMessageAttachment(attachment));
                    });
        }
        
    }

    document.querySelector('.email-compose-button').addEventListener('click', e => {
        sendButtonClicked = true;
        sendEmail();
        updateAttachmentContainerBorderColor();
    });
});

function loadUserEmails () {
        // Populating 'From' select dropdown with available email addresses
        const fromSelect = document.querySelector('select[name="from"]');
        const userEmailAccounts = userEmails.map(email => email.account);
        userEmailAccounts.forEach(email => fromSelect.appendChild(new Option(email, email)));
        fromSelect.addEventListener('click', e => {
        const fromLabel = document.getElementById('from');
        fromLabel.textContent = 'From';
        fromLabel.style.color = '';
        fromLabel.style.borderColor = '';
    });
}

document.querySelectorAll("#attachment-container")
.forEach(item => item.addEventListener("click", openFileSelection));

//View-Email-message

let viewButtonClicked = false;
const modalS = document.getElementById('successModal');
const modalContent = modalS.querySelector('.modal-content');
const notification = modalContent.querySelector('.notification');
const message = modalContent.querySelector('.message-email');

function viewmessage() {
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
