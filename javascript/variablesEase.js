//This file is Mainly for Styling Scripts

function generateIcons() {
    const iconWrapper = document.getElementById('iconWrapper');
    platforms.forEach(icon => {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'icon';
        iconDiv.id = icon.name;
        iconDiv.style.setProperty('--color', icon.hover_color);

        iconDiv.innerHTML = `<span class="tooltip">${icon.name}</span>
                             <img src="${baseURL}${icon.src}" alt="${icon.name}" class="platform-logo">`;

        iconWrapper.appendChild(iconDiv);
    });
}

generateIcons();

// Cloud platforms
function loadCloudAccounts() {
    const platformsContainer = document.getElementById('platformsContainer');
    platformsContainer.innerHTML = ''; // Clear existing content

    const userCloudAuthIDs = userClouds.map(cloud => cloud.auth);

    platforms.forEach(platform => {
        if (platform.class === "cloud" && userCloudAuthIDs.includes(platform.authtype)) {
            const platformOption = document.createElement('div');
            platformOption.classList.add('platform-option');
            platformOption.dataset.platform = platform.name;
            platformOption.dataset.authID = platform.authType;

            const platformBackground = document.createElement('div');
            platformBackground.classList.add('platform-background');
            platformBackground.style.backgroundColor = platform.hover_color;

            const platformDiv = document.createElement('div');
            platformDiv.classList.add('platform');

            const platformIcon = document.createElement('img');
            platformIcon.classList.add('platform-icon');
            platformIcon.src = baseURL + platform.src;
            platformIcon.style.width = '90px';
            platformIcon.style.height = '90px';

            const platformName = document.createElement('span');
            platformName.classList.add('platform-name');
            platformName.textContent = platform.name;

            platformOption.appendChild(platformBackground);
            platformDiv.appendChild(platformIcon);
            platformDiv.appendChild(platformName);
            platformOption.appendChild(platformDiv);

            platformsContainer.appendChild(platformOption);
        }
    });
}


// File Upload and Element Creations

// Function to create file item
function createFileItem(file) {
    const fileItem = createFileItemElement(file);

    // File icon or image preview
    const fileType = getFileType(file.type, file.name);
    const fileIcon = document.createElement('img');
    fileIcon.src = getFileIcon(fileType);
    fileIcon.classList.add('file-icon');
    fileItem.appendChild(fileIcon);
    fileiconActions(fileIcon, file);

    // File details container
    const fileDetailsContainer = createFileDetails(file);
    fileItem.appendChild(fileDetailsContainer);

    const fileActions = createFileActions(file);
    fileItem.appendChild(fileActions);

    // // Progress bar
    // const progressBar = document.createElement('div');
    // progressBar.classList.add('progress-bar');
    // const progress = document.createElement('div');
    // progress.classList.add('progress');
    // progressBar.appendChild(progress);
    // fileItem.appendChild(progressBar);

    // // Simulate progress
    // simulateProgress(progress, progressBar);

    return fileItem;
}

function createPreviewItem(file) {
    const newRow = document.createElement('tr');
    newRow.classList.add('uploaded-file');
    newRow.setAttribute('data-full-name', file.name);
    
    // Extract file extension
    const fileNameParts = file.name.split('.');
    const extension = fileNameParts.length > 1 ? fileNameParts.pop().toLowerCase() : '';

    const fileBaseType = getFileType(file.type, file.name);
    const fileIcon = getFileIcon(fileBaseType);

    const dateModified = new Date(file.lastModified);
    const formattedDate = `${dateModified.toLocaleDateString()}<br>${dateModified.toLocaleTimeString()}`;
  
    newRow.innerHTML = `
      <td class="icon" style="border-bottom: 0;">
        <img src="${fileIcon}" alt="${fileBaseType}" style="width: 24px; height: 24px;">
      </td>
      <td class="filename">${file.name}</td>
      <td class="filetype">${extension.toUpperCase()}</td>
      <td class="filesize">${formatFileSize(file.size)}</td>
      <td class="datemodified">${formattedDate}</td>
      <td class="deletebutton"><i class="fas fa-trash-alt" style="width: 24px; height: 24px;"></i></td>
    `;

    const Icon = newRow.querySelector('.icon');

    fileiconActions(Icon, file);

    const deleteButton = newRow.querySelector('.deletebutton');

    addDeleteButtonListner(deleteButton, file);
    
    return newRow;
}


// Function to create file item element and set initial attributes
function createFileItemElement(file, isAttachment = false) {
    const fileItem = document.createElement('li');
    
    if(!isAttachment)
    fileItem.classList.add('file-item');
    else
    fileItem.classList.add('attachment-item');

    fileItem.setAttribute('data-full-name', file.name);
    return fileItem;
}

