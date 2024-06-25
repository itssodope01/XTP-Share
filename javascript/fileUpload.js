

const uploadedFilesList = document.querySelector('.uploaded-files');
const fileUpload = document.getElementById('file-upload');
const folderUpload = document.getElementById('folder-upload');
const sortBySelect = document.getElementById('sort-by');

// Event Listeners
fileUpload.addEventListener('change', handleFileUpload);
folderUpload.addEventListener('change', handleFileUpload);
sortBySelect.addEventListener('change', handleSortChange);

function openFileSelection() {
  fileUpload.click();
}

// Function to handle file Upload
function handleFileUpload(event) {
  const files = event.target.files || event.dataTransfer.files;

  for (const file of files) {
      // Check if a file with the same name already exists
      if (fileExists(file.name)) {
          const replace = confirm(`A file with the name "${file.name}" already exists. Do you want to replace it?`);
          if (!replace) continue;
          else removeFile(file);
          resetZipModal();
      }

      // Store file
      uploadedFiles.push(file);
      fileCount();
      appendFileItems(file);
  }

  // Reset file input value
  event.target.value = '';

  // Update UI
  updateUI(selectedFilesContainer);
  updateAttachmentContainerBorderColor();
}

function appendFileItems(file) {
  const fileItem = createFileItem(file);
  const previewItem = createPreviewItem(file);

  selectedFilesContainer.appendChild(fileItem);
  attachment.appendChild(createFileItem(file));
  uploadedFilesList.appendChild(previewItem);
}


// Function to upload selected files to the server
const cancelButton = document.querySelector('.cancel-transfer');
const closeButton = document.querySelector('.close-transfer');

let cancelTokenSource;

function uploadFile(code, selectedPlatforms, uploadedFiles) {
    code = parseInt(code);

    // Raw Data
    console.log(`User Entered OTC: ${code}`);
    console.log(selectedPlatforms);
    console.log(uploadedFiles);

    // Creating FormData
    const data = new FormData();
    data.append('otc', code);
    selectedPlatforms.forEach(id => data.append('authIDs', id));
    uploadedFiles.forEach(file => data.append('files', file));

    // The FormData content
    for (let pair of data.entries()) {
        console.log(pair[0] + ', ' + pair[1]);
    }

    // Cancel Token
    cancelTokenSource = axios.CancelToken.source();

    // Start time
    const startTime = Date.now();
    openTransfer();

    // Simulate random transfer rate (between 7 Mb/s and 20 Mb/s)
    const transferRate = Math.floor(Math.random() * (20 - 7 + 1)) + 7;

    axios.post('https://xtpshareapimanagement.azure-api.net/api/transfer/Start', data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        cancelToken: cancelTokenSource.token,
        onUploadProgress: function (progressEvent) {
            const totalSize = uploadedFiles.reduce((acc, file) => acc + file.size, 0);
            const progress = (progressEvent.loaded / totalSize) * 100;
            if (progress > 80) {
              progress = Math.min(progress, 80);
            }
            updateProgressBar(progress);
        }
    }).then(response => {
        console.log(response.data); // Actual server response
        updateProgressBar(100);
    }).catch(error => {
        console.error('Error:', error);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        if (axios.isCancel(error)) {
            console.log('Upload canceled');
        }
    });
}

function updateProgressBar(progress) {
    const progressBarFill = document.getElementById('transfer-progress');
    if (progress < 100) {
      progress = Math.min(progress, 80);
    }
    progressBarFill.style.width = progress + '%';
    if (progress === 100) {
          setTimeout (() => {
            completeTransfer();
          }, 200);
    }
}

function openTransfer() {
    const modal = document.getElementById('transferModal');
    showModal(modal);
}

function closeTransfer() {
    const modal = document.getElementById('transferModal');
    closeModal(modal);
    const progressBarFill = document.getElementById('transfer-progress');
    progressBarFill.style.width = '0%';
    skipVerificationSection = false;
    clearCodeFields();
    startVerificationTimer();
    toggledetails();

    setTimeout(() => {
      dots('visible');
      headerMessage ('Transfer in progress');
      cancelButton.style.visibility = 'visible';
      if(!(SectionS2.classList.contains('active'))) {
      clearAllFiles();
      backArrow.click();
      }
    }, 200);
}

