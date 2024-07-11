let followUpContainer;
let chatbox;
let userInput;
let sendButton;
let loadingIndicator;
let loadingPercent;
let preComputedEmbeddings = {};
let isReady = false;

const worker = new Worker('chatbot/precomputeWorker.js');

worker.onmessage = function (e) {
    if (e.data.status === 'modelLoaded') {
        worker.postMessage('preComputeEmbeddings');
    } else if (e.data.status === 'chunkProcessed') {
        Object.assign(preComputedEmbeddings, e.data.data);
        updateLoadingProgress(e.data.progress);
    } else if (e.data.status === 'preComputeComplete') {
        isReady = true;
        chatbox.innerHTML += '<p><em><strong>Chatbot:</strong> Hello! How can I help you today?</em></p>';
        displayInitialFollowUpQuestions();
        hideLoadingIndicator();
        enableUserInput();
    } else if (e.data.status === 'error') {
        chatbox.innerHTML += '<p><em>Chatbot: Oops! Something went wrong. Please try again later.</em></p>';
        hideLoadingIndicator();
    }
};

function updateLoadingProgress(progress) {
    const percentage = Math.round((progress.current / progress.total) * 100);
    loadingPercent.innerHTML = `${percentage}%`;
}

async function loadModel() {
    try {
        showLoadingIndicator();
        worker.postMessage('loadModel');
    } catch (error) {
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
    return text.replace(/(\d+)([a-zA-Z]+)/g, '$1 $2').toLowerCase();
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
    if (!isReady) {
        return { answer: "I'm sorry, the chatbot is still initializing. Please try again in a moment." };
    }

    const inputNormalized = normalizeTextWithSynonyms(input);
    let inputEmbedding;

    try {
        const response = await new Promise((resolve, reject) => {
            worker.onmessage = function (e) {
                if (e.data.status === 'embedding') {
                    resolve(e.data.embedding);
                } else if (e.data.status === 'error') {
                    reject(e.data.error);
                }
            };
            worker.postMessage({ action: 'embed', text: inputNormalized });
        });

        inputEmbedding = response; 
    } catch (error) {
        return { answer: "I'm sorry, an error occurred while processing your input. Please try again or contact support if the issue persists." };
    }

    let maxSimilarity = -1;
    let mostSimilarQuestion = '';
    let mostSimilarAnswer = '';
    let mostSimilarFollowUp = '';

    try {
        for (const qa of qaData) {
            for (const question of qa.questions) {
                const questionEmbedding = preComputedEmbeddings[question];

                if (!questionEmbedding) {
                    continue;
                }

                if (inputEmbedding && questionEmbedding) {
                    const flatInputEmbedding = Array.isArray(inputEmbedding[0]) ? inputEmbedding[0] : inputEmbedding;
                    const flatQuestionEmbedding = Array.isArray(questionEmbedding[0]) ? questionEmbedding[0] : questionEmbedding;

                    const similarity = tf.tidy(() => {
                        const a = tf.tensor1d(flatInputEmbedding);
                        const b = tf.tensor1d(flatQuestionEmbedding);
                        return tf.sum(tf.mul(a, b)).dataSync()[0];
                    });

                    if (similarity > maxSimilarity) {
                        maxSimilarity = similarity;
                        mostSimilarQuestion = question;
                        mostSimilarAnswer = qa.answer;
                        mostSimilarFollowUp = qa.follow_up;
                    }
                }
            }
        }

        if (maxSimilarity > 0.7) {
            return { question: mostSimilarQuestion, answer: mostSimilarAnswer, follow_up: mostSimilarFollowUp };
        } else {
            return findMostCommonTermsQuestion(inputNormalized);
        }
    } catch (error) {
        return { answer: "I'm sorry, an error occurred while processing your request. Please try again or contact support if the issue persists." };
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
        return { answer: "I'm sorry, an error occurred while processing your request. Please try again later." };
    }
}

// tailored reply patterns
const rsPattern = "We do not allow transfer/sharing files with these extensions through email due to security reasons: <br><br> 'ade', 'adp', 'apk', 'appx', 'appxbundle', 'bat', 'cab', 'chm', 'cmd', 'com', 'cpl', 'diagcab', 'diagcfg','diagpack', 'dll', 'dmg', 'ex', 'ex_', 'exe', 'hta', 'img', 'ins', 'iso', 'isp', 'jar', 'jnlp', 'js', 'jse', 'lib', 'lnk', 'mde', 'mjs', 'msc', 'msi', 'msix', 'msixbundle', 'msp', 'mst', 'nsh', 'pif', 'ps1', 'scr', 'sct', 'shb', 'sys', 'vb', 'vbe', 'vbs', 'vhd', 'vxd', 'wsc', 'wsf', 'wsh', 'xll', 'appref-ms', 'bas', 'bgi', 'cer', 'csh', 'der', 'fxp', 'gadget', 'grp', 'hlp', 'hpj', 'htc', 'inf', 'its', 'mad', 'maf', 'mag', 'mam', 'maq', 'mar', 'mas', 'mat', 'mau', 'mav', 'maw', 'mcf', 'mda', 'mdb', 'mdt', 'mdw', 'mdz', 'msc', 'msh', 'msh1', 'msh2', 'mshxml', 'msh1xml', 'msh2xml', 'msu', 'ops', 'osd', 'pcd', 'plg', 'prf', 'prg', 'printerexport', 'pst', 'pyc', 'pyo', 'pyw', 'pyz', 'pyzw', 'reg', 'scf', 'sct', 'shs', 'theme', 'vbp', 'vsmacros', 'vsw', 'webpnp', 'website', 'ws', 'xbap'<br><br> But you can transfer any other file types without any problem. <br><br> There are no restricted file types for Google Drive or OneDrive, but if it is a business/organization account, some file types may be blocked on your organization’s site. The list of blocked files will vary depending on your administrator.";
let ynPattern = "\"<extension>\" files are blocked in email due to security.<br>But there are no restricted file types for Google Drive or OneDrive (unless it is a business account.)";

const modePattern = "<Dark/Light> mode turned on.";

const historyPattern = "Transfer History Pattern";

const linkedPattern = "Linked Accounts Pattern";

async function handleUserInput(message) {
    try {
        const userMessage = message || userInput.value.trim();
        if (userMessage === '') return;

        chatbox.innerHTML += `<p class="user-message"><strong>You:</strong> ${userMessage}</p>`;
        userInput.value = '';
        followUpContainer.innerHTML = '';
        chatbox.scrollTop = chatbox.scrollHeight;

        const questions = splitIntoQuestions(userMessage);
        const botResponses = [];
        let allFollowUps = [];
        let displayedAnswers = new Set(); 
        let displayedFollowUps = new Set(); 

        const loadingIndicatorHTML = '<p class="bot-message"><em><strong>Chatbot:</strong> <span class="typing-indicator"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span></em></p>';
        chatbox.innerHTML += loadingIndicatorHTML;

        for (let i = 0; i < questions.length; i++) {
            const botResponse = await getBotResponse(questions[i]);
            botResponses.push(botResponse);

            if (Array.isArray(botResponse.follow_up) && botResponse.follow_up.length > 0) {
                allFollowUps = allFollowUps.concat(botResponse.follow_up);
            }
        }

        chatbox.innerHTML = chatbox.innerHTML.replace(loadingIndicatorHTML, '');

        const botMessageElem = document.createElement('p');
        botMessageElem.classList.add('bot-message');
        chatbox.appendChild(botMessageElem);

        let combinedAnswer = '';
        botResponses.forEach((botResponse, index) => {
            const formattedAnswer = botResponse.answer.replace(/\n/g, '<br>');

            if (formattedAnswer === rsPattern) {
                const foundExtensions = restrictedFileTypes.filter(ext => {
                    const regex = new RegExp(`\\b${ext}\\b`, 'i');
                    return regex.test(userMessage);
                });

                if (foundExtensions.length > 0) {
                    const uniqueExtensions = [...new Set(foundExtensions)];
                    const extensionsStr = uniqueExtensions.join(', ');
                    combinedAnswer += ynPattern.replace('<extension>', extensionsStr);
                } else {
                    combinedAnswer += formattedAnswer;
                }
            } else if (formattedAnswer === modePattern) {
                const darkModeRequested = /dark|night/i.test(userMessage);
                const lightModeRequested = /light|day/i.test(userMessage);
                const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

                if (darkModeRequested && currentTheme === 'dark') {
                    combinedAnswer += "The dark mode is already turned on.";
                } else if (lightModeRequested && currentTheme === 'light') {
                    combinedAnswer += "The light mode is already turned on.";
                } else if (darkModeRequested) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    localStorage.setItem('theme', 'dark');
                    darkModeToggle.checked = true;
                    combinedAnswer += "Dark mode turned on.";
                } else if (lightModeRequested) {
                    document.documentElement.setAttribute('data-theme', 'light');
                    localStorage.setItem('theme', 'light');
                    darkModeToggle.checked = false;
                    combinedAnswer += "Light mode turned on.";
                } else {
                    darkModeToggle.click();
                    if (currentTheme === 'dark')
                        combinedAnswer += "Light mode turned on.";
                    else
                        combinedAnswer += "Dark mode turned on.";
                }
            } else if (formattedAnswer === historyPattern) {
                if (skipVerificationSection) {
                    transferHistoryLink.click();
                    combinedAnswer += "Check Transfer History.";
                } else {
                    combinedAnswer += `Please Login to see your Transfer history.`;
                }
            } else if (formattedAnswer === linkedPattern) {
                if (!skipVerificationSection) {
                    combinedAnswer += "Please Login to see your connected accounts."
                } else {
                    let accounts = `<br>These are accounts that you have currently connected with us: <br><br>`;
                    const defaultPlatform = platforms.find(p => p.name === "Email");
                    let html = '';
                
                    userAccounts.forEach(({ platform, account }) => {
                        const platformData = platforms.find(p => p.name === platform) || defaultPlatform;
                
                        html += `
                            <a class="connected-account" style="--hover-color: ${platformData.hover_color}">
                                <div class="icon-container">
                                    <img src="${baseURL}${platformData.src}" alt="${platformData.name} Logo">
                                </div>
                                <span class="account-data">
                                    <span>${account}</span>
                                    <span class="platformName">${platformData.name}</span>
                                </span>
                            </a>
                        `;
                    });

                    accounts += html;
                    combinedAnswer += accounts;


                }
            }else {
                if (!displayedAnswers.has(formattedAnswer)) {
                    combinedAnswer += (combinedAnswer.length > 0 ? '<br><br>' : '') + formattedAnswer;
                    displayedAnswers.add(formattedAnswer);
                }
            }
        });

        await typeText(botMessageElem, combinedAnswer);

        const previousSupportLink = document.querySelector('.support-link');
        if (previousSupportLink) {
            previousSupportLink.remove();
        }
        
        const supportLink = document.createElement('p');
        supportLink.classList.add('support-link');
        supportLink.innerHTML = '<span onclick="contactSupport()" style=" font-size: 0.8rem; color: #838383;">Not satisfied with the answer? <span style="text-decoration: underline; cursor: pointer;" >Contact support</span></span>';
        chatbox.appendChild(supportLink);

        const uniqueFollowUps = Array.from(new Set(allFollowUps));
        const followUpsToShow = selectUniqueRandomFollowUps(uniqueFollowUps, 4, displayedFollowUps);

        followUpsToShow.forEach(followUpQuestion => {
            const followUpBtn = document.createElement('button');
            followUpBtn.innerText = followUpQuestion;
            followUpBtn.className = 'follow-up-btn';
            followUpBtn.onclick = () => handleUserInput(followUpQuestion);
            followUpContainer.appendChild(followUpBtn);
            displayedFollowUps.add(followUpQuestion);
        });

        chatbox.scrollTop = chatbox.scrollHeight;
    } catch (error) { 
        console.error(error);
    }
}

