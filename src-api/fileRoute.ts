import fs from "fs";
import { writeFile, mkdir } from "fs/promises";
import express, { Request, Response } from "express";
import multer from "multer";
import cache from "./cacheClient";
import path from "path";
import { DELETE_NODE, sqliteDB, sqliteVEC } from "./db";
const router = express();

let userDataPath = cache.has("userDataPath") ? cache.get("userDataPath") : "";

const upload = multer({ dest: userDataPath as string });

router.post(
    "/upload",
    upload.array("files"),
    async (req: Request, res: Response) => {
        console.log(
            "src-api/api/file/upload 「POST」",
            new Date().toISOString()
        );
        userDataPath = cache.has("userDataPath")
            ? cache.get("userDataPath")
            : "";
        const files = req.files as Express.Multer.File[];
        const sessionId = req.body.sessionId;

        // console.log("files", files);
        // console.log("sessionId", sessionId);
        // files [
        //     {
        //       fieldname: 'files',
        //       originalname: 'spacex.txt',
        //       encoding: '7bit',
        //       mimetype: 'text/plain',
        //       buffer: <Buffer e5 a4 aa e7 a9 ba e6 8e a2 e7 b4 a2 e6 8a 80 e6 9c af e5 85 ac e5 8f b8 ef bc 88 e8 8b b1 e8 af ad ef bc 9a 53 70 61 63 65 20 45 78 70 6c 6f 72 61 74 ... 37859 more bytes>,
        //       size: 37909
        //     }
        //   ]
        //   sessionId oYkAGZ9KyN_t

        console.log(`Uploading ${files.length} files to session ${sessionId}`);

        if (!files || files.length === 0) {
            res.status(400).json({
                success: false,
                message: "Please choose any file.",
            });
        }

        if (!sessionId) {
            res.status(400).json({
                success: false,
                message: "Session ID is required.",
            });
        }

        const sessionDir = path.join(
            userDataPath as string,
            "uploads",
            sessionId
        );
        console.log("sessionDir", sessionDir);

        try {
            await mkdir(sessionDir, { recursive: true });
            const uploadResults = await Promise.all(
                files.map(async (file) => {
                    const buffer = file.buffer;
                    const filePath = path.join(sessionDir, file.originalname);
                    await writeFile(filePath, buffer);

                    return { name: file.originalname, size: file.size };
                })
            );
            res.json({ success: true, files: uploadResults });
        } catch (error) {
            console.error("Upload error:", error);
            res.status(500).json({
                success: false,
                message: "An error occurred during upload.",
            });
        }
    }
);

router.post("/delete", async (req: Request, res: Response) => {
    console.log("src-api/api/file/delete 「POST」", new Date().toISOString());
    const body = await req.body;
    console.log("delete file", body);
    const filePath = body.filePath as string;
    const sessionId = body.sessionId as string;

    userDataPath = cache.has("userDataPath") ? cache.get("userDataPath") : "";
    const fileAbsPath = path.join(userDataPath as string, filePath);
    console.log("fileAbsPath", fileAbsPath);

    // 删除文件
    try {
        fs.unlinkSync(fileAbsPath);
        console.log("Deleted file:", fileAbsPath);
    } catch (error) {
        console.error("Delete file error:", error);
        res.status(500).json({
            success: false,
            message: `An error occurred during delete file: ${JSON.stringify(
                error
            )}`,
        });
    }
    // 删除db中的记录
    const dbClient = sqliteDB();
    await dbClient.query(DELETE_NODE, [sessionId, filePath]);
    console.log("Deleted file from db:", filePath);

    res.json({ success: true });
});

function deleteFolderRecursive(folderPath: string) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file, index) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // 递归删除子文件夹
                deleteFolderRecursive(curPath);
            } else {
                // 删除文件
                fs.unlinkSync(curPath);
            }
        });
        // 删除空文件夹
        fs.rmdirSync(folderPath);
        console.log(`Deleted folder: ${folderPath}`);
    }
}

router.post("/deleteSession", async (req: Request, res: Response) => {
    console.log(
        "src-api/api/file/deleteSession 「POST」",
        new Date().toISOString()
    );

    const body = await req.body;
    console.log("delete session", body);
    const sessionId = body.sessionId as string;
    userDataPath = cache.has("userDataPath") ? cache.get("userDataPath") : "";

    const sessionDir = path.join(userDataPath as string, "uploads", sessionId);
    console.log("sessionDir", sessionDir);

    deleteFolderRecursive(sessionDir);

    res.json({ success: true });
});

export default router;
