let model;
let followUpContainer;
let chatbox;
let userInput;
let sendButton;
let loadingIndicator;

const synonymDict = {
    "mobile app": ["app", "mobile application", "XTP Share App", "XTP App"],
    "website": ["web platform", "web app", "site"],
    "file transfer": ["file sending", "file transmission"],
    "OneDrive": ["onedrive", "one drive", "Onedrive", "one-Drive"],
    "GoogleDrive": ["google drive", "Google Drive", "google-drive"],
    "File": ["files"],
    "OTC" : ["One Time Code", "One-Time-Code", "Code", "One-Time Code"],
    "user" : ["users", "I"],
    "Cloud Storage" : ["Google Drive", "One Drive", "Cloud Service", "Cloud services"],
    "Email" : ["Gmail", "Outlook"],
    "Google Drive" : ["Cloud Storage", "google-drive"],
    "One Drive" : ["Cloud Storage", "one-drive"],
    "Unlink" : ["unlinking", "remove"],
    "their" : ["my"],
    "validity" : ["expiration"],
    "XTP account" : ["account"],
    "Send" : ["transfer"],
    "Deactivate" : ["remove", "delete"],
    "System" : ["Software"]
};

async function loadModel() {
    try {
        model = await use.load();
        chatbox.innerHTML += '<p><em><strong>Chatbot:</strong> Hello! How can I help you today?</em></p>';
        displayInitialFollowUpQuestions();
        hideLoadingIndicator();
        enableUserInput();
    } catch (error) {
        console.error('Failed to load model:', error);
        chatbox.innerHTML += '<p><em>Chatbot: Oops! Something went wrong while loading the chatbot. Please try again later.</em></p>';
        hideLoadingIndicator();
    }
}

function displayInitialFollowUpQuestions() {
    const initialQuestions = [
        "What is XTP Share, how does it work?",
        "How to transfer files using XTP Share?",
        "Upload files to Google Drive/OneDrive without login?"
    ];

    initialQuestions.forEach(question => {
        const followUpBtn = document.createElement('button');
        followUpBtn.innerText = question;
        followUpBtn.className = 'follow-up-btn';
        followUpBtn.onclick = () => handleUserInput(question);
        followUpContainer.appendChild(followUpBtn);
    });
}

function normalizeText(text) {
    return text.toLowerCase().replace(/[^\w\s]/gi, '');
}

function normalizeTextWithSynonyms(input) {
    let normalizedInput = normalizeText(input);
    Object.keys(synonymDict).forEach(key => {
        const synonyms = synonymDict[key];
        synonyms.forEach(synonym => {
            normalizedInput = normalizedInput.replace(new RegExp(`\\b${synonym}\\b`, 'gi'), key);
        });
    });
    return normalizedInput;
}

async function findMostSimilarQuestion(input) {
    const inputNormalized = normalizeTextWithSynonyms(input);
    const inputEmbedding = await model.embed([inputNormalized]);

    let maxSimilarity = -1;
    let mostSimilarQuestion = '';
    let mostSimilarAnswer = '';
    let mostSimilarFollowUp = '';

    for (const qa of qaData) {
        for (const question of qa.questions) {
            const questionNormalized = normalizeTextWithSynonyms(question);
            const questionEmbedding = await model.embed([questionNormalized]);

            if (inputEmbedding && questionEmbedding && inputEmbedding.shape && questionEmbedding.shape) {
                const similarity = await tf.matMul(inputEmbedding, questionEmbedding, false, true).data();
                if (similarity[0] > maxSimilarity) {
                    maxSimilarity = similarity[0];
                    mostSimilarQuestion = question;
                    mostSimilarAnswer = qa.answer;
                    mostSimilarFollowUp = qa.follow_up;
                }
            } else {
                console.warn('Invalid embeddings detected:', inputEmbedding, questionEmbedding);
            }
        }
    }

    if (maxSimilarity > 0.7) {
        return { question: mostSimilarQuestion, answer: mostSimilarAnswer, follow_up: mostSimilarFollowUp };
    } else {
        return findMostCommonTermsQuestion(inputNormalized);
    }
}

function findMostCommonTermsQuestion(input) {
    const inputTerms = input.split(/\W+/).filter(term => term !== '');
    let maxCommonTerms = -1;
    let mostCommonTermsAnswer = '';
    let mostCommonTermsFollowUp = '';

    for (const qa of qaData) {
        const allText = [...qa.questions, qa.answer].join(' ');
        const textTerms = allText.split(/\W+/).filter(term => term !== '');
        const commonTerms = inputTerms.filter(term => textTerms.includes(term)).length;

        if (commonTerms > maxCommonTerms) {
            maxCommonTerms = commonTerms;
            mostCommonTermsAnswer = qa.answer;
            mostCommonTermsFollowUp = qa.follow_up;
        }
    }

    return mostCommonTermsAnswer ? { answer: mostCommonTermsAnswer, follow_up: mostCommonTermsFollowUp } : { answer: "I'm sorry, I don't have specific information about that. Can you please rephrase your question or ask about a different aspect of the XTP Share Platform?" };
}

