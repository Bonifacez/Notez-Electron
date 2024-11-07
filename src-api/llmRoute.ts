import express, { Request, Response } from "express";
import OpenAI from "openai";
import { LLMUrlConfig } from "@/store/ragStore";
import PROMPTS from "./prompts";
import { getCompleteClient } from "./clients";

const router = express();

router.post("", async (req: Request, res: Response) => {
    console.log("src-api/api/llm 「POST」", new Date().toISOString());
    const body = await req.body;
    const { url, apiKey, model, embUrl, embApiKey, embModel } = body;
    console.log("body", body);
    try {
        if (
            url == null ||
            apiKey == null ||
            model == null ||
            embUrl == null ||
            embApiKey == null ||
            embModel == null
        ) {
            res.status(400).json({ error: "Missing parameters" });
        }
        const llmClient = getCompleteClient({
            newUrl: url,
            newApiKey: apiKey,
            newModel: model,
        });

        let chatSuccess = false;
        let chatError = null;
        try {
            const chatResponse = await llmClient.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: "user",
                        content:
                            "This is a test, please respond「SUCCESS」, only 「SUCCESS」",
                    },
                ],
                max_tokens: 100,
            });
            chatSuccess = chatResponse.choices[0].message.content === "SUCCESS";
        } catch (error) {
            chatError = error;
        }

        const embClient = getCompleteClient({
            newUrl: embUrl,
            newApiKey: embApiKey,
            newModel: embModel,
        });

        let embSuccess = false;
        let embError = null;
        try {
            const embResponse = await embClient.embeddings.create({
                model: embModel,
                input: ["Hello, world"],
            });
            embSuccess =
                embResponse.data.length > 0 &&
                embResponse.data[0].embedding.length > 0;
        } catch (error) {
            embError = error;
        }

        const response = {
            chatModel: {
                success: chatSuccess,
                error: chatError,
            },
            embModel: {
                success: embSuccess,
                error: embError,
            },
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error });
    } finally {
        res.end();
    }
});

router.post("/base", async (req: Request, res: Response) => {
    console.log("src-api/api/llm/base 「POST」", new Date().toISOString());
    // res.json({ message: "Hello World!" });
    // 设置响应头，告诉客户端这是一个流式响应
    const body = await req.body;
    console.log("/api/llm/base", body);
    const messages = body.messages;
    const aiSearch = body.aiSearch as string[];
    const { url, apiKey, model, embUrl, embApiKey, embModel } =
        body.llmUrlConfig as LLMUrlConfig;
    const llmClient = getCompleteClient({
        newUrl: url,
        newApiKey: apiKey,
        newModel: model,
    });

    let prePrompt = [{ role: "system", content: PROMPTS["base"] }];
    if (aiSearch.length > 0) {
        prePrompt = prePrompt.concat([
            {
                role: "system",
                content: PROMPTS["withAISearch"].replace(
                    "{{aiSearch}}",
                    aiSearch.join(" ||| ")
                ),
            },
        ]);
    }
    const messagesWithPrompt = prePrompt.concat(messages) as [];

    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Transfer-Encoding", "chunked");

    try {
        // const stream = await streamResponse(messagesWithPrompt);

        const stream = await llmClient.chat.completions.create({
            model: model,
            messages: messagesWithPrompt,
            stream: true,
        });

        // 处理流式数据并发送给客户端
        for await (const chunk of stream) {
            if (
                chunk.choices &&
                chunk.choices[0] &&
                chunk.choices[0].delta &&
                chunk.choices[0].delta.content
            ) {
                res.write(chunk.choices[0].delta.content);
            }
        }

        // 结束响应
        res.end();
    } catch (error) {
        console.error("Error streaming response:", error);
        res.status(500).end("Internal Server Error");
    }
});

export default router;
