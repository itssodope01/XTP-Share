async function computeEmbeddings(qaData) {
    const precomputedEmbeddings = [];

    const model = await use.load();

    for (const qa of qaData) {
        for (const question of qa.questions) {
            const questionNormalized = normalizeTextWithSynonyms(question);
            const embedding = await model.embed([questionNormalized]);
            precomputedEmbeddings.push({ embedding, qa });
        }
    }

    return precomputedEmbeddings;
}

onmessage = async function(event) {
    const qaData = event.data;
    const precomputedEmbeddings = await computeEmbeddings(qaData);
    postMessage(precomputedEmbeddings);
};
