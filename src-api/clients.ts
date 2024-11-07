import OpenAI from "openai";

let url = "http://localhost:11434/v1";
let apiKey = "ollama";
let model = "llama3.1:8b";
let embUrl = "http://localhost:11434/v1";
let embApiKey = "ollama";
let embModel = "mxbai-embed-large:latest";
const timeout = 10000;

let completeClient = new OpenAI({
    baseURL: url,
    apiKey: apiKey,
    timeout,
});

let embClient = new OpenAI({
    baseURL: embUrl,
    apiKey: embApiKey,
    timeout,
});

function getCompleteClient({
    newUrl,
    newApiKey,
    newModel,
}: {
    newUrl: string;
    newApiKey: string;
    newModel: string;
}) {
    console.log(
        "getCompleteClient",
        url,
        newUrl,
        apiKey,
        newApiKey,
        model,
        newModel
    );
    if (newUrl !== url || newApiKey !== apiKey || newModel !== model) {
        url = newUrl;
        apiKey = newApiKey;
        model = newModel;
        if (url === "OPENAI") {
            completeClient = new OpenAI({
                apiKey,
                timeout,
            });
        } else {
            completeClient = new OpenAI({
                apiKey,
                baseURL: url,
                timeout,
            });
        }
    }
    return completeClient;
}

function getEmbClient({
    newUrl,
    newApiKey,
    newModel,
}: {
    newUrl: string;
    newApiKey: string;
    newModel: string;
}) {
    console.log(
        "getEmbClient",
        url,
        newUrl,
        apiKey,
        newApiKey,
        model,
        newModel
    );
    if (newUrl !== embUrl || newApiKey !== embApiKey || newModel !== embModel) {
        embUrl = newUrl;
        embApiKey = newApiKey;
        embModel = newModel;
        if (embUrl === "OPENAI") {
            embClient = new OpenAI({
                apiKey: embApiKey,
                timeout,
            });
        } else {
            embClient = new OpenAI({
                baseURL: embUrl,
                apiKey: embApiKey,
                timeout,
            });
        }
    }
    return embClient;
}

export { getCompleteClient, getEmbClient };