async function getBotResponse(input) {
    try {
        const mostSimilarAnswer = await findMostSimilarQuestion(input);

        if (mostSimilarAnswer.question) {
            return mostSimilarAnswer;
        } else if (mostSimilarAnswer.answer) {
            return mostSimilarAnswer;
        } else {
            return { answer: "I'm sorry, I don't have specific information about that. Can you please rephrase your question or ask about a different aspect of the XTP Share Platform?" };
        }
    } catch (error) {
        console.error('Error getting bot response:', error);
        return { answer: "I'm sorry, an error occurred while processing your request. Please try again later." };
    }
}

async function handleUserInput(message) {
    try {
        const userMessage = message || userInput.value.trim();
        if (userMessage === '') return;

        chatbox.innerHTML += `<p class="user-message"><content><strong>You:</strong> ${userMessage}</content></p>`;
        userInput.value = '';
        followUpContainer.innerHTML = '';
        chatbox.scrollTop = chatbox.scrollHeight;  // Adjust scroll position

        const loadingIndicatorHTML = '<p class="bot-message"><em><strong>Chatbot:</strong> <span class="typing-indicator"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span></em></p>';
        chatbox.innerHTML += loadingIndicatorHTML;

        const botResponse = await getBotResponse(userMessage);
        const formattedAnswer = botResponse.answer.replace(/\n/g, '<br>');

        // Remove the loading indicator
        chatbox.innerHTML = chatbox.innerHTML.replace(loadingIndicatorHTML, '');

        // Create a new paragraph element for the bot's message
        const botMessageElem = document.createElement('p');
        botMessageElem.classList.add('bot-message');
        botMessageElem.innerHTML = '<em><strong>Chatbot:</strong></em> ';
        chatbox.appendChild(botMessageElem);

        // Type the text word by word
        await typeText(botMessageElem, formattedAnswer);

        if (Array.isArray(botResponse.follow_up) && botResponse.follow_up.length > 0) {
            botResponse.follow_up.forEach(followUpQuestion => {
                const followUpBtn = document.createElement('button');
                followUpBtn.innerText = followUpQuestion;
                followUpBtn.className = 'follow-up-btn';
                followUpBtn.onclick = () => handleUserInput(followUpQuestion);
                followUpContainer.appendChild(followUpBtn);
            });
        }

        chatbox.scrollTop = chatbox.scrollHeight;
    } catch (error) {
        console.error('Error handling user input:', error);
    }
}

async function typeText(element, htmlText, delay = 50) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;
    const words = tempDiv.textContent.split(' ');
    let currentHTML = '';

    for (let i = 0; i < words.length; i++) {
        currentHTML += words[i] + ' ';
        element.innerHTML = `<em><strong>Chatbot:</strong></em> ${currentHTML}`;
        chatbox.scrollTop = chatbox.scrollHeight;  // Adjust scroll position
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    // After finishing the word by word typing, set the full HTML
    element.innerHTML = `<em><strong>Chatbot:</strong></em> ${htmlText}`;
    chatbox.scrollTop = chatbox.scrollHeight;  // Final scroll adjustment
}



document.addEventListener('DOMContentLoaded', async function () {
    followUpContainer = document.getElementById('followUpContainer');
    chatbox = document.getElementById('chatbox');
    userInput = document.getElementById('userInput');
    sendButton = document.getElementById('sendButton');
    loadingIndicator = document.getElementById('loadingIndicator');

    const chatIcon = document.getElementById('chatIcon');
    const chatContainer = document.getElementById('chatContainer');

    chatIcon.addEventListener('click', () => {
        chatContainer.style.display = 'block';
        chatIcon.style.visibility = 'hidden';
    });

    document.addEventListener('mousedown', (event) => {
        if (!chatContainer.contains(event.target)) {
            chatContainer.style.display = 'none';
            chatIcon.style.visibility = 'visible';
        }
    });

    sendButton.addEventListener('click', () => handleUserInput());
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserInput();
    });

    showLoadingIndicator();

    await loadModel();
});

function showLoadingIndicator() {
    loadingIndicator.style.display = 'block';
}

function hideLoadingIndicator() {
    loadingIndicator.style.display = 'none';
}

function enableUserInput() {
    const chatInput = document.querySelector('.chat-input');
    chatInput.style.visibility = 'visible';
    userInput.disabled = false;
    sendButton.disabled = false;
}