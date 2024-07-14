// Step descriptions
var stepDescriptions = [
    "Download Mobile App: Download our mobile app and create an account with us. Link your Email or Storage Accounts through the app.This is a One-Time Process.",
    "Generate One-Time Code (OTP): Use the app to generate a unique 6 digits one-time Code. This code refreshes every 15 minuets. It is usable across all your linked accounts.",
    "Upload Your Files: Visit our website on the public device (desktop/laptop computer) and click 'Upload Files.' Select the files you want to send. or Drag folders (to compress them into .zip files) in the  file Drop area.",
    "Enter the One-Time Code: When prompted on the website, enter the one-time OTP generated from the app. This Code securely connects you to your linked accounts.",
    "Select Destination: Choose your preferred file storage system, such as Dropbox or OneDrive. You can even send files as Email. You'll receive confirmation once your files gets securely transferred."
];

//Function to generate steps based on device type
function generateSteps(deviceType) {
    const stepsContainer = document.querySelector(deviceType === 'mobile' ? '.steps' : '#stepsContent');

    for (let i = 0; i < stepDescriptions.length; i++) {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';
        const stepImageSrc = `assets/step_images/step${i + 1}.jpg`;

        if (deviceType === 'mobile') {
            stepDiv.innerHTML = `<img src="${stepImageSrc}" alt="Step ${i + 1}">
                                 <p><strong>${stepDescriptions[i].split(': ')[0]}:</strong> ${stepDescriptions[i].split(': ')[1]}</p>`;
        } else {
            const stepButton = document.createElement('button');
            stepButton.className = 'step-button';
            stepButton.dataset.step = i + 1;
            stepButton.textContent = i + 1;
            document.getElementById('stepButtons').appendChild(stepButton);

            stepDiv.innerHTML = `<div class="step-content">
                                    <div class="step-description">
                                        <p>${stepDescriptions[i]}</p>
                                    </div>
                                    <div class="step-image-container">
                                        <img src="${stepImageSrc}" alt="Step ${i + 1} Image">
                                    </div>
                                </div>`;
        }
        stepsContainer.appendChild(stepDiv);
    }
}