function chatBotHistoryCheck() {
    chatContainer.style.display = 'none';
    chatIcon.style.visibility = 'visible';
    const codeDiv = document.getElementById('botHistoryCode');
    const code = codeDiv.value;
    if (code.length === 6) {
        getTransferHistory(code);
        transferHistoryLink.click();   
    } else {
        alert("Please enter a valid 6-digit code.");
    }
    codeDiv.value = '';
}

function selectUniqueRandomFollowUps(followUps, count, displayedFollowUps) {
    const uniqueFollowUps = Array.from(new Set(followUps)); 
    const shuffledFollowUps = shuffleArray(uniqueFollowUps);

    const selectedFollowUps = [];
    let i = 0;

    while (selectedFollowUps.length < count && i < shuffledFollowUps.length) {
        const followUp = shuffledFollowUps[i];
        if (!displayedFollowUps.has(followUp)) {
            selectedFollowUps.push(followUp);
        }
        i++;
    }

    return selectedFollowUps.slice(0, count); 
}

function shuffleArray(array) {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
}

function splitIntoQuestions(input) {
    const questionRegex = /[?.]\s*(?=\w)|\b(?:how|what|which|when|where|who|why)\b/g;

    let questions = [];
    let start = 0;

    input.replace(questionRegex, (match, offset) => {
        if (match.match(/^\b(?:how|what|which|when|where|who|why)\b/)) {
            questions.push(input.slice(start, offset).trim());
            start = offset;
        }
        else {
            questions.push(input.slice(start, offset + match.length).trim());
            start = offset + match.length;
        }
    });

    questions.push(input.slice(start).trim());
    return questions.filter(question => question.length > 0);
}

