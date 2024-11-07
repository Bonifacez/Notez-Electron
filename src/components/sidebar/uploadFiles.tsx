"use client";

import mdStore from "@/store/mdStore";
import { Button, Input } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import useApiStore from "@/store/apiStore";
import useRagStore from "@/store/ragStore";
import { BASE_URL } from "@/config";

export default function FileUpload() {
    const session = mdStore((state) => state.currentSession());
    const updateFileBox = mdStore((state) => state.updateFileBox);
    const llmUrlConfig = useRagStore((state) => state.getLlmConfig());
    const setApiStatues = useApiStore((state) => state.setApiStatues);

    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        setFiles(selectedFiles);
    };

    const handleFileSelect = async () => {
        try {
            // Open file picker and allow multiple、 selections
            const fileHandles = await (window as any).showOpenFilePicker({
                multiple: true,
                types: [
                    {
                        description: "All Files",
                        accept: {
                            "*/*": [],
                        },
                    },
                ],
            });

            // Convert file handles to File objects
            const newFiles = await Promise.all(
                fileHandles.map((handle: { getFile: () => any }) =>
                    handle.getFile()
                )
            );

            setFiles((prevFiles) => [...prevFiles, ...newFiles]);
        } catch (error) {
            if ((error as Error).name !== "AbortError") {
                console.error("Error selecting files:", error);
                alert("An error occurred while selecting files.");
            }
        }
    };

    const handleUpload = async () => {
        console.log("Uploading files:", files);
        if (files.length === 0) {
            alert("Please select files first.");
            return;
        }

        const formData = new FormData();
        files.forEach((file) => {
            formData.append("files", file);
        });

        // Add a session ID (you should generate or obtain this as needed)
        formData.append("sessionId", session.id);

        // const response = await fetch(`${BASE_URL}/api/file/upload`, {
        //     method: "POST",
        //     mode: "cors",
        //     body: formData,
        // });

        // const result = await response.json();
        // console.log("Upload result:", result);
        // return result;
        try {
            const response = await fetch(`${BASE_URL}/api/file/upload`, {
                method: "POST",
                mode: "cors",
                body: formData,
            });

            const result = await response.json();
            setApiStatues(`${BASE_URL}/api/file/upload`, {
                info: JSON.stringify(result),
            });
            return result;
        } catch (error) {
            console.error("Upload error:", error);
            alert("An error occurred during upload.");
        }
    };

    const handlePhaseDocs = async () => {
        try {
            if (files.length > 0) {
                const response = await fetch(`${BASE_URL}/api/rag/split`, {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        fileDir: `uploads/${session.id}`,
                        sessionId: session.id,
                    }),
                });

                // 检查 fetch 是否成功
                if (!response.ok) {
                    console.error(`Error: ${response.statusText}`);
                    return {
                        success: false,
                        message: `Failed to split docs: ${response.statusText}`,
                    };
                }

                // 获取响应数据
                const data = await response.json();

                // 如果响应数据为空，返回默认对象
                if (!data) {
                    console.warn("No data returned from the split API.");
                    return {
                        success: false,
                        message: "No data returned from the split API",
                    };
                }

                // 更新状态
                setApiStatues(`${BASE_URL}/api/rag/split`, {
                    info: JSON.stringify(data),
                });

                return data; // 确保返回非 undefined 数据
            } else {
                console.warn("No files to process.");
                return { success: false, message: "No files provided" }; // 如果没有文件，返回默认对象
            }
        } catch (error) {
            console.error("Error in phaseDocs:", error);
            return { success: false, error: (error as Error).message }; // 返回错误信息，而不是 undefined
        }
    };

    const handleEmb = async () => {
        return await fetch(`${BASE_URL}/api/rag/emb`, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sessionId: session.id,
                llmUrlConfig: llmUrlConfig,
            }),
        }).then(async (res) => {
            const data = await res.json();
            setApiStatues(`${BASE_URL}/api/rag/emb`, {
                info: JSON.stringify(data),
            });
            return data;
        });
    };

    useEffect(() => {
        if (files.length > 0) {
            updateFileBox(
                files.map((file) => ({
                    id: nanoid(6),
                    name: file.name,
                    path: `uploads/${session.id}/${file.name}`,
                }))
            );
            const handleFileProcessing = async () => {
                try {
                    // Step 1: Upload files
                    const uploadResult = await handleUpload();
                    console.log("Upload result:", uploadResult);

                    if (uploadResult && uploadResult.success) {
                        // Step 2: Split files (Phase Docs)
                        const phaseDocsResult = await handlePhaseDocs();
                        console.log("Split result:", phaseDocsResult);

                        if (phaseDocsResult && phaseDocsResult.success) {
                            // Step 3: Embed files
                            const embResult = await handleEmb();
                            console.log("Emb result:", embResult);

                            if (embResult && embResult.success) {
                                // Files uploaded and processed successfully
                                setFiles([]);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error in file processing:", error);
                    alert("An error occurred during file processing.");
                }
            };

            handleFileProcessing();
        }
    }, [files]);

    return (
        <div>
            <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                multiple
                onChange={handleFileChange}
            />
            <Button
                className="text-gray-400"
                size="sm"
                radius="full"
                variant="flat"
                onPress={() => {
                    fileInputRef.current!.click();
                }}
            >
                Upload
            </Button>
        </div>
    );
}
