import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
import { mkdir } from "fs";
import cache from "./cacheClient";
import path from "path";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite/vector";

let userDataPath = cache.has("userDataPath") ? cache.get("userDataPath") : "";

function mkdirSync() {
    userDataPath = cache.has("userDataPath") ? cache.get("userDataPath") : "";
    if (userDataPath === "" || userDataPath === undefined) {
        return;
    }
    const ragFilePath = path.join(userDataPath as string, "dbs");
    try {
        mkdir(ragFilePath, { recursive: true }, (error) => {
            if (error) {
                console.error("Create directory error:", error);
            }
        });
    } catch (error) {
        console.error("Create directory error:", error);
    }
}

function middlewareDB() {
    mkdirSync();
    userDataPath = cache.has("userDataPath") ? cache.get("userDataPath") : "";
    if (userDataPath === "" || userDataPath === undefined) {
        // const db = new Database(":memory:");
        // db.exec(CREATE_TABLE_MIDDLEWARE);
        // db.exec(CREATE_TRIGGER_MIDDLEWARE);
        // db.exec(CREATE_TRIGGER_MIDDLEWARE_UPDATE);
        // return db;
        const db = new PGlite();
        db.exec(CREATE_TABLE_MIDDLEWARE);
        db.exec(CREATE_TRIGGER_MIDDLEWARE);
        db.exec(CREATE_TRIGGER_MIDDLEWARE_UPDATE);
        return db;
    } else {
        const ragFilePath = path.join(userDataPath as string, "dbs");
        // const db = new Database(path.join(ragFilePath, "middleware"));
        // db.exec(CREATE_TABLE_MIDDLEWARE);
        // db.exec(CREATE_TRIGGER_MIDDLEWARE);
        // db.exec(CREATE_TRIGGER_MIDDLEWARE_UPDATE);
        // return db;
        const db = new PGlite(path.join(ragFilePath, "middleware"));
        db.exec(CREATE_TABLE_MIDDLEWARE);
        db.exec(CREATE_TRIGGER_MIDDLEWARE);
        db.exec(CREATE_TRIGGER_MIDDLEWARE_UPDATE);
        return db;
    }
}

function zustandDB() {
    mkdirSync();
    userDataPath = cache.has("userDataPath") ? cache.get("userDataPath") : "";
    console.log("zustandDB", userDataPath);
    let db = new PGlite();
    if (userDataPath === "" || userDataPath === undefined) {
    } else {
        const ragFilePath = path.join(userDataPath as string, "dbs");
        db = new PGlite(path.join(ragFilePath, "zustand"));
    }
    db.query(CREATE_ZUSTAND_TABLE);
    return db;
}

function sqliteDB() {
    mkdirSync();
    userDataPath = cache.has("userDataPath") ? cache.get("userDataPath") : "";
    let db = new PGlite();
    if (userDataPath === "" || userDataPath === undefined) {
    } else {
        const ragFilePath = path.join(userDataPath as string, "dbs");
        db = new PGlite(path.join(ragFilePath, "nodes"));
    }
    db.query(CREATE_TABLE);
    return db;
}

