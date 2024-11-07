import express, { Request, Response } from "express";
import cache from "./cacheClient";
import path from "path";
import {
    Document,
    VectorStoreIndex,
    SummaryIndex,
    SentenceSplitter,
    Settings,
    Ollama,
    OllamaEmbedding,
    QueryEngineTool,
    RouterQueryEngine,
    LLMSingleSelector,
    TextNode,
    SimpleDirectoryReader,
} from "llamaindex";
import {
    INSERT_MIDDLEWARE,
    INSERT_NODE,
    INSET_VEC_EMBEDDING,
    middlewareDB,
    SELECT_FILE_NAME_DUPLICATES,
    SELECT_ID_TEXT,
    SELECT_MIDDLEWARE_ID,
    SELECT_VEC,
    sqliteDB,
    sqliteVEC,
    UPDATE_EMBEDDING,
} from "./db";
import { v4 as uuidv4 } from "uuid";
import { EmbData, LLMUrlConfig } from "@/store/ragStore";
import { getEmbClient } from "./clients";

const router = express();
let userDataPath = cache.has("userDataPath") ? cache.get("userDataPath") : "";

router.post("/split", async (req: Request, res: Response) => {
    console.log("src-api/api/rag/split 「POST」", new Date().toISOString());
    userDataPath = cache.has("userDataPath") ? cache.get("userDataPath") : "";
    const body = await req.body;
    const fileDir = body.fileDir;
    const sessionId = body.sessionId;
    const fileSessionDir = path.join(userDataPath as string, fileDir as string);
    // console.log("fileSessionDir", fileSessionDir);

    const reader = new SimpleDirectoryReader();
    const document = await reader.loadData({
        directoryPath: fileSessionDir,
    });
    const splitter = new SentenceSplitter({ chunkSize: 512 });
    const nodes = splitter.getNodesFromDocuments(document);
    // console.log("nodes:", nodes);
    console.log("nodes parsed", nodes.length);
    const dbClient = sqliteDB();

    // const insertedFileName = dbClient.prepare(SELECT_FILE_NAME_DUPLICATES);
    // const fileNames = insertedFileName.all([sessionId]);

    const fileNames = await dbClient.query(SELECT_FILE_NAME_DUPLICATES, [
        sessionId,
    ]);
    // nodes 写入数据库
    // const stmt = dbClient.prepare(INSERT_NODE);
    for (const node of nodes) {
        if (
            fileNames.rows.some(
                (file: any) => file.fileName === node.metadata.file_name
            )
        ) {
            console.log("continue", node.metadata.file_name);
            continue;
        }
        await dbClient.query(INSERT_NODE, [
            // node.id_,
            uuidv4(),
            sessionId,
            JSON.stringify(node.metadata),
            node.metadata.file_name,
            JSON.stringify(node.excludedEmbedMetadataKeys),
            JSON.stringify(node.excludedLlmMetadataKeys),
            JSON.stringify(node.relationships),
            JSON.stringify(node.embedding),
            node.text,
            node.textTemplate,
            node.metadataSeparator,
            node.startCharIdx,
            node.endCharIdx,
        ]);
    }
    console.log("nodes inserted");

    res.json({ success: true });
});

interface embSessionData {
    sessionId: string;
    data: EmbData[];
}
let embStack: embSessionData[] = [];
let embeddingIng = false;

router.post("/emb", async (req: Request, res: Response) => {
    console.log("src-api/api/rag/emb 「POST」", new Date().toISOString());

    const body = await req.body;
    const sessionId = body.sessionId;
    const { url, apiKey, model, embUrl, embApiKey, embModel } =
        body.llmUrlConfig as LLMUrlConfig;

    console.log("emb", body);

    const dbClient = sqliteDB();
    const dbVEC = sqliteVEC();
    // const middlewareDBClient = middlewareDB();

    // const stmt = dbClient.prepare(SELECT_ID_TEXT);
    // const dbData = stmt.all([sessionId]);

    const dbData = await dbClient.query(SELECT_ID_TEXT, [sessionId]);
    const embData = dbData.rows.map((item: any) => ({
        id: item.id,
        text: item.text_,
        embedding: item.embedding,
    }));

    const lengthText = embData.length;
    let finished = embData.filter((item) => item.embedding).length;

    // 如果有embStack中，没有sessionId，就push进去
    const index = embStack.findIndex((item) => item.sessionId === sessionId);
    if (index === -1) {
        embStack.push({ sessionId: sessionId, data: embData });
    } else {
        embStack[index].data = embData;
    }
    // 从embStack中取出sessionId对应的数据，进行embedding
    const sessionData = embStack.find((item) => item.sessionId === sessionId);

    if (embeddingIng === true) {
        res.status(200).json({ total: lengthText, finished });
    }

    const openaiClient = getEmbClient({
        newUrl: embUrl,
        newApiKey: embApiKey,
        newModel: embModel,
    });

    // console.log("sessionData", sessionData);

    for (const item of sessionData?.data!) {
        if (item.embedding) {
            console.log("embeddingIng3", embeddingIng, item.embedding);
            continue;
        }
        // console.log("embeddingIng2", embeddingIng);
        embeddingIng = true;
        // const itemEmbeded = middlewareDBClient
        //     .prepare(SELECT_MIDDLEWARE_ID)
        //     .get([item.id]);

        // console.log("itemEmbeded", itemEmbeded);
        const itemEmbeded = false;

        if (!itemEmbeded) {
            const text = item.text;
            console.log("openaiClient running", sessionId, item.id);

            const res = await openaiClient.embeddings.create({
                model: embModel,
                input: [text],
            });

            const embeddings = res.data[0].embedding.slice(0, 1024);
            // 如果embedding的长度不够1024，就补0
            if (embeddings.length < 1024) {
                embeddings.push(...Array(1024 - embeddings.length).fill(0));
            }
            await dbClient.query(UPDATE_EMBEDDING, [
                JSON.stringify(embeddings),
                item.id,
            ]);
            finished += 1;

            // const dbEmbedding = new Float32Array(embeddings);
            const dbEmbedding = JSON.stringify(embeddings);
            const vecId = item.id + "_vec_" + sessionId;

            await dbVEC.query(INSET_VEC_EMBEDDING, [vecId, dbEmbedding]);
            console.log("openaiClient done", sessionId, item.id);
        }
    }
    embeddingIng = false;

    // 清空embStack中的sessionId对应的数据
    const newStack = embStack.filter((item) => item.sessionId !== sessionId);
    embStack = newStack;

    const responseData = {
        total: lengthText,
        finished: finished,
    };
    res.status(200).json(responseData);
});

