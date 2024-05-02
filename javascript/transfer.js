let totalFiles;
let totalFileSize;
let remainFileSize;
let count = 0;
let transferredFiles = 0;
let completedPlatform = 0;
let transfercancelled = false;

const transferTo = document.querySelector('.transfer-to');
const progressBar = document.querySelector('#transfer-progress');
const progressText = document.querySelector('.progress-text');
const transferTotal = document.querySelector('.transfer-total');
const transferFileDetails = document.querySelector('.transfer-filedetails');
const transferPlatforms = document.querySelector('.transfer-platforms');
const transferRemaining = document.querySelector('.transfer-remaining');
const transferRateElement = document.querySelector('.transfer-rate');
const transferTimeElement = document.querySelector('.transfer-time');
const cancelButton = document.querySelector('.cancel-transfer');
const closeButton = document.querySelector('.close-transfer');
const main = document.querySelector('.main');
const second = document.querySelector('.second');
const completed = document.querySelector('.completed');

function startTransfer(platform) {
  transferstarted = true;
  clearTimeout(verificationTimer);
  clearInterval(remainingTimeDisplayInterval);
  showModal(transferModal);
  cancelButton.style.display = 'block';
  transferOpen = true;
  transferTo.textContent = platform;
  if(transfercancelled) return;
  simulateFileTransfer();
  simulateMainProgressBar();
}

function simulateMainProgressBar() {
  if(transfercancelled) return;

  let progress = 0;
  const interval = setInterval(() => {
    var totalPercent = percentComplete();
    if(transfercancelled) {
      clearInterval(interval);
      return;
    }
    if (progress >= 100) {
      progressBar.style.width = '150%';
      clearInterval(interval);
    } else {
      progress = (totalPercent / totalFileSize);
      progressBar.style.width = progress + '%';
      progressText.textContent = Math.round(progress) + '%';
    }
  }, 200);
}

function toggle(active, nextstatus, nonactive, currentstatus) {
  active.classList.replace('active', nextstatus);
  nonactive.classList.replace(currentstatus, 'active');
}

function toggledetails() {
  if (main.classList.contains('active')) 
    toggle(main, 'prev', second, 'next');
  else if (completed.classList.contains('active'))
    toggle(completed, 'next', main, 'prev');
  else toggle(second, 'next', main, 'prev');
}


function toggleplatforms() {
  if (main.classList.contains('active'))
    toggle(main, 'prev', completed, 'next');
  else if (second.classList.contains('active')) {
    toggle(second, 'prev', completed, 'next');
    setTimeout(() => {
      second.style.visibility = 'hidden';
      second.classList.replace('prev', 'next');
      setTimeout(() => {
        second.style.visibility = 'visible';
      }, 760);
    }, 750);
  }
}

function createTransferRow(file) {
  const newRow = document.createElement('tr');
  newRow.classList.add('transfer-file');
  newRow.innerHTML = `
    <td class="statusicon" style="border-bottom: 0;">
      <img src="assets/logo/loading.gif" alt="loading" style="width: 24px; height: 24px;">
    </td>
    <td class="filename">${truncateFileName(file.name)}</td>
    <td class="status">in progress</td>
    <td class="size">${formatFileSize(file.size)}</td>
    <td class="percent">0%</td>
  `;
  return newRow;
}

// File transfer detailed progress initialization
function simulateFileTransfer() {
  if(transfercancelled) return;
  totalFiles = uploadedFiles.length;
  totalFileSize = uploadedFiles.reduce((total, file) => total + file.size, 0);
  transferTotal.textContent = `${totalFiles} (${formatFileSize(totalFileSize)})`;
  remainFileSize = totalFileSize;
  transferFileDetails.innerHTML = '';

  const sortedFiles = uploadedFiles.slice().sort((a, b) => b.size - a.size);

  sortedFiles.forEach(file => {
    const newRow = createTransferRow(file);
    startSimulatePercent(newRow, file);
    transferFileDetails.appendChild(newRow);
  }); 
}

