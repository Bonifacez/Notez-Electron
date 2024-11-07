import { LLMUrlConfigInit } from "@/store/ragStore";
import {
    Button,
    Divider,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
} from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { BASE_URL } from "@/config";

interface SettingModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    llmUrl: string;
    setLlmUrl: (url: string) => void;
    llmApiKey: string;
    setLlmApiKey: (apiKey: string) => void;
    llmModel: string;
    setLlmModel: (model: string) => void;
    llmEmbUrl: string;
    setLlmEmbUrl: (url: string) => void;
    llmEmbApiKey: string;
    setLlmEmbApiKey: (apiKey: string) => void;
    llmEmbModel: string;
    setLlmEmbModel: (model: string) => void;
    resetConfig: () => void;
    userFileBase: string;
    setUserFileBase: (base: string) => void;
}

export default function SettingModal({
    isOpen,
    onOpenChange,
    llmUrl,
    setLlmUrl,
    llmApiKey,
    setLlmApiKey,
    llmModel,
    setLlmModel,
    llmEmbModel,
    setLlmEmbModel,
    llmEmbUrl,
    setLlmEmbUrl,
    llmEmbApiKey,
    setLlmEmbApiKey,
    resetConfig,
    userFileBase,
    setUserFileBase,
}: SettingModalProps) {
    const [url, setUrl] = useState(llmUrl);
    const [apiKey, setApiKey] = useState(llmApiKey);
    const [model, setModel] = useState(llmModel);
    const [embUrl, setEmbUrl] = useState(llmEmbUrl);
    const [embApiKey, setEmbApiKey] = useState(llmEmbApiKey);
    const [embModel, setEmbModel] = useState(llmEmbModel);
    const [checkResult, setCheckResult] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);
    const [showRes, setShowRes] = useState("");
    const [fileBase, setFileBase] = useState(userFileBase);

    const inputDivCss = "mr-6";
    return (
        <>
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="lg"
                backdrop="transparent"
                className="box-border"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-row">
                                Settings
                            </ModalHeader>
                            <ModalBody className="flex flex-col justify-start overflow-hidden">
                                <div className="ml-2 text-gray-500">
                                    Please Enter your Local Storage Folder or
                                    Default
                                    {/* <br />
                                    <em className="text-sm">
                                        e.g. /Users/「Your Username」/Desktop/
                                    </em>
                                    <br />
                                    <em className="text-xs text-blue-400">
                                        Otherwise, the Local AI System Will NOT
                                        WORK
                                    </em> */}
                                </div>
                                <div className="flex flex-row">
                                    <Input
                                        className="mr-6"
                                        type="user file base url"
                                        placeholder="Enter Your File Location Folder"
                                        value={fileBase}
                                        onChange={(e) => {
                                            setFileBase(e.target.value);
                                            setUserFileBase(e.target.value);
                                        }}
                                        color="primary"
                                    />
                                </div>
                                <Divider />

                                <div className="ml-2 text-gray-400 text-sm">
                                    <em>Only Tested Ollama For Now ~</em>
                                    <br />
                                    <em>But you Can Try Other Api as Well</em>
                                    <br />
                                    <em className="text-xs">
                                        If use Openai API, set URL TO 「OPENAI」
                                    </em>
                                </div>
                                <div className="mr-6">
                                    <Input
                                        type="LLM URL"
                                        placeholder="Your LLM URL / or 「OPENAI」"
                                        label="LLM URL"
                                        value={url}
                                        onChange={(e) => {
                                            setUrl(e.target.value);
                                            setLlmUrl(e.target.value);
                                        }}
                                    />
                                </div>
                                <div className="mr-6">
                                    <Input
                                        type="API KEY"
                                        placeholder="Your API KEY"
                                        label="API KEY"
                                        value={apiKey}
                                        onChange={(e) => {
                                            setApiKey(e.target.value);
                                            setLlmApiKey(e.target.value);
                                        }}
                                    />
                                </div>
                                <div className="mr-6">
                                    <Input
                                        type="Model"
                                        placeholder="Your Model"
                                        label="MODEL"
                                        value={model}
                                        onChange={(e) => {
                                            setModel(e.target.value);
                                            setLlmModel(e.target.value);
                                        }}
                                    />
                                </div>
                                <Divider />
                                <div className="mr-6">
                                    <Input
                                        type="EMB URL"
                                        placeholder="Your EMB URL / or 「OPENAI」"
                                        label="EMB URL"
                                        value={embUrl}
                                        onChange={(e) => {
                                            setEmbUrl(e.target.value);
                                            setLlmEmbUrl(e.target.value);
                                        }}
                                    />
                                </div>
                                <div className="mr-6">
                                    <Input
                                        type="EMB API KEY"
                                        placeholder="Your EMB API KEY"
                                        label="EMB API KEY"
                                        value={embApiKey}
                                        onChange={(e) => {
                                            setEmbApiKey(e.target.value);
                                            setLlmEmbApiKey(e.target.value);
                                        }}
                                    />
                                </div>
                                <div className="mr-6">
                                    <Input
                                        type="EMB Model"
                                        placeholder="Your EMB Model"
                                        label="EMB MODEL"
                                        value={embModel}
                                        onChange={(e) => {
                                            setEmbModel(e.target.value);
                                            setLlmEmbModel(e.target.value);
                                        }}
                                    />
                                </div>
                                {checkResult && (
                                    <div
                                        className="ml-2 text-sm text-gray-400"
                                        dangerouslySetInnerHTML={{
                                            __html: checkResult,
                                        }}
                                    ></div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    variant="light"
                                    color="default"
                                    className="text-gray-400"
                                    onPress={() => {
                                        setIsLoaded(false);
                                        setUrl(LLMUrlConfigInit().url);
                                        setLlmUrl(LLMUrlConfigInit().url);

                                        setApiKey(LLMUrlConfigInit().apiKey);
                                        setLlmApiKey(LLMUrlConfigInit().apiKey);

                                        setModel(LLMUrlConfigInit().model);
                                        setLlmModel(LLMUrlConfigInit().model);

                                        setEmbUrl(LLMUrlConfigInit().embUrl);
                                        setLlmEmbUrl(LLMUrlConfigInit().embUrl);

                                        setEmbApiKey(
                                            LLMUrlConfigInit().embApiKey
                                        );
                                        setLlmEmbApiKey(
                                            LLMUrlConfigInit().embApiKey
                                        );

                                        setEmbModel(
                                            LLMUrlConfigInit().embModel
                                        );
                                        setLlmEmbModel(
                                            LLMUrlConfigInit().embModel
                                        );
                                    }}
                                >
                                    Reset
                                </Button>
                                <Button
                                    variant="flat"
                                    color="default"
                                    className="text-gray-400"
                                    isLoading={isLoaded}
                                    onPress={() => {
                                        setCheckResult("");
                                        setIsLoaded(true);
                                        fetch(`${BASE_URL}/api/llm`, {
                                            method: "POST",
                                            mode: "cors",
                                            headers: {
                                                "Content-Type":
                                                    "application/json",
                                            },
                                            body: JSON.stringify({
                                                url: url,
                                                apiKey: apiKey,
                                                model: model,
                                                embUrl: embUrl,
                                                embApiKey: embApiKey,
                                                embModel: embModel,
                                            }),
                                        })
                                            .then((res) => res.json())
                                            .then((data) => {
                                                console.log(data);
                                                setShowRes(
                                                    JSON.stringify(data)
                                                );
                                                const { chatModel, embModel } =
                                                    data;
                                                const chatResult =
                                                    chatModel.success
                                                        ? "Chat Model Test Success"
                                                        : `Chat Model Test Failed: ${chatModel.error}`;
                                                const embResult =
                                                    embModel.success
                                                        ? "Emb Model Test Success"
                                                        : `Emb Model Test Failed: ${embModel.error}`;
                                                setCheckResult(
                                                    `${chatResult}<br>${embResult}`
                                                );
                                                setIsLoaded(false);
                                            });
                                    }}
                                >
                                    Test Connection
                                </Button>
                                <Button
                                    variant="shadow"
                                    color="primary"
                                    onPress={onClose}
                                >
                                    Submit
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
