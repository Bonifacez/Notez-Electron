import express, { Request, Response } from "express";
import cache from "./cacheClient";
import { zustandDB } from "./db";

const router = express();

const db = zustandDB();

router.get("/get", async (req: Request, res: Response) => {
    const { name } = req.query;
    console.log(
        `src-api/api/zustand/get 「GET」- ${name}`,
        new Date().toISOString()
    );

    try {
        const dbRes = await db.query(
            `SELECT value FROM zustand_storage WHERE name = '${name?.toString()}'`
        );
        const returnRes: { value: string } | null =
            dbRes.rows.length > 0 ? (dbRes.rows[0] as { value: string }) : null;
        if (returnRes) {
            const value = JSON.parse(returnRes.value);
            res.status(200).json({
                value,
            });
        } else {
            res.status(200).json({
                value: null,
            });
        }
    } catch (error) {
        console.error("Error getting data:", error);
        res.status(500).send((error as Error).message);
    }
});

router.post("/set", async (req: Request, res: Response) => {
    const { name, value } = req.body;
    console.log("src-api/api/zustand/set 「POST」", new Date().toISOString());
    // console.log(
    //     `src-api/api/zustand/set 「POST」- ${name}`,
    //     new Date().toISOString()
    // );
    // console.log("「POST」 - name", name, "value", value);
    try {
        const sql =
            "INSERT INTO zustand_storage (value, name) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET value = $1";
        await db.query(sql, [JSON.stringify(value), name]);
        res.status(200).json({ message: "Success" });
    } catch (error) {
        console.error("Error saving data:", error);
        res.status(500).send((error as Error).message);
    }
});

router.delete("/remove", (req: Request, res: Response) => {
    const { name } = req.query;
    // console.log(
    //     "src-api/api/zustand/remove 「DELETE」",
    //     new Date().toISOString()
    // );
    // console.log(
    //     `src-api/api/zustand/remove 「DELETE」- ${name}`,
    //     new Date().toISOString()
    // );
    try {
        db.query(
            `DELETE FROM zustand_storage WHERE name = '${name?.toString()}'`
        );
        res.sendStatus(200);
    } catch (error) {
        console.error("Error removing data:", error);
        res.status(500).send((error as Error).message);
    }
});

router.get("/userDataPath", (req: Request, res: Response) => {
    console.log(
        "scr-api/api/zustand/userDataPath 「GET」",
        new Date().toISOString()
    );
    const userDataPath = cache.has("userDataPath")
        ? cache.get("userDataPath")
        : "";
    res.json({ userDataPath });
});

export default router;
