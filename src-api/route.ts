import express, { Request, Response } from "express";
import cache from "./cacheClient";

const router = express();

router.get("", (req: Request, res: Response) => {
    console.log("scr-api/api 「GET」", new Date().toISOString());
    res.json({ message: "Hello World!" });
});



router.post("", async (req: Request, res: Response) => {
    console.log("scr-api/api 「POST」", new Date().toISOString());
    const body = await req.body;
    const userDataPath = body.userDataPath as string;

    cache.set("userDataPath", userDataPath);
    console.log("set userDataPath:", cache.get("userDataPath"));

    res.json({ message: "Hello World!" });
});

export default router;
