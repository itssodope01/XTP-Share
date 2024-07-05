let model;
let followUpContainer;
let chatbox;
let userInput;
let sendButton;
let loadingIndicator;
let precomputedEmbeddings = [];

const responseCache = new Map();

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

async function precomputeEmbeddings() {
    const worker = new Worker('worker.js');
    worker.postMessage(qaData);

    worker.onmessage = function(event) {
        precomputedEmbeddings = event.data;
        hideLoadingIndicator();
        enableUserInput();
        worker.terminate();
    };
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
            normalizedInput = normalizedInput.replace(new RegExp(`\\b${synonym.toLowerCase()}\\b`, 'gi'), key);
        });
    });
    return normalizedInput;
}

async function findMostSimilarQuestion(input) {
    const inputNormalized = normalizeTextWithSynonyms(input);
    const inputEmbedding = await model.embed([inputNormalized]);
    let maxSimilarity = -1;
    let mostSimilarQA = null;
  
    for (const { embedding, qa } of precomputedEmbeddings) {
      if (inputEmbedding && embedding && inputEmbedding.shape && embedding.shape) {
        const similarity = await tf.matMul(inputEmbedding, embedding, false, true).data();
        if (similarity[0] > maxSimilarity) {
          maxSimilarity = similarity[0];
          mostSimilarQA = qa;
        }
      }
    }
  
    if (maxSimilarity > 0.7) {
      return { question: mostSimilarQA.questions[0], answer: mostSimilarQA.answer, follow_up: mostSimilarQA.follow_up };
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
    if (responseCache.has(input)) {
        return responseCache.get(input);
    }
    try {
        const mostSimilarAnswer = await findMostSimilarQuestion(input);

        if (mostSimilarAnswer.question) {
            responseCache.set(input, mostSimilarAnswer);
            return mostSimilarAnswer;
        } else if (mostSimilarAnswer.answer) {
            responseCache.set(input, mostSimilarAnswer);
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

        chatbox.innerHTML += `<p class="user-message"><strong>You:</strong> ${userMessage}</p>`;
        userInput.value = '';
        followUpContainer.innerHTML = '';
        chatbox.scrollTop = chatbox.scrollHeight;

        const loadingIndicatorHTML = '<p class="bot-message"><em><strong>Chatbot:</strong> <span class="typing-indicator"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span></em></p>';
        chatbox.innerHTML += loadingIndicatorHTML;

        const botResponse = await getBotResponse(userMessage);
        const formattedAnswer = botResponse.answer.replace(/\n/g, '<br>');

        chatbox.innerHTML = chatbox.innerHTML.replace(loadingIndicatorHTML, '');

        const botMessageElem = document.createElement('p');
        botMessageElem.classList.add('bot-message');
        botMessageElem.innerHTML = `<em><strong>Chatbot:</strong></em> `;
        chatbox.appendChild(botMessageElem);

        await typeText(botMessageElem, formattedAnswer);

        const previousSupportLink = document.querySelector('.support-link');
        if (previousSupportLink) {
            previousSupportLink.remove();
        }

        const supportLink = document.createElement('p');
        supportLink.classList.add('support-link');
        supportLink.innerHTML = '<span onclick="contactSupport()" style="cursor: pointer; font-size: 0.8rem; color: #838383;">Not satisfied with the answer? <span style="text-decoration: underline;" >Contact support</span></span>';
        chatbox.appendChild(supportLink);

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
        chatbox.scrollTop = chatbox.scrollHeight;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    element.innerHTML = `<em><strong>Chatbot:</strong></em> ${htmlText}`;
    chatbox.scrollTop = chatbox.scrollHeight;
}

function contactSupport() {
    console.log('Contact support clicked!');
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

});

window.addEventListener('load', async () => {
    await loadModel();
    await precomputeEmbeddings();
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