function startSimulatePercent(row, file) {
  if (transfercancelled) return;
  const fileSize = file.size;
  const intervalLength = (fileSize / 1024) / 80000;
  let progress = 0;
  let lastProgress = 0;
  updateRemainingFiles();
  const interval = setInterval(() => {
    if (transfercancelled) {
      clearInterval(interval);
      return;
    }
    if (progress >= 100) {
      completeTransferRow(row, file);
      clearInterval(interval);
      transferStatusCheck();
    } else {
      progress = Math.min(progress + Math.random() * 10, 100);
      updateProgress(row, progress);
      updateSpeed((progress - lastProgress) * fileSize / intervalLength);
      lastProgress = progress;
    }
  }, intervalLength * 1000);
}

function updateProgress(row, progress) {
  const percent = row.querySelector('.percent');
  percent.textContent = `${Math.round(progress)} %`;
  if (progress >= 100) {
    const status = row.querySelector('.status');
    const statusIcon = row.querySelector('.statusicon img');
    status.textContent = 'Complete';
    statusIcon.src = 'assets/logo/checked.png';
  }
}

function completeTransferRow(row, file) {
  const percent = row.querySelector('.percent');
  const status = row.querySelector('.status');
  const statusIcon = row.querySelector('.statusicon img');
  percent.textContent = '100 %';
  status.textContent = 'Complete';
  statusIcon.src = 'assets/logo/checked.png';
  transferredFiles++;
  remainFileSize -= file.size;
  updateRemainingFiles();
}

function updateSpeed(transferRate) {
  if(transfercancelled) return;
  transferRate = formatFileSize((transferRate/50)) + "/s";
  transferRateElement.innerHTML = transferRate;
}

function updateRemainingFiles() {
  if(transfercancelled) return;
  const remaining = totalFiles - transferredFiles;
  transferRemaining.innerHTML = `${remaining} (${formatFileSize(remainFileSize)})`;
}

function percentComplete() {
  let totalSizeCompleted = 0;

  document.querySelectorAll('.transfer-file').forEach(fileElement => {
    const percentElement = fileElement.querySelector('.percent').textContent;
    const percentComplete = parseInt(percentElement);
    const sizeElement = fileElement.querySelector('.size').textContent;
    const fileSize = getSizeInBytes(sizeElement);
  
    totalSizeCompleted += (fileSize * percentComplete);
  });

  return totalSizeCompleted;
}


function transferStatusCheck() {
  if(transfercancelled) return;
  if (totalFiles !== transferredFiles) return;
  transferRateElement.textContent = "0 MB/s";
  transferTimeElement.textContent = "0 minutes";
  totaldataUploaded = 0;
  transferredFiles = 0;
  completedPlatform++;
  updateTransferStatus();
  if (selectedPlatforms.length > 0) {
    progressText.textContent = '0%';
    progressBar.style.width = '0%';
    setTimeout(startNextTransfer, 500);
  } else {
    completeTransfer();
  }
}

function updateTransferStatus() {
  if(transfercancelled) return;
  const statusIcon = document.querySelector(`.transfer-platforms #statusicon${count}`);
  const status = document.querySelector(`.transfer-platforms #status${count}`);
  if (statusIcon && status) {
    statusIcon.innerHTML = `<img src="assets/logo/checked.png" alt="Checked" style="width: 24px; height: 24px;">`;
    status.textContent = 'Complete';
  }
  count ++;
}

function startNextTransfer() {
  if(transfercancelled) return;
  startTransfer(selectedPlatforms.shift());
}

function completeTransfer() {
  if(transfercancelled) return;
  skipVerificationSection = false;
  startVerificationTimer();
  transferstarted = false;
  clearCodeFields();
  setTimeout(() => {
    toggleplatforms();
    dots('hidden');
    headerMessage ('Transfer Complete');
    closeButton.style.display = 'block';
    cancelButton.style.display = 'none';
  }, 350);
  completedPlatform = 0;
}

function createPlatformTable() {
  transferPlatforms.innerHTML='';
  selectedPlatforms.forEach(platform => {
    count++;
    const newRow = document.createElement('tr');
    newRow.classList.add('transfer-platform');
    newRow.innerHTML = `
      <td class="statusicon" style="border-bottom: 0;" id="statusicon${count}">
        <img src="assets/logo/loading.gif" alt="loading" style="width: 24px; height: 24px;">
      </td>
      <td class="transfer-platform-name">${platform}</td>
      <td class="status" id="status${count}">in progress</td>
    `;
    transferPlatforms.appendChild(newRow);
  })
  count = 1;
}

function clearTransferVariables() {
  transferredFiles = 0;
  totalFileSize = 0;
  completedPlatform = 0;
  count = 0;
}

function closeTransfer() {
  closeModal(transferModal);
  closeButton.style.display = 'none';
  skipVerificationSection = false;
  transfercancelled = false;
  transferOpen = false;

  clearTimeout(verificationTimer);
  clearInterval(remainingTimeDisplayInterval);

  // Reset variables
  clearTransferVariables();

  setTimeout(() => {
    dots('visible');
    headerMessage ('Transfer in progress');
    transferFileDetails.innerHTML = '';
    transferPlatforms.innerHTML='';
    cancelButton.style.visibility = 'visible';
    progressBar.style.backgroundImage = 'linear-gradient(to right, #8AAEE0, #638ECB, #395886)';
    progressText.textContent = '0%';
    progressBar.style.width = '0%';
    if (!main.classList.contains('active')) {
      toggledetails();
    }  
    resetPlatformOptions();
    if(!(SectionS2.classList.contains('active'))) {
    clearAllFiles();
    backArrow.click();
    }
  }, 200);
}

function dots(visibility) {
  const dots = document.querySelectorAll('#transferModal .modal-content h3 .dot');
  dots.forEach(dot => dot.style.visibility = `${visibility}`);
}

function headerMessage (message) {
  const header = document.querySelector('.transfer-h3');
  header.textContent = message;
}


cancelButton.addEventListener('click', () => {
  const status = document.querySelectorAll('.status');
  const statusIcons = document.querySelectorAll('.statusicon img');

  transfercancelled = true; //Transfer cancelled
  startVerificationTimer();

  closeButton.style.display = 'block';
  cancelButton.style.visibility = 'hidden';

  // Reset variables
  clearTransferVariables();

  //Update UI
  dots('hidden');
  headerMessage ('Transfer Canceled');

  status.forEach(status =>{
    if(status.textContent === 'in progress') {
      status.style.color = '#d95b76';
      status.textContent = 'Cancelled';
    }
  })

  statusIcons.forEach(statusIcon => {
    if (statusIcon.src.endsWith('loading.gif')) {
      statusIcon.src = 'assets/logo/cancel.png';
    }
  });

  // Reset UI elements
  transferRateElement.textContent = "0 MB/s";
  transferTimeElement.textContent = "0 minutes";
  progressBar.style.backgroundImage = 'linear-gradient(to right, #cb498c,  #c84b73, #cf4c68, #d75562)';

  //table of transfer platforms
  document.querySelectorAll('.transfer-platforms .transfer-platform')
  .forEach(platform => {
      var platformName = platform.querySelector('.transfer-platform-name').textContent;
      var statusIcon = platform.querySelector('.statusicon img');
      if (platformName === transferTo.textContent && remainFileSize !== totalFileSize) {
          var platformStatus = platform.querySelector('.status');
          platformStatus.textContent = 'Partially Complete';
          platformStatus.style.color = 'orange';
          statusIcon.src = 'assets/logo/partial.png';
      }
  });

  setTimeout(() => {
  toggleplatforms();
  }, 400);

});


function getSizeInBytes(sizeString) {
  const trimmedSizeString = sizeString.trim();

  if (!trimmedSizeString) {
    throw new Error("Empty size string");
  }

  const match = trimmedSizeString.match(/(\d+(\.\d+)?)\s*(Bytes|KB|MB|GB)?/i);
  
  if (!match) {
    throw new Error("Invalid size string format");
  }

  const size = parseFloat(match[1]);
  const unit = (match[3] || "Bytes").toLowerCase();

  const conversionFactors = {
    bytes: 1,
    kb: 1024,
    mb: 1024 ** 2,
    gb: 1024 ** 3,
  };

  if (unit in conversionFactors) {
    return size * conversionFactors[unit];
  } else {
    throw new Error("Invalid size unit");
  }
}