function cancelTransfer() {
    if (cancelTokenSource) {
        cancelTokenSource.cancel('User canceled the upload.');
    }
    closeTransfer();
}

function completeTransfer() {
  skipVerificationSection = false;
  startVerificationTimer();
  clearCodeFields();
  setTimeout(() => {
    toggledetails();
    dots('hidden');
    headerMessage ('Transfer Complete');
    closeButton.style.display = 'block';
    cancelButton.style.display = 'none';
    showEmailNotification();
  }, 350);
}

function dots(visibility) {
  const dots = document.querySelectorAll('#transferModal .modal-content h3 .dot');
  dots.forEach(dot => dot.style.visibility = `${visibility}`);
}

function headerMessage (message) {
  const header = document.querySelector('.transfer-h3');
  header.textContent = message;
}


// Sorting Files
function handleSortChange() {
  const sortBy = this.value;
  let sortedFiles = [...uploadedFiles];

  switch (sortBy) {
    case 'size-ascending':
      sortedFiles.sort((a, b) => a.size - b.size);
      break;
    case 'size-descending':
      sortedFiles.sort((a, b) => b.size - a.size);
      break;
    case 'name-sort':
      sortedFiles.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      break;
  }
  
  uploadedFilesList.innerHTML = '';
  sortedFiles.forEach(file => {
    const previewItem = createPreviewItem(file);
    uploadedFilesList.appendChild(previewItem);
  });

  limitExceeded();
}

//Function to remove file
function removeFile(fileToRemove) {
  uploadedFiles = uploadedFiles.filter(file => file.name !== fileToRemove.name);

  document.querySelectorAll('.file-item, .uploaded-file').forEach(item => {
    if (item.getAttribute('data-full-name') === fileToRemove.name) {
      item.remove();
    }
  });

  updateUI(selectedFilesContainer);
  updateAttachmentContainerBorderColor();
}

// Function to clear all files
function clearAllFiles() {
  uploadedFiles.forEach(file => {
    removeFile(file);
  });
}

// Function to check if a file with the same name exists
function fileExists(fileName) {
  return uploadedFiles.some(file => file.name === fileName);
}

  // Function to format file size
  function formatFileSize(size) {
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
     
// Function to get file type
function getFileType(fileType, fileName) {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('video/') || /\.(gif)$/i.test(fileName)) return 'video';
  if (fileType === 'application/pdf') return 'pdf';
  if (/\.(java|py|cpp|c|html|css|js|php|rb|go|swift|kt|ts|lua|pl|sh|json|class|sql)$/i.test(fileName)) return 'code';
  if (/\.(doc|docx)$/i.test(fileName)) return 'word';
  if (/\.(xls|xlsx|csv)$/i.test(fileName)) return 'excel';
  if (/\.(ppt|pptx)$/i.test(fileName)) return 'powerpoint';
  if (/\.(txt)$/i.test(fileName)) return 'text';
  if (/\.(zip)$/i.test(fileName)) return 'zip';
  if (/\.(mp3)$/i.test(fileName)) return 'mp3';
  return 'other';
}

function handleDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = 'copy';
}

function handleDragEnter(event) {
  event.preventDefault();
  event.stopPropagation();
}

function handleDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
}

function handleDrop(event) {
  zipConversionCancelled = false;
  event.preventDefault();
  event.stopPropagation();

  const items = event.dataTransfer.items;
  const files = event.dataTransfer.files;

  if (items) {
    // Filter out directories and files separately
    const directories = [];
    const individualFiles = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const entry = item.webkitGetAsEntry();

      if (entry.isDirectory) {
        directories.push(entry);
      } else {
        individualFiles.push(files[i]);
      }
    }

    totalFolders = directories.length;

    if (directories.length > 0) {
      const folderNames = directories.map(directory => `"${directory.name}"`).join(', ');
      const modalMessage = `Do you want to zip ${directories.length > 1 ? `${directories.length} folders: ${folderNames} or upload their` : `the folder ${folderNames} or upload its`}  files separately?`;

      showZipModal(modalMessage, () => {
        // Convert each directory to zip
        directories.forEach(directory => {
          handleZipFolder(directory);
        });
      }, () => {
        // Upload files from each directory separately
        directories.forEach(directory => {
          handleIndividualFiles(directory);
        });
      });
    }

    // Handle individual files
    individualFiles.forEach(file => {
      handleFileUpload({ target: { files: [file] } });
    });
  }
}


