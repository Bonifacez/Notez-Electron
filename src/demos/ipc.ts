import cache from "@/cacheClient";

window.ipcRenderer.on("main-process-message", (_event, ...args) => {
    console.log("[Receive Main-process message]:", ...args);
});

// 接收app的用户存储地址
window.ipcRenderer.on("app-path", (_event, ...args) => {
    console.log("[Receive App-path]:", ...args);

    cache.set("userDataPath", args[0]);
});