async function appendBotResponse(answer) {
    const botMessageElem = document.querySelector('.bot-message:last-child');
    await typeText(botMessageElem, `<br>${answer}`);
}

async function typeText(element, htmlText, delay = 50) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlText;
    const nodes = [...tempDiv.childNodes];

    let currentHTML = '';

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (node.nodeType === Node.TEXT_NODE) {
            const words = node.textContent.split(' ');

            for (let j = 0; j < words.length; j++) {
                currentHTML += words[j] + ' ';
                element.innerHTML = `<em><strong>Chatbot:</strong></em> ${currentHTML}`;
                chatbox.scrollTop = chatbox.scrollHeight;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            currentHTML += node.outerHTML;
            element.innerHTML = `<em><strong>Chatbot:</strong></em> ${currentHTML}`;
            chatbox.scrollTop = chatbox.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    element.innerHTML = `<em><strong>Chatbot:</strong></em> ${htmlText}`;
    chatbox.scrollTop = chatbox.scrollHeight;
}

function contactSupport() {
    // Contact support logic
}

document.addEventListener('DOMContentLoaded', async function () {
    followUpContainer = document.getElementById('followUpContainer');
    chatbox = document.getElementById('chatbox');
    userInput = document.getElementById('userInput');
    sendButton = document.getElementById('sendButton');
    loadingIndicator = document.getElementById('loadingIndicator');
    loadingPercent = document.getElementById('loading-percent');

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
    loadingPercent.innerHTML = '0%';
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