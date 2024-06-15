var selectedPlatforms = [];//Platforms selected for upload
let totaldataUploaded = 0;


// JavaScript for adding dynamic behavior
$(document).ready(function() {
var platformOptions = document.querySelectorAll('.platform-option');

platformOptions.forEach(function(option) {
    option.addEventListener('mouseenter', function() {
        if (!this.classList.contains('selected')) {
            this.classList.add('active');
        }
    });
});

platformOptions.forEach(function(option) {
    option.addEventListener('mouseleave', function() {
        this.classList.remove('active');
    });
});

platformOptions.forEach(function(option) {
    option.addEventListener('click', function() {
        var platform = parseInt(this.dataset.authID);
        var index = selectedPlatforms.indexOf(platform);
        if (index === -1) {
            selectedPlatforms.push(platform);
            console.log(selectedPlatforms);
            this.classList.add('selected');
            this.classList.remove('active');
        } else {
            selectedPlatforms.splice(index, 1);
            this.classList.remove('selected');
            this.classList.remove('active');
        }
    });
});
});

// Function to check if at least one platform is selected
function platformsSelected() {
    return selectedPlatforms.length > 0;
}

// Function to handle the "Start Transfer" button click
document.getElementById('start-transfer-button').addEventListener('click', function() {
    transferButtonClicked = true;
    if (!filesUploaded()) {
        document.getElementById("backArrow").click();
        displayTemporaryMessage("Please upload some files first", false, 2500);
        return;
    } else if (!platformsSelected()) {
        if (!alert("Please select at least one platform")) {
            return;
        }
    } else if (limitExceeded()) {
        showUploadedFiles();
        return;
    } else {
        uploadfiles(verificationCodeGlobal, selectedPlatforms, uploadedFiles);
        const transferPlatforms = document.querySelector('.transfer-platforms');
        transferPlatforms.innerHTML = '';
        createPlatformTable();
        startTransfer(selectedPlatforms.shift());

    }
});

// Event listener for the "Preview Files" button
document.getElementById("preview").addEventListener("click", function() {
    showUploadedFiles();
});

document.getElementById("addFiles").addEventListener("click", function() {
    var modal = document.getElementById("uploaded-files-modal");
    closeModal(modal);
    let TIMEOUT = 180;

    if(document.querySelector('.S3').classList.contains('active')) {
    backArrow.click();
    TIMEOUT = 470;
    }

    setTimeout(() => displayTemporaryMessage("Please upload files here", true, 2000), TIMEOUT);
});

  //Total File count
  function fileCount() {
    const fileCountElement = document.getElementById("file-count");
    const fileCount = uploadedFiles.length;
    const totalSize = uploadedFiles.reduce((total, file) => total + file.size, 0);
    fileCountElement.textContent = `${fileCount} File${fileCount !== 1 ? 's' : ''} Total size ${formatFileSize(totalSize)}`;
    toggleFileDropText();
  }

  function toggleFileDropText() {
    const fileDropText = document.querySelector(".file-drop-button");
    if(fileDropText) {
    fileDropText.style.display = (uploadedFiles.length > 0) ? 'none' : 'block' ;
    }
  }
  
// Function to show uploaded files preview
function showUploadedFiles() {
    var modal = document.getElementById("uploaded-files-modal");
    toggleFileDropText();
    fileCount();
    showModal(modal);
  }
  
// Function to check File Size Limit
function limitExceeded() {
    const sizeError = document.getElementById("file-size-error");
    const maxFileSize = 50 * 1024 * 1024 * 1024; // 50GB
    const totalSize = uploadedFiles.reduce((total, file) => total + file.size, 0);
    
    if (totalSize > maxFileSize && transferButtonClicked) {
        sizeError.textContent = 'Total file size exceeds the maximum limit of 50GB';
        sizeError.style.color = '#d95b76';
        return true;
    } else {
        sizeError.textContent = '';
        return false;
    }
}

function resetPlatformOptions () {
    var platformOptions = document.querySelectorAll('.platform-option');
    platformOptions.forEach(function(option) {
        option.classList.remove('active');
        option.classList.remove('selected');
    });
    selectedPlatforms = [];
}