// Function to create file details
function createFileDetails(file) {
    const fileDetailsContainer = document.createElement('div');
    fileDetailsContainer.classList.add('file-details-container');

    const fileDetails = document.createElement('div');
    fileDetails.classList.add('file-details');

    const fileName = document.createElement('div');
    fileName.textContent = truncateFileName(file.name);
    fileName.classList.add('file-name');
    fileDetails.appendChild(fileName);
    fileiconActions(fileName, file);

    const fileSize = document.createElement('div');
    fileSize.textContent = formatFileSize(file.size);
    fileSize.classList.add('file-size');
    fileDetails.appendChild(fileSize);

    fileDetailsContainer.appendChild(fileDetails);

    return fileDetailsContainer;
}

// Function to create file Actions
function createFileActions(file) {
    const fileActions = document.createElement('div');
    fileActions.classList.add('file-actions');

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<i class="fas fa-times"></i>';
    deleteButton.classList.add('action-button', 'delete-button');
    addDeleteButtonListner(deleteButton, file);
    fileActions.appendChild(deleteButton);

    return fileActions;
}

function addDeleteButtonListner(deleteButton, file){
    deleteButton.addEventListener('click', () => {
        removeFile(file);
        fileCount();
        toggleFileDropText();
        limitExceeded();
    });
}

function fileiconActions(fileIcon, file) {
    const fileType = getFileType(file.type, file.name);
    const actionMap = {
        'image': () => openImagePreview(file),
        'word': () => openWordDocumentInNewTab(file),
        'code': () => openFileInNewTab(file),
        'pdf': () => openFileInNewTab(file),
        'text': () => openFileInNewTab(file),
        'excel': () => openFileInNewTab(file),
        'zip': () => handleZipFileClick(file)
    };

    if (actionMap[fileType]) {
        fileIcon.addEventListener('click', actionMap[fileType]);
        fileIcon.style.cursor = 'pointer';
    }
}

function openFileInNewTab(file) {
    const newTab = window.open('', '_blank');
    if (file.type === 'application/pdf') {
        newTab.location = URL.createObjectURL(file);
    } else {
        const reader = new FileReader();
        reader.onload = function() {
            const preElement = document.createElement('pre');
            const codeElement = document.createElement('code');
            codeElement.textContent = reader.result;
            preElement.appendChild(codeElement);
            newTab.document.body.appendChild(preElement);
        };
        reader.readAsText(file);
    }
}

function openWordDocumentInNewTab(file) {
    const newTab = window.open('', '_blank');
    const reader = new FileReader();
    reader.onload = function() {
        const arrayBuffer = reader.result;
        mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
            .then(function(result) {
                newTab.document.body.innerHTML = result.value;
            })
            .catch(function(err) {
                console.log(err);
            });
    };
    reader.readAsArrayBuffer(file);
}

// Function to handle click on .zip files
function handleZipFileClick(file) {
    downloadFile(file);
}
  
// Download File
function downloadFile(file) {
    const blob = new Blob([file], { type: file.type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', file.name);
  
    document.body.appendChild(link);
    link.click();
  
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}


// Function to open image preview popup
function openImagePreview(file) {
    const imageUrl = URL.createObjectURL(file);
    const previewWindow = window.open(imageUrl, 'Image Preview', 'width=600,height=400,resizable=yes');
    if (previewWindow) {
        previewWindow.focus();
    } else {
        alert('Please allow pop-ups for this site to view the image preview.');
    }
}

function truncateFileName(fileName) {
    let maxLength = 16;
    const dotIndex = fileName.lastIndexOf(".");
    const capitalLetters = fileName.match(/[A-Z]/g);
    if (capitalLetters && capitalLetters.length > 4) {
        maxLength = 12;
    }
    if (dotIndex === -1) {
        if (fileName.length > maxLength) {
            return fileName.slice(0, maxLength - 3) + '...';
        } else {
            return fileName;
        }
    } else {
        const name = fileName.slice(0, dotIndex);
        const ext = fileName.slice(dotIndex + 1);
        
        if (name.length > maxLength) {
            const truncatedName = name.slice(0, maxLength - ext.length - 3) + '...' + name.slice(-2);
            return truncatedName + '.' + ext;
        } else {
            return fileName;
        }
    }
}

// Function to return file icon
function getFileIcon(fileType) {
    return `assets/logo/file-icon/${fileType}.png`;
}

function updateUI(selectedFilesContainer) {
    const clearAllButton = document.querySelector('.clear-all-button');
    const AddFilesButton = document.querySelector('.add-files-button');
    const placeholderImage = document.querySelector('.placeholder-image');
    const uploadButton = document.querySelector('.upload');
    const Border = document.querySelector('.file-drop-box');
    const fileDropText = document.querySelector('.file-drop-text');
    const attachmentText = document.querySelector('.attachment-text');
    const attachmentTextT = document.querySelector('#attachment-container-toggle .attachment-text');

    const numFiles = selectedFilesContainer.children.length;

    clearTimeout(fileTextTimeout);
    clearTemporarymessage();

    if (numFiles > 0) {
        fileDropText.style.display = 'none';
        placeholderImage.style.display = 'none';
        attachmentText.style.display = 'none';
        attachmentTextT.style.display = 'none';
        Border.style.border = '3px solid var(--file-drop-box-border)';
        [attachmentContainer, attachmentToggle]
        .forEach(item => item.removeEventListener("click", openFileSelection));
        
    } else {
        fileDropText.style.display = 'block';
        placeholderImage.style.display = 'block';
        attachmentText.style.display = 'block';
        attachmentTextT.style.display = 'block';
        Border.style.border = '3px dashed var(--file-drop-box-border)';
        setTimeout(() => {
            [attachmentContainer, attachmentToggle]
                .forEach(item => item.addEventListener("click", openFileSelection));
        }, 200);        
    }

    clearAllButton.style.left = numFiles > 1 ? '84.4%' : '50%';
    AddFilesButton.style.left = numFiles > 6 ? '84.4%' : '75%';
    if(clearAllButton.style.left === '84.4%'){
        clearAllButton.disabled = false;
        clearAllButton.style.visibility = 'visible';
    }
    if(AddFilesButton.style.left === '84.4%'){
        AddFilesButton.disabled = false;
        AddFilesButton.style.visibility = 'visible';
    }
    if(clearAllButton.style.left === '50%'){
        setTimeout(function() {
            clearAllButton.style.visibility = 'hidden';
            clearAllButton.disabled = true; 
        }, 500);
    }
    if(AddFilesButton.style.left === '75%'){
        setTimeout(function() {
            AddFilesButton.style.visibility = 'hidden';
            AddFilesButton.disabled = true; 
        }, 500);
    }
    uploadButton.style.display = numFiles > 6 ? 'none' : 'block';
}


// Function to create an attachment item
function createAttachmentItem(file) {
    const attachmentItem = createFileItemElement(file, true);
    attachmentItem.classList.add("noBorder");

    const attachmentIcon = document.createElement('i');
    attachmentIcon.classList.add('fas', 'fa-file-alt', 'attachment-iconn');
    attachmentItem.appendChild(attachmentIcon);
    fileiconActions(attachmentIcon, file);

    const fileDetailsContainer = createFileDetails(file);
    attachmentItem.appendChild(fileDetailsContainer);

    const fileActions = createFileActions(file);
    attachmentItem.appendChild(fileActions);

    // // Progress bar
    // const progressBar = document.createElement('div');
    // progressBar.classList.add('progress-bar');
    // const progress = document.createElement('div');
    // progress.classList.add('progress');
    // progressBar.appendChild(progress);
    // attachmentItem.appendChild(progressBar);

    // // Simulate progress
    // simulateProgress(progress, progressBar);

    return attachmentItem;
}

function createViewMessageAttachment(file) {
    const attachmentItem = createFileItemElement(file);

    const attachmentIcon = document.createElement('i');
    attachmentIcon.classList.add('fas', 'fa-file-alt', 'attachment-iconn');
    attachmentItem.appendChild(attachmentIcon);
    fileiconActions(attachmentIcon, file);

    const fileDetailsContainer = createFileDetails(file);
    attachmentItem.appendChild(fileDetailsContainer);

    const downloadIcon = document.createElement('i');
    downloadIcon.classList.add('fas', 'fa-download', 'attachment-icon');
    downloadIcon.style.cursor = 'pointer';
    attachmentItem.appendChild(downloadIcon);

    downloadIcon.addEventListener('click', function() {
        downloadFile(file);
    });

    attachmentItem.style.borderColor = '#6b6b6b';
    attachmentItem.style.borderRadius = '10px';

    return attachmentItem;
}

//Function to visually indicate restricted files and file size limit
async function updateAttachmentContainerBorderColor() {
    const to = document.querySelector('input[name="to"]').value.split(',').map(email => email.trim());
    const from = document.querySelector('select[name="from"]').value;
    const totalFileSize = await calculateTotalFileSize();
    const emailDomain = (from.split('@')[1] || '').split('.')[0];
    const sizeLimit = sizeLimits[emailDomain] ?? defaultSizeLimit;
    const fromLabel = document.getElementById('from');

    try {
        const hasRestricted = await hasRestrictedFiles(uploadedFiles);

        if (to.every(isValidEmail) && totalFileSize > sizeLimit && !hasRestricted && sendButtonClicked) {
            changeBorderAndColor('#d95b76', '.file-size', file => file.size > sizeLimit);
            return;
        } else if (to.every(isValidEmail) && hasRestricted) {
            changeBorderAndColor('#d95b76', '.file-name', file => restrictedFileTypes.includes(file.name.split('.').pop().toLowerCase()));

            if (uploadedFiles.filter(file => restrictedFileTypes.includes(file.name.split('.').pop().toLowerCase())).length < 2) {
                sendButtonClicked = false;
            }
            
            for (const file of uploadedFiles) {
                if (file.name.split('.').pop().toLowerCase() === 'zip') {
                    if (await hasRestrictedFiles([file])) {
                        changeColor('.file-name', file.name, '#d95b76');
                    }
                }
            }
            return;
        } else {
            resetStyles();
        }
    } catch (error) {
        console.error("Error updating attachment container border color:", error);
    }

    function changeBorderAndColor(Color, selector, condition) {
        attachmentContainer.style.borderColor = attachmentToggle.style.borderColor = Color;
        [attachment, attachmentToggle].forEach(container => {
            uploadedFiles.forEach(file => {
                const fileItem = container.querySelector(`.file-item[data-full-name="${file.name}"] ${selector}`);
                if (fileItem && condition(file)) {
                    fileItem.style.color = Color;
                }
            });
        });
    }

    function changeColor(selector, fileName, color) {
        const fileItem = attachment.querySelector(`.file-item[data-full-name="${fileName}"] ${selector}`);
        if (fileItem) {
            fileItem.style.color = color;
        }
    }

    function resetStyles() {
        attachmentContainer.style.borderColor = attachmentToggle.style.borderColor = 'var(--email-border-color)';
        fromLabel.textContent = 'From';
        fromLabel.style.color = '';
        fromLabel.style.borderColor = '';
    }
}


// Function to toggle attachment container visibility
const toggleAttachment = () => {

    const isActive = attachmentContainer.classList.toggle('active');

    if (isActive) {
        // Showing attachment container and hiding editor
        editor.style.display = 'none';
        getElement("editorPlaceholder").style.display = 'none';
        attachmentToggle.style.display = 'block';
        attachmentToggle.style.cssText = `list-style: none; display: flex; flex-wrap: wrap; justify-content: space-between;`;
        document.querySelector('.attachments-link').textContent = 'Hide Attachments';
    } else {
        // Hiding attachment container and showing editor
        if (!quill.root.textContent.trim()) {
            getElement("editorPlaceholder").style.display = 'block';
        }
        attachmentToggle.style.display = 'none';
        editor.style.display = 'block';
        document.querySelector('.attachments-link').textContent = 'Show Attachments';
    }
};

// Event listener for toggling attachment visibility
document.querySelector('.attachments-link').addEventListener('click', e => {
    e.preventDefault();
    toggleAttachment();
});

// Event listener for window resize to handle attachment container visibility
window.addEventListener('resize', () => {
    const windowWidth = window.innerWidth;
    if (windowWidth > 650 && attachmentContainer.classList.contains('active')) {
        attachmentContainer.classList.remove('active');
        document.querySelector('.attachments-link').textContent = 'Show Attachments';
        attachmentToggle.style.display = 'none';
        editor.style.display = 'block';
    }
});

$(document).ready(function() {
    $('#start-transfer-button').hover(function() {
        $('#svg1').toggleClass('blink-animation-1');
        $('#svg2').toggleClass('blink-animation-2');
    });
});

//Zip-Modal
let zipConversionCancelled = false; 
let totalFolders = 0; 
let completedFolders = 0; 

function showZipModal(message, zipCallback, uploadCallback) {
  const modal = document.getElementById('Zipmodal');
  const modalText = document.getElementById('modal-text');
  const zipButton = document.getElementById('zip-button');
  const uploadButton = document.getElementById('upload-button');
  const loader = document.getElementById('zip-loader'); 

  modalText.textContent = message;
  showModal(modal);

  zipButton.onclick = function() {
    modalText.textContent = "Converting to Zip...";
    zipButton.disabled = true;
    uploadButton.disabled = true;
    zipButton.style.display = 'none';
    uploadButton.style.display = 'none';
    loader.style.display = 'block'; 
    zipCallback();
  };

  uploadButton.onclick = function() {
    closeModal(modal);
    uploadCallback();
  };

  // Close the modal and invoke cancelCallback if the overlay or close button is clicked
  document.getElementById('overlay').addEventListener('click', function() {
    zipConversionCancelled=true;
    resetZipModal();
  });

  document.getElementById('closeZip').addEventListener('click', function() {
    zipConversionCancelled=true;
    resetZipModal();
  });
}

function resetZipModal() {
    const modal = document.getElementById('Zipmodal');
    const zipButton = document.getElementById('zip-button');
    const uploadButton = document.getElementById('upload-button');
    const loader = document.getElementById('zip-loader');
    zipButton.style.display = 'block';
    uploadButton.style.display = 'block';
    closeModal(modal);
    zipButton.disabled = false; 
    uploadButton.disabled = false; 
    loader.style.display = 'none';
}
