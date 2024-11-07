import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import customStorage from "./customStorage.js";

interface ApiStore {
    apiStatues: {
        [apiUrl: string]: {
            success?: string;
            error?: string;
            info?: string;
        };
    };
    setApiStatues: (
        apiUrl: string,
        status: { success?: string; error?: string; info?: string }
    ) => void;
    getApiStatues: () => {
        [apiUrl: string]: {
            success?: string;
            error?: string;
            info?: string;
        };
    };
    userFileBase: string;
    setUserFileBase: (base: string) => void;
    getUserFileBase: () => string;
    updateUserFileBase: () => void;
}

interface ApiHealthStore {
    apiReady: boolean;
    setApiReady: (ready: boolean) => void;
    getApiReady: () => boolean;
}

const useApiStore = create<ApiStore>()(
    persist(
        (set, get) => ({
            apiStatues: {},
            setApiStatues: (apiUrl, status) => {
                set((state) => {
                    const newApiStatues = { ...state.apiStatues };
                    newApiStatues[apiUrl] = status;
                    return { apiStatues: newApiStatues };
                });
            },
            getApiStatues: () => get().apiStatues,

            userFileBase: "",
            setUserFileBase: (url) => {
                // console.log("setUserFileBase", url);
                set(() => ({
                    // 如果url 不以 / 结尾，添加 /
                    userFileBase: url.endsWith("/") ? url : url + "/",
                }));
            },
            getUserFileBase: () => {
                return get().userFileBase;
            },
            updateUserFileBase: () => {
                // getTauriPath().then((res) => {
                //     // console.log("getTauriPath res", res);
                //     get().setUserFileBase(res.appLocalDataDir);
                // });
            },
        }),
        {
            name: "apiStore",
            // storage: () => localStorage, // 使用 localStorage 作为存储
            // storage: createJSONStorage(() => sessionStorage)
            // storage: 通过fs保存到本地，自定义存储
            storage: createJSONStorage(() => customStorage),
        }
    )
);

const useApiHealthStore = create<ApiHealthStore>()((set, get) => ({
    apiReady: false,
    setApiReady: (ready) => set({ apiReady: ready }),
    getApiReady: () => get().apiReady,
}));

export default useApiStore;
export { useApiHealthStore };