router.post("/emb_state", async (req: Request, res: Response) => {
    console.log("src-api/api/rag/emb_state 「POST」", new Date().toISOString());

    const body = await req.body;
    const sessionId = body.sessionId;
    let total = 0;
    let done = 0;
    try {
        if (embeddingIng) {
            const data = embStack.find((item) => item.sessionId === sessionId);
            total = data?.data.length as number;
            done = data?.data.filter((item) => item.embedding).length as number;
            console.log(
                "「POST--emb_state--/api/rag」: Embedding is in progress, please wait.",
                sessionId,
                total,
                done
            );
            res.status(200).json({
                total: total,
                finished: done,
                message: "Embedding is in progress, please wait.",
            });
        } else {
            const dbClient = sqliteDB();
            // const dbData = dbClient.prepare(SELECT_ID_TEXT).all([sessionId]);
            // const sql = 'SELECT * FROM nodes';
            // const dbData = dbClient.query(sql)
            const dbData = await dbClient.query(SELECT_ID_TEXT, [sessionId]);
            const embData = dbData.rows.map((item: any) => ({
                id: item.id,
                text: item.text_,
                embedding: item.embedding,
            }));
            total = embData.length;
            done = embData.filter((item) => item.embedding).length;
            console.log(
                "「POST--emb_state--/api/rag」: Embedding is finished.",
                sessionId
            );
            res.status(200).json({
                total: total,
                finished: done,
                message: "Embedding is finished.",
            });
        }
    } catch (error) {
        console.error("Error in emb_state", error);
        console.error(
            "「POST--emb_state--/api/rag」: Error in emb_state.",
            error
        );
        res.status(500).json({
            total: total,
            finished: done,
            message: `Error in emb_state. ${error}`,
        });
    }
});

router.post("/fileSearch", async (req: Request, res: Response) => {
    console.log(
        "src-api/api/file/fileSearch 「POST」",
        new Date().toISOString()
    );
    try {
        const body = await req.body;
        const sessionId = body.sessionId as string;
        const text = body.text as string;
        const llmUrlConfig = body.llmUrlConfig;
        const { embUrl, embApiKey, embModel } = llmUrlConfig;

        console.log(
            `fileSearch - sessionId: ${sessionId}, embUrl: ${embUrl}, embApiKey: ${embApiKey}, embModel: ${embModel}`
        );
        const embClient = getEmbClient({
            newUrl: embUrl,
            newApiKey: embApiKey,
            newModel: embModel,
        });

        const postEmbRes = await embClient.embeddings.create({
            model: embModel,
            input: [text],
        });

        const postEmb = postEmbRes.data[0].embedding.slice(0, 1024);
        // 如果不足1024，就补0
        if (postEmb.length < 1024) {
            postEmb.push(...Array(1024 - postEmb.length).fill(0));
        }

        const dbClient = sqliteDB();
        const dbVEC = sqliteVEC();
        const vecLikeId = `%${sessionId}%`;

        const queryRes = await dbVEC.query(SELECT_VEC, [
            JSON.stringify(postEmb),
            vecLikeId,
        ]);
        const queryResWithCleanId = queryRes.rows.map((item: any) => ({
            id: item.id.split("_vec_")[0],
            distance: item.distance,
        }));
        console.log("queryResWithCleanId", queryResWithCleanId);
        const ids = queryResWithCleanId.map((item) => item.id);

        // const SELECT_IDs_query = `SELECT id, text_ FROM nodes WHERE id IN $1;`;
        
        const SELECT_IDs_query = `SELECT id, text_ FROM nodes WHERE id = ANY($1::text[]);`;
        const queryText = await dbClient.query(SELECT_IDs_query, [ids]);
        // console.log("queryText", queryText);
        
        const searchRes = queryText.rows.map((item: any) => ({
            id: item.id,
            text: item.text_,
            distance:
                queryResWithCleanId.find((res) => res.id === item.id)
                    ?.distance ?? 999,
        }));
        searchRes.sort((a, b) => a.distance - b.distance);
        const searchList = searchRes.map((item) => item.text);
        if (searchList !== undefined) {
            console.log(`searchList ${searchList.length}`);
            res.json({ success: true, searchList });
        } else {
            res.json({ success: false, searchList: [] });
        }
    } catch (error) {
        console.error("Error in fileSearch", error);
        res.status(500).json({
            success: false,
            message: `Error in fileSearch ${(error as Error).message}--${(error as Error).stack}`,
        });
    }
});
export default router;
