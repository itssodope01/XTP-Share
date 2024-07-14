importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.11.0/dist/tf.min.js');
importScripts('https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder@1.3.3/dist/universal-sentence-encoder.min.js');
importScripts('qaData.js');

let model;
const CHUNK_SIZE = 10; // Process 10 questions at a time

onmessage = async function (e) {
    console.log('Worker received message:', e.data);
    if (e.data === 'loadModel') {
        try {
            model = await use.load();
            postMessage({ status: 'modelLoaded' });
            console.log('Model loaded successfully');
        } catch (error) {
            console.error('Error loading model:', error);
            postMessage({ status: 'error', error: error.message });
        }
    } else if (e.data === 'preComputeEmbeddings') {
        try {
            await processEmbeddingsInChunks();
        } catch (error) {
            console.error('Error precomputing embeddings:', error);
            postMessage({ status: 'error', error: error.message });
        }
    } else if (e.data.action === 'embed') {
        try {
            const inputEmbedding = await model.embed([e.data.text]);
            const flatEmbedding = inputEmbedding.arraySync()[0];
            postMessage({ status: 'embedding', embedding: flatEmbedding });
        } catch (error) {
            console.error('Error creating input embedding:', error);
            postMessage({ status: 'error', error: error.message });
        }
    }
};

async function processEmbeddingsInChunks() {
    const allQuestions = qaData.flatMap(qa => qa.questions);
    const totalChunks = Math.ceil(allQuestions.length / CHUNK_SIZE);

    let preComputedEmbeddings = null;

    try {
        // Attempt to load precomputed embeddings from JSON file
        const response = await fetch('preComputedEmbeddings.json');
        if (!response.ok) {
            throw new Error('Failed to fetch embeddings file');
        }
        preComputedEmbeddings = await response.json();
    } catch (error) {
        console.error('Error loading precomputed embeddings:', error);
        // Fallback to original method if file is not available or failed to load
        return processEmbeddingsOriginal();
    }

    // Process chunks with precomputed embeddings
    for (let i = 0; i < totalChunks; i++) {
        const startIdx = i * CHUNK_SIZE;
        const endIdx = Math.min((i + 1) * CHUNK_SIZE, allQuestions.length);
        const chunk = allQuestions.slice(startIdx, endIdx);

        const chunkEmbeddings = {};
        chunk.forEach(question => {
            const questionEmbedding = preComputedEmbeddings[question];
            if (questionEmbedding) {
                chunkEmbeddings[question] = questionEmbedding;
            } else {
                console.warn(`Missing pre-computed embedding for question: ${question}`);
            }
        });

        postMessage({
            status: 'chunkProcessed',
            data: chunkEmbeddings,
            progress: {
                current: i + 1,
                total: totalChunks
            }
        });
    }

    postMessage({ status: 'preComputeComplete' });
}

async function processEmbeddingsOriginal() {
    const allQuestions = qaData.flatMap(qa => qa.questions);
    const totalChunks = Math.ceil(allQuestions.length / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
        const startIdx = i * CHUNK_SIZE;
        const endIdx = Math.min((i + 1) * CHUNK_SIZE, allQuestions.length);
        const chunk = allQuestions.slice(startIdx, endIdx);

        const chunkEmbeddings = {};
        for (const question of chunk) {
            const questionNormalized = normalizeTextWithSynonyms(question);
            const questionEmbedding = await model.embed([questionNormalized]);
            chunkEmbeddings[question] = questionEmbedding.arraySync()[0];
        }

        postMessage({
            status: 'chunkProcessed',
            data: chunkEmbeddings,
            progress: {
                current: i + 1,
                total: totalChunks
            }
        });
    }

    postMessage({ status: 'preComputeComplete' });
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