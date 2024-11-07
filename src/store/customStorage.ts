import axios, { AxiosRequestConfig } from "axios";
import cache from "@/cacheClient";
import AsyncLock from "async-lock";

const API_URL = "http://localhost:18321/api/zustand";
const lock = new AsyncLock();

// 用axios替换fetch
export const fetchWithTimeout = async (
    url: string,
    options: AxiosRequestConfig = {},
    timeout = 2000
): Promise<any> => {
    // 创建一个 Promise 来处理超时
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error("Request timed out"));
        }, timeout);
    });

    // 创建一个 Promise 来处理 axios 请求
    const requestPromise = axios.request({
        url,
        ...options,
    });

    // 使用 Promise.race 来处理两个 Promise 的竞争
    try {
        const response = (await Promise.race([
            requestPromise,
            timeoutPromise,
        ])) as any;
        return (response as any).data; // 返回响应数据
    } catch (error) {
        throw error; // 抛出错误
    }
};

const customStorage = {
    getItem: async (name: string): Promise<any> => {
        return lock.acquire("storage", async () => {
            let userDataPath = "";
            let cachePath = cache.has("userDataPath")
                ? cache.get("userDataPath")
                : "None";
            cache.set("zustandFlag", false);
            while (userDataPath !== cachePath) {
                try {
                    const response = await fetchWithTimeout(
                        `${API_URL}/userDataPath`,
                        {},
                        1000
                    );
                    userDataPath = response?.userDataPath;

                    if (userDataPath === cachePath) {
                        console.log(
                            "User data path matched with cache:",
                            userDataPath
                        );
                        break;
                    }
                } catch (error) {
                    console.error("Error fetching user data path:", error);
                }

                await new Promise((resolve) => setTimeout(resolve, 1000));
                cachePath = cache.has("userDataPath")
                    ? cache.get("userDataPath")
                    : "None";
            }

            try {
                const response = await fetchWithTimeout(
                    `${API_URL}/get?name=${name}`,
                    {},
                    10000
                );
                cache.set("zustandFlag", true);
                if (response && response.value === null) {
                    return null;
                } else {
                    return response?.value;
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                return null;
            }
        });
    },

    setItem: async (name: string, value: any): Promise<void> => {
        return lock.acquire("storage", async () => {
            try {
                const response = await fetchWithTimeout(`${API_URL}/set`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    data: JSON.stringify({ name, value }),
                });

                if (response.message !== "Success") {
                    throw new Error("Failed to save data to the server");
                }
            } catch (error) {
                console.error("Error saving data:", error);
            }
        });
    },

    removeItem: async (name: string): Promise<void> => {
        return lock.acquire("storage", async () => {
            try {
                const response = await fetchWithTimeout(
                    `${API_URL}/remove?name=${name}`,
                    {
                        method: "DELETE",
                    }
                );
                if (!response.ok) {
                    throw new Error("Failed to remove data from the server");
                }
            } catch (error) {
                console.error("Error removing data:", error);
            }
        });
    },
};

export default customStorage;