function sqliteVEC() {
    mkdirSync();
    userDataPath = cache.has("userDataPath") ? cache.get("userDataPath") : "";
    let db = new PGlite({
        extensions: { vector },
    });
    if (userDataPath === "" || userDataPath === undefined) {
    } else {
        const ragFilePath = path.join(userDataPath as string, "dbs");
        db = new PGlite(path.join(ragFilePath, "nodes_vec"), {
            extensions: { vector },
        });
    }
    db.exec(CREATE_TABLE_VEC);
    return db;
}

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS nodes(
    id TEXT PRIMARY KEY, 
    sessionId TEXT, 
    metadata TEXT, 
    fileName TEXT, 
    excludedEmbedMetadataKeys TEXT, 
    excludedLlmMetadataKeys TEXT, 
    relationships TEXT, 
    embedding TEXT, 
    text_ TEXT, 
    textTemplate TEXT, 
    metadataSeparator TEXT, 
    startCharIdx INTEGER, 
    endCharIdx INTEGER
    );`;

const CREATE_ZUSTAND_TABLE = `CREATE TABLE IF NOT EXISTS zustand_storage (name TEXT PRIMARY KEY, value TEXT)`;

const CREATE_TABLE_MIDDLEWARE =
    "CREATE TABLE IF NOT EXISTS middleware(" +
    "id TEXT PRIMARY KEY, " +
    "statue TEXT, " +
    "created_at DATETIME DEFAULT CURRENT_TIMESTAMP" +
    ");";

const CREATE_TRIGGER_MIDDLEWARE =
    "CREATE TRIGGER IF NOT EXISTS middleware_trigger " +
    "AFTER INSERT ON middleware " +
    "BEGIN " +
    "   DELETE FROM middleware WHERE created_at < datetime('now', '-1 day'); " +
    "END;";

const CREATE_TRIGGER_MIDDLEWARE_UPDATE =
    "CREATE TRIGGER IF NOT EXISTS middleware_trigger_update " +
    "AFTER UPDATE ON middleware " +
    "BEGIN " +
    "   DELETE FROM middleware WHERE created_at < datetime('now', '-1 day'); " +
    "END;";
// const CREATE_TABLE_VEC =
// "CREATE VIRTUAL TABLE IF NOT EXISTS nodes_vec USING vec0(" +
// "id TEXT PRIMARY KEY, " +
// "embedding FLOAT[1024]" +
// ");";

// 使用pglite就不需要VIRTUAL了
const CREATE_TABLE_VEC = `
    CREATE EXTENSION IF NOT EXISTS vector;

    CREATE TABLE IF NOT EXISTS nodes_vec(
    id TEXT PRIMARY KEY,
    embedding vector (1024));`;

const SELECT_MIDDLEWARE = "SELECT * FROM middleware";

const SELECT_MIDDLEWARE_ID = "SELECT id, statue FROM middleware WHERE id = $1";

const SELECT_FILE_NAME_DUPLICATES =
    "SELECT DISTINCT fileName FROM nodes WHERE sessionId = $1;";

const SELECT_ID_TEXT =
    "SELECT id, text_, embedding FROM nodes WHERE sessionId = $1";

// const SELECT_VEC = `
// SELECT id, distance
// FROM (
//     SELECT id, distance
//     FROM nodes_vec
//     WHERE embedding MATCH $1
//     ORDER BY distance
//     LIMIT 50
// )
// WHERE id LIKE $2
// ORDER BY distance ASC
// LIMIT 5;
// `;

const SELECT_VEC = `
SELECT id, distance
FROM (
    SELECT id, embedding <-> $1 AS distance
    FROM nodes_vec
    ORDER BY distance
    LIMIT 50
)
WHERE id LIKE $2
ORDER BY distance ASC
LIMIT 5;
`;

const INSERT_NODE = `INSERT INTO nodes (id, sessionId, metadata, fileName, excludedEmbedMetadataKeys, excludedLlmMetadataKeys, relationships, embedding, text_, textTemplate, metadataSeparator, startCharIdx, endCharIdx)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`;

const INSERT_MIDDLEWARE =
    "INSERT INTO middleware (id, statue) VALUES ($1, $2);";

const UPDATE_EMBEDDING = `UPDATE nodes SET embedding = $1 WHERE id = $2;`;

// const INSET_VEC_EMBEDDING =
//     "INSERT OR REPLACE INTO nodes_vec (id, embedding) VALUES ($1, $2);";

const INSET_VEC_EMBEDDING =
    "INSERT INTO nodes_vec (id, embedding) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET embedding = $2;";

const DELETE_NODE = "DELETE FROM nodes WHERE sessionId = $1 AND fileName = $2;";

const DELETE_NODE_SESSION = "DELETE FROM nodes WHERE sessionId = $1;";

export { sqliteDB, sqliteVEC, middlewareDB, zustandDB };

export {
    INSERT_NODE,
    UPDATE_EMBEDDING,
    SELECT_FILE_NAME_DUPLICATES,
    SELECT_ID_TEXT,
    DELETE_NODE,
    DELETE_NODE_SESSION,
    CREATE_TABLE_MIDDLEWARE,
    CREATE_TRIGGER_MIDDLEWARE,
    CREATE_TRIGGER_MIDDLEWARE_UPDATE,
    INSERT_MIDDLEWARE,
    SELECT_MIDDLEWARE,
    SELECT_MIDDLEWARE_ID,
    INSET_VEC_EMBEDDING,
    SELECT_VEC,
};
