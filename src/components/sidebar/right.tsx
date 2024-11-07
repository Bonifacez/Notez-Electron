import { Suspense, useEffect, useMemo, useState } from "react";
import {
    Button,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Divider,
    Progress,
    ScrollShadow,
    Switch,
    Tooltip,
} from "@nextui-org/react";
import { X } from "lucide-react";
import mdStore from "@/store/mdStore";
import FileUpload from "./uploadFiles";
import useRagStore, { LLMUrlConfig } from "@/store/ragStore";
import useApiStore, { useApiHealthStore } from "@/store/apiStore";
import { checkHealth } from "@/utils/fetchs/base";
import { extractContentToString } from "../slate/tools";
import { BASE_URL } from "@/config";
import cache from "@/cacheClient";

function RightSidebar({
    pendingAIComplete,
    isComposition,
}: {
    pendingAIComplete: boolean;
    isComposition: boolean;
}) {
    const session = mdStore((state) => state.currentSession());
    const removeFileBox = mdStore((state) => state.removeFileBox);
    const aiSearch = mdStore((state) => state.getAISearch());
    const updataAISearch = mdStore((state) => state.updataAISearch);
    const apiReady = useApiHealthStore((state) => state.getApiReady());
    const setApiReady = useApiHealthStore((state) => state.setApiReady);

    const textEmbStatue = useRagStore((state) => state.getTextEmbStatue());
    const setTextEmbStatue = useRagStore((state) => state.setTextEmbStatue);
    const setIsCompleteWithEmb = useRagStore(
        (state) => state.setIsCompleteWithEmb
    );
    const isCompleteWithEmb = useRagStore((state) =>
        state.getIsCompleteWithEmb()
    );
    const llmUrlConfig = useRagStore((state) => state.getLlmConfig());
    const setApiStatues = useApiStore((state) => state.setApiStatues);
    const syncStorage = mdStore((state) => state.syncStorage);

    const [isExpanded, setIsExpanded] = useState(false);
    const [isRendered, setIsRendered] = useState(false);
    const [textEmbStatueTmp, setTextEmbStatueTmp] = useState(textEmbStatue);
    const [aiSearchList, setAiSearchList] = useState(aiSearch);

    useEffect(() => {
        setTextEmbStatue(session.id, textEmbStatueTmp[session.id]);
    }, [textEmbStatueTmp]);

    const toggleSidebar = () => {
        setIsExpanded(!isExpanded);
    };

    const getAIEmbeddingStatus = useMemo(() => {
        const sessionStatus = textEmbStatue[session.id];
        if (sessionStatus) {
            if (sessionStatus.total === 0) {
                return 0;
            } else {
                return Math.round(
                    (sessionStatus.finished / sessionStatus.total) * 100
                );
            }
        }
        return 0;
    }, [textEmbStatue, session.id]);

    const AISearchItem = ({ text }: { text: string }) => {
        return (
            <div
                className={`mb-1 mt-1 p-1 pb-0 pt-0 w-fit border-2 rounded-lg max-w-[190px]
                    text-gray-500 text-sm border-gray-300 transition-all duration-300 cursor-pointer
                    ${isExpanded ? "h-fit" : "h-6 truncate"}`}
            >
                {text}
            </div>
        );
    };

    const runEmb = async (sessionId: string, llmUrlConfig: LLMUrlConfig) => {
        const controller = new AbortController();
        const { signal } = controller;
        try {
            const res = await fetch(`${BASE_URL}/api/rag/emb_state`, {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ sessionId }),
                signal, // 传递 signal 以支持取消请求
            });
            setApiStatues(`${BASE_URL}/api/rag/emb_state`, {
                info: JSON.stringify(res),
            });
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const data = await res.json();
            setTextEmbStatueTmp({
                ...textEmbStatueTmp,
                [session.id]: {
                    total: data.total,
                    finished: data.finished,
                },
            });
        } catch (error) {
            console.error("Fetch error:", error);
            controller.abort("fetch error runEmb");
            setApiStatues(`${BASE_URL}/api/rag/emb_state`, {
                info: JSON.stringify(error),
            });
        }
    };

    const checkBackendHealth = async () => {
        const isHealthy = await checkHealth(`${BASE_URL}/api`, 100, 1000);
        if (isHealthy) {
            setApiReady(true);
        }
    };

    const runApiHealth = async (userDataPath: string) => {
        const controller = new AbortController();
        const { signal } = controller;
        try {
            checkBackendHealth();
            fetch(`${BASE_URL}/api`, {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userDataPath: userDataPath,
                }),
                signal,
            }).then((res) => {
                setApiStatues(`${BASE_URL}/api`, {
                    info: JSON.stringify(res),
                });
            });
        } catch (error) {
            console.error("Fetch error:", error);
            controller.abort("fetch error runApiHealth");
            setApiStatues(`${BASE_URL}/api`, {
                info: JSON.stringify(error),
            });
        }
    };

    useEffect(() => {
        if (apiReady === false) {
            const timeout = setTimeout(() => {
                checkBackendHealth();
            }, 1000);
            return () => clearTimeout(timeout);
        }

        fetch(`${BASE_URL}/api`, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userDataPath: cache.get("userDataPath") as string,
            }),
        }).then((res) => {
            setApiStatues(`${BASE_URL}/api`, {
                info: JSON.stringify(res),
            });
        });
        syncStorage();
    }, []);

    useEffect(() => {
        // 设置一个3秒钟执行一次的间隔，这个是为了更新rightSidebar的数据
        const intervalId = setInterval(() => {
            // 只要不是在输入法输入，就会执行emb
            // 并且api已经准备好
            if (!isComposition && apiReady) {
                runEmb(session.id, llmUrlConfig);
                // runApiHealth(userFileBase);
                runApiHealth(cache.get("userDataPath") as string);
                syncStorage();
            }
        }, 3000);

        // 清除间隔，防止内存泄漏
        return () => clearInterval(intervalId);
    }, [session.id, llmUrlConfig, isComposition, apiReady]);

    useEffect(() => {
        setIsRendered(true);
    }, []);
    const updateAISearch = async () => {
        const controller = new AbortController();
        const { signal } = controller;
        const text = extractContentToString(session.content);
        if (text.trim().length !== 0) {
            try {
                const res = await fetch(`${BASE_URL}/api/rag/fileSearch`, {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        sessionId: session.id,
                        text,
                        llmUrlConfig,
                    }),
                    signal,
                });
                const data = await res.json();
                setAiSearchList(data.searchList);
                updataAISearch(data.searchList);
                setApiStatues(`${BASE_URL}/api/rag/fileSearch`, {
                    info: JSON.stringify(data),
                });
            } catch (error) {
                console.error("Fetch error:", error);
                controller.abort("fetch error updateAISearch");
                setApiStatues(`${BASE_URL}/api/rag/fileSearch`, {
                    info: JSON.stringify(error),
                });
            }
        }
        controller.abort();
    };

    useEffect(() => {
        if (!isComposition) {
            const timeoutId = setTimeout(updateAISearch, 2000);
            return () => {
                clearTimeout(timeoutId);
            };
        }
    }, [session.content, session.id, llmUrlConfig, isComposition]);

    const cardCss = "w-full m-2";
    const cardHeaderCss = "text-sm text-gray-400 w-11/12";
    const progressCss = "m-2 mt-0 text-gray-400";

    return (
        isRendered && (
            <div className="min-w-[240px] max-w-[240px] h-full transition-all duration-300 app-region-no-drag">
                <Card
                    className="h-full flex flex-col ml-0.5 
                   shadow-[6px_0_15px_rgba(0,0,0,0.2)] w-full pt-0.5"
                >
                    <ScrollShadow
                        isEnabled={true}
                        className="flex flex-col p-0.5 justify-start items-center w-full h-full overflow-x-hidden
                        box-border"
                    >
                        <div className="flex flex-col justify-center items-center w-11/12">
                            <Card className={`${cardCss}`} shadow="sm">
                                <CardHeader
                                    className={`${cardHeaderCss} flex flex-row justify-between`}
                                >
                                    <div>AI Status</div>
                                    <Tooltip
                                        content={
                                            "Completion Based on file Content"
                                        }
                                        placement="left-end"
                                        className="text-gray-400"
                                    >
                                        <Switch
                                            size="sm"
                                            color="success"
                                            defaultSelected={isCompleteWithEmb}
                                            onChange={() => {
                                                setIsCompleteWithEmb(
                                                    !isCompleteWithEmb
                                                );
                                            }}
                                        />
                                    </Tooltip>
                                </CardHeader>
                                <Divider />
                                <CardBody className="flex flex-col justify-center items-center overflow-hidden w-48">
                                    <Progress
                                        aria-label="Loading..."
                                        label="AI Thinking"
                                        value={100}
                                        size="sm"
                                        isStriped={!apiReady}
                                        isIndeterminate={
                                            pendingAIComplete || !apiReady
                                        }
                                        className={progressCss}
                                        color="success"
                                    />
                                    <Progress
                                        aria-label="Loading..."
                                        label="AI Embedding"
                                        showValueLabel
                                        value={getAIEmbeddingStatus}
                                        size="sm"
                                        className={progressCss}
                                        color="default"
                                    />
                                </CardBody>
                            </Card>
                            <Card className={`${cardCss}`} shadow="sm">
                                <CardHeader
                                    className={`${cardHeaderCss} flex flex-row justify-between`}
                                >
                                    <div>AI File Search</div>
                                    <Tooltip
                                        content={"Extend Search Result"}
                                        placement="left-end"
                                        className="text-gray-400"
                                    >
                                        <Switch
                                            size="sm"
                                            color="default"
                                            defaultSelected={isExpanded}
                                            onChange={toggleSidebar}
                                        />
                                    </Tooltip>
                                </CardHeader>
                                {/* {session.aiSearch.length > 0 && (
                                    <CardBody className="flex flex-col justify-start items-start">
                                        {session.aiSearch.map((item, index) => (
                                            <AISearchItem
                                                key={index.toString()}
                                                text={item}
                                            />
                                        ))}
                                    </CardBody>
                                )} */}
                                {aiSearchList.length > 0 && (
                                    <CardBody className="flex flex-col justify-start items-start">
                                        {aiSearchList.map((item, index) => (
                                            <AISearchItem
                                                key={index.toString()}
                                                text={item}
                                            />
                                        ))}
                                    </CardBody>
                                )}
                            </Card>
                            {/* <Card className={`${cardCss}`} shadow="sm">
                                <CardHeader className={`${cardHeaderCss}`}>
                                    Keyword File Search
                                </CardHeader>
                            </Card>
                            <Card className={`${cardCss}`} shadow="sm">
                                <CardHeader className={`${cardHeaderCss}`}>
                                    Online Search
                                </CardHeader>
                            </Card> */}
                            <Card
                                className={`${cardCss} min-h-fit`}
                                shadow="sm"
                            >
                                <CardHeader
                                    className={`${cardHeaderCss} flex flex-row justify-between`}
                                >
                                    <div>File Box</div>
                                    <FileUpload key={session.id} />
                                </CardHeader>
                                {session.fileBox.length > 0 && (
                                    <CardBody className="flex flex-col justify-start items-start max-w-1/2">
                                        {session.fileBox.map((file) => (
                                            <Tooltip
                                                key={file.id}
                                                placement="left"
                                                radius="full"
                                                content={
                                                    <Button
                                                        className="text-sm text-gray-400"
                                                        size="sm"
                                                        isIconOnly
                                                        radius="full"
                                                        variant="light"
                                                        onPress={() => {
                                                            removeFileBox(
                                                                file.id
                                                            );
                                                        }}
                                                    >
                                                        <X size={15} />
                                                    </Button>
                                                }
                                            >
                                                <Chip
                                                    key={file.id}
                                                    className="text-gray-400 m-1 ml-0 truncate w-full"
                                                    variant="bordered"
                                                    size="sm"
                                                >
                                                    {file.name}
                                                </Chip>
                                            </Tooltip>
                                        ))}
                                    </CardBody>
                                )}
                            </Card>
                            {/* <Button onPress={async () => {}}>123</Button> */}
                        </div>
                    </ScrollShadow>
                </Card>
            </div>
        )
    );
}

export default RightSidebar;