// Function to recursively add folder and files to a zip
function addFolderToZip(folder, path, zip, progressCallback) {
  return new Promise((resolve, reject) => {
    if (zipConversionCancelled) {
      reject(new Error('Zip conversion cancelled by user'));
      return;
    }

    folder.createReader().readEntries(entries => {
      let promises = [];
      let totalFiles = 0;
      let completedFiles = 0;

      entries.forEach(entry => {
        if (entry.isFile) {
          totalFiles++;
          promises.push(new Promise((resolveFile, rejectFile) => {
            entry.file(file => {
              zip.file(path + entry.name, file);
              completedFiles++;
              resolveFile();
            });
          }));
        } else if (entry.isDirectory) {
          promises.push(addFolderToZip(entry, path + entry.name + '/', zip));
        }
      });

      Promise.all(promises)
        .then(() => resolve(zip))
        .catch(error => reject(error));
    });
  });
}


// Function to handle zip conversion
function handleZipFolder(folder) {
  const folderName = folder.name;
  const zip = new JSZip();
  const modalText = document.getElementById('modal-text');

  const progressCallback = (progress) => {
    if (!zipConversionCancelled) {
      modalText.textContent = `Compressing "${folderName}" to zip... ${progress}%`;
    }
  };

  modalText.textContent = `Compressing "${folderName}" to zip... 0%`;

  addFolderToZip(folder, '', zip, progressCallback)
    .then(() => {
      if (!zipConversionCancelled) {
        // Generate the zip file with parallel compression and progress event
        return zip.generateAsync({ 
          type: 'blob', 
          compression: 'DEFLATE', 
          parallel: true 
        }, (metadata) => {
          // Update progress callback with percentage
          const percent = Math.round((metadata.percent || 0));
          progressCallback(percent);
        });
      }
    })
    .then(blob => {
      if (!zipConversionCancelled) {
        // Creating a File object from the Blob
        const zipFile = new File([blob], folder.name + '.zip');

        handleFileUpload({ target: { files: [zipFile] } });

        completedFolders++;

        if (completedFolders === totalFolders) {
          totalFolders = 0;
          completedFolders = 0; 
          resetZipModal();
        }
      }
    })
    .catch(error => {
      if (!zipConversionCancelled) {
        console.error('Error zipping folder:', error);
      }
    })
    .finally(() => {
      if (!zipConversionCancelled) {
        const zipButton = document.getElementById('zip-button');
        const uploadButton = document.getElementById('upload-button');
        zipButton.disabled = false; 
        uploadButton.disabled = false;
        modalText.textContent = '';
      }
      zipConversionCancelled = false;
    });
}


function handleIndividualFiles(folder) {
  const reader = folder.createReader();

  reader.readEntries(entries => {
    entries.forEach(entry => {
      if (entry.isFile) {
        entry.file(file => {
          handleFileUpload({ target: { files: [file] } });
        });
      } else if (entry.isDirectory) {
        // Recursively handle subfolders
        handleIndividualFiles(entry);
      }
    });

    if (!entries.length) {
      reader.close();
    }
  }, error => {
    console.error('Error reading folder entries:', error);
  });
}


// Function to simulate progress
function simulateProgress(progress, progressBar) {
  let width = 1;
  const interval = setInterval(() => {
    if (width >= 100) {
      clearInterval(interval);
      progressBar.style.display = 'none';
      applyStyles();
    } else {
      width++;
      progress.style.width = width + '%';
    }
  }, 25);
}

function applyStyles() {
  var fileItems = selectedFilesContainer.querySelectorAll('.file-item');
  fileItems.forEach(function(item) {
      item.style.borderColor = 'var(--file-drop-box-border)';
      item.style.borderRadius = '10px';
  });
  var fileActions = document.querySelectorAll('.delete-button');
  fileActions.forEach(function(actions) {
      actions.style.visibility = 'visible';
  });
}


// Event listeners for placeholder image and file drop text
document.querySelectorAll('.placeholder-image, .file-drop-text').forEach(element => element.addEventListener('click',
() => openFileSelection()));

// Function to check if any files are uploaded
function filesUploaded() {
    return uploadedFiles.length > 0;
}

// MutationObserver
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
            updateUI(selectedFilesContainer);
        }
    });
});

const observerConfig = { childList: true };
observer.observe(selectedFilesContainer, observerConfig);
