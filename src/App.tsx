import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, ScrollShadow } from "@nextui-org/react";
import "./App.css";
import mdStore from "./store/mdStore.js";
import { Descendant } from "slate";
import MarkdownShortcuts from "./components/slate/MarkdownShortcuts.js";
import Sidebar from "./components/sidebar/index.js";
import RightSidebar from "./components/sidebar/right.js";
import useRagStore from "./store/ragStore.js";
import { useApiHealthStore } from "./store/apiStore.js";
import { extractContentToString } from "./components/slate/tools.js";

function App() {
    const session = mdStore((state) => state.currentSession());
    const clearData = mdStore((state) => state.clearData);
    const updateContent = mdStore((state) => state.updateContent);
    const updateTitle = mdStore((state) => state.updateTitle);
    const isCompleteWithEmb = useRagStore((state) =>
        state.getIsCompleteWithEmb()
    );
    const apiReady = useApiHealthStore((state) => state.getApiReady());
    const llmUrlConfig = useRagStore((state) => state.getLlmConfig());

    const [isComposition, setIsComposition] = useState(false);

    const [pendingAIComplete, setPendingAIComplete] = useState(false);
    const [mdValue, setMdValue] = useState<Record<string, Descendant[]>>({
        root: [{ type: "paragraph", children: [{ text: "" }] }],
    });
    function setMdValueFunc(id: string, value: Descendant[]) {
        const newValues = { ...mdValue };
        newValues[id] = value;
        setMdValue(newValues);
    }
    const setMdValueFuncCallback = useCallback(
        (id: string, value: Descendant[]) => {
            setMdValueFunc(id, value);
        },
        [session.id]
    );

    useEffect(() => {
        clearData();
    }, []);

    useEffect(() => {
        const newValues = { ...mdValue };
        newValues[session.id] = session.content;
        setMdValue(newValues);
    }, [session.id]); // 只有当切换session时才会更新mdValue
    useEffect(() => {
        // 一定要确保mdValue[session.id]存在，如果不存在会有bug
        if (mdValue[session.id]) {
            updateContent(mdValue[session.id]);
        }

        if (session.title === "New Markdown" || session.title.length < 15) {
            const content = extractContentToString(session.content);
            if (content.trim().length > 20) {
                updateTitle(content.slice(0, 20));
            }
        }
    }, [mdValue]);
    const RightSidebarMemo = useMemo(
        () => (
            <RightSidebar
                key={session.id}
                pendingAIComplete={pendingAIComplete}
                isComposition={isComposition}
            />
        ),
        [
            session.id,
            pendingAIComplete,
            isComposition,
            apiReady,
            session.fileBox,
        ]
    );

    const SidebarMemo = useMemo(() => <Sidebar />, [llmUrlConfig]);
    return (
        <div className="h-screen w-screen p-5 box-border app-region-drag">
            <div className="flex flex-row w-full h-full">
                {/* <Sidebar /> */}
                {SidebarMemo}
                <Card className="w-full h-full p-4 app-region-no-drag">
                    <ScrollShadow
                        offset={100}
                        className="h-full overflow-x-hidden"
                    >
                        {session && session.id && mdValue[session.id] && (
                            <MarkdownShortcuts
                                key={session.id}
                                mdValue={mdValue[session.id]}
                                setMdValue={(value) =>
                                    setMdValueFuncCallback(session.id, value)
                                }
                                isAIComplete={pendingAIComplete}
                                setIsAIComplete={setPendingAIComplete}
                                aiSearchList={session.aiSearch.slice(0, 2) || []}
                                isCompleteWithEmb={isCompleteWithEmb}
                                isComposition={isComposition}
                                setIsComposition={setIsComposition}
                            />
                        )}
                    </ScrollShadow>
                </Card>
                {RightSidebarMemo}
            </div>
        </div>
    );
}

export default App;
