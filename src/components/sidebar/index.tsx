import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, useDisclosure } from "@nextui-org/react";
import {
    ChevronsLeftRight,
    ChevronsRightLeft,
    Plus,
    Settings,
} from "lucide-react";
import mdStore from "@/store/mdStore.js";
import SessionItems from "./items.js";
import SettingModal from "./settingModal.js";
import useRagStore from "@/store/ragStore.js";
import useApiStore from "@/store/apiStore.js";
import cache from "@/cacheClient.js";

const Sidebar = () => {
    const newSession = mdStore((state) => state.newSession);
    const session = mdStore((state) => state.currentSession());
    const sessions = mdStore((state) => state.sessions);
    const llmConfig = useRagStore((state) => state.getLlmConfig());
    const setLlmConfig = useRagStore((state) => state.setLlmConfig);
    const resetConfig = useRagStore((state) => state.resetConfig);
    const userFileBase = useApiStore((state) => state.getUserFileBase());
    const setUserFileBase = useApiStore((state) => state.setUserFileBase);
    const updateUserFileBase = useApiStore((state) => state.updateUserFileBase);

    const [isExpanded, setIsExpanded] = useState(true);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [llmUrl, setLlmUrl] = useState(llmConfig.url);
    const [llmApiKey, setLlmApiKey] = useState(llmConfig.apiKey);
    const [llmModel, setLlmModel] = useState(llmConfig.model);
    const [llmEmbUrl, setLlmEmbUrl] = useState(llmConfig.embUrl);
    const [llmEmbApiKey, setLlmEmbApiKey] = useState(llmConfig.embApiKey);
    const [llmEmbModel, setLlmEmbModel] = useState(llmConfig.embModel);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleSidebar = () => {
        setIsExpanded(!isExpanded);
    };

    useEffect(() => {
        const newConfig = {
            url: llmUrl,
            apiKey: llmApiKey,
            model: llmModel,
            embUrl: llmEmbUrl,
            embApiKey: llmEmbApiKey,
            embModel: llmEmbModel,
        };
        setLlmConfig(newConfig);
    }, [llmUrl, llmApiKey, llmModel, llmEmbUrl, llmEmbApiKey, llmEmbModel]);

    const SettingModalMemo = useMemo(() => {
        return (
            <SettingModal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                llmUrl={llmUrl}
                setLlmUrl={setLlmUrl}
                llmApiKey={llmApiKey}
                setLlmApiKey={setLlmApiKey}
                llmModel={llmModel}
                setLlmModel={setLlmModel}
                llmEmbUrl={llmEmbUrl}
                setLlmEmbUrl={setLlmEmbUrl}
                llmEmbApiKey={llmEmbApiKey}
                setLlmEmbApiKey={setLlmEmbApiKey}
                llmEmbModel={llmEmbModel}
                setLlmEmbModel={setLlmEmbModel}
                resetConfig={resetConfig}
                userFileBase={userFileBase}
                setUserFileBase={setUserFileBase}
            />
        );
    }, [isOpen, onOpenChange, userFileBase]);
    const iconSize = 18;

    // const [zustandLoadingFlag, setZustandLoadingFlag] = useState(false);
    // useEffect(() => {
    //     const flag = cache.has("zustandFlag")
    //         ? (cache.get("zustandFlag") as boolean)
    //         : false;
    //     setZustandLoadingFlag(flag);
    // }, [sessions]);

    return (
        <div
            className={`app-region-no-drag transition-all duration-300 ${
                isExpanded ? "w-[180px]" : "w-[80px] "
            }`}
        >
            {/* input input input input input input input input */}
            <input ref={fileInputRef} type="file" hidden />
            {/* input input input input input input input input */}
            {SettingModalMemo}
            <Card
                className="h-full flex flex-col mr-0.5 justify-between items-center 
                   shadow-[-6px_0_15px_rgba(0,0,0,0.2)]"
            >
                <div className="flex flex-col justify-between items-center w-11/12 h-5/6">
                    <h1
                        className={`m-5 transition-transform duration-300 min-h-[40px]
                            text-gray-400 transform overflow-hidden`}
                    >
                        {isExpanded ? "Notez" : "N"}
                    </h1>
                    <div className="flex flex-row w-full justify-center items-center">
                        <Button
                            className="text-gray-400 w-full"
                            variant="light"
                            onPress={newSession}
                            isIconOnly
                        >
                            <Plus size={iconSize} />
                        </Button>
                        {/* <Button
                            className="text-gray-400 w-full"
                            variant="light"
                            isIconOnly
                            onPress={() => {
                                fileInputRef.current!.click();
                            }}
                        >
                            <Import size={iconSize} />
                        </Button> */}
                    </div>
                    <div className="mt-5 w-full max-w-64 h-5/6 flex flex-col justify-center items-center">
                        <SessionItems isExpanded={isExpanded} />
                    </div>
                </div>

                <div className="flex flex-col w-11/12 justify-center items-center">
                    <div className="flex flex-row w-full justify-center items-center">
                        <Button
                            className=" text-gray-400 w-full"
                            isIconOnly
                            variant="light"
                            radius="full"
                            onPress={onOpen}
                        >
                            <Settings size={iconSize} />
                        </Button>
                        {/* <Button
                            className=" text-gray-400 w-full"
                            isIconOnly
                            variant="light"
                            radius="full"
                        >
                            <Download size={iconSize} />
                        </Button> */}
                    </div>
                    <Button
                        className="mb-1 text-gray-400 w-full"
                        onClick={toggleSidebar}
                        isIconOnly
                        variant="light"
                        radius="full"
                    >
                        {isExpanded ? (
                            <ChevronsRightLeft size={iconSize} />
                        ) : (
                            <ChevronsLeftRight size={iconSize} />
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default Sidebar;
