import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import baseRouter from "./route";
import llmRouter from "./llmRoute";
import ragRouter from "./ragRoute";
import fileRouter from "./fileRoute";
import zustandRouter from "./zustandRoute";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", baseRouter);
app.use("/api/llm", llmRouter);
app.use("/api/rag", ragRouter);
app.use("/api/file", fileRouter);
app.use("/api/zustand", zustandRouter);

// 自定义日志中间件
const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const ip = req.ip;

    console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
    next(); // 调用 next() 来将控制权传递给下一个中间件
};

// 使用日志中间件
app.use(loggerMiddleware);

let port = 18321;
class AppServer {
    start() {
        return new Promise((resolve, reject) => {
            let server = app.listen(port, function () {
                let addressInfo = server.address();
                if (typeof addressInfo === "object" && addressInfo !== null) {
                    port = addressInfo.port;
                    console.log("address: http://localhost:%s", port);
                    resolve(port);
                } else {
                    reject(new Error("Failed to get server address"));
                }
                resolve(port);
            });
        });
    }
}

export default AppServer;
