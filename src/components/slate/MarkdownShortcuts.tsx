import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    createEditor,
    Descendant,
    Editor,
    Element as SlateElement,
    Node as SlateNode,
    Point,
    Range,
    Transforms,
    Selection,
} from "slate";
import isHotkey from "is-hotkey";
import { withHistory, HistoryEditor } from "slate-history";
import { Editable, ReactEditor, Slate, withReact } from "slate-react";
import { BulletedListElement } from "./custom-types.d";
import { extractContentToString } from "./tools";
import { AsyncFetchLlmStreamNextWeb, Message } from "@/utils/fetchs/llm";
import useRagStore from "@/store/ragStore";

const HOTKEYS: { [key: string]: string } = {
    "mod+b": "bold",
    "mod+i": "italic",
    "mod+u": "underline",
    "mod+`": "code",
    "mod+k": "aiComplete",
};

const SHORTCUTS: { [key: string]: string } = {
    "*": "list-item",
    "-": "list-item",
    "+": "list-item",
    ">": "block-quote",
    "#": "heading-one",
    "##": "heading-two",
    "###": "heading-three",
    "####": "heading-four",
    "#####": "heading-five",
    "######": "heading-six",
};

const isMarkActive = (editor: Editor, format: string) => {
    const marks = Editor.marks(editor) as { [key: string]: any };
    return marks ? marks[format] === true : false;
};

const toggleMark = (editor: Editor, format: string) => {
    const isActive = isMarkActive(editor, format);

    if (isActive) {
        Editor.removeMark(editor, format);
    } else {
        Editor.addMark(editor, format, true);
    }
};

const insertTab = (editor: Editor, format: string) => {
    Editor.insertText(editor, "    ");
};

interface MarkdownShortcutsProps {
    mdValue: Descendant[];
    setMdValue: (value: Descendant[]) => void;
    aiSearchList: string[];
    isCompleteWithEmb: boolean;
    isComposition: boolean;
    setIsComposition: React.Dispatch<React.SetStateAction<boolean>>;
    isAIComplete: boolean;
    setIsAIComplete: React.Dispatch<React.SetStateAction<boolean>>;
}

function MarkdownShortcuts({
    mdValue,
    setMdValue,
    aiSearchList,
    isCompleteWithEmb,
    isComposition,
    setIsComposition,
    isAIComplete,
    setIsAIComplete,
}: MarkdownShortcutsProps): JSX.Element {
    const editorRef = useRef<(HistoryEditor & ReactEditor) | null>(null);
    const cursorPositionRef = useRef<Selection | null>(null);
    const llmUrlConfig = useRagStore((state) => state.getLlmConfig());

    const renderElement = useCallback(
        (props: any) => <Element {...props} />,
        []
    );
    const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);
    const editor = useMemo(
        () => withShortcuts(withReact(withHistory(createEditor()))),
        []
    );
    const [realtimeValue, setRealtimeValue] = useState<Descendant[]>([]);

    const setRealtimeValueCallback = useCallback((value: Descendant[]) => {
        setRealtimeValue(value);
    }, []);

    const handleDOMBeforeInput = useCallback(
        (e: InputEvent) => {
            queueMicrotask(() => {
                const pendingDiffs = ReactEditor.androidPendingDiffs(editor);

                const scheduleFlush = pendingDiffs?.some(({ diff, path }) => {
                    if (!diff.text.endsWith(" ")) {
                        return false;
                    }

                    const { text } = SlateNode.leaf(editor, path);
                    const beforeText =
                        text.slice(0, diff.start) + diff.text.slice(0, -1);
                    if (!(beforeText in SHORTCUTS)) {
                        return;
                    }

                    const blockEntry = Editor.above(editor, {
                        at: path,
                        match: (n) =>
                            SlateElement.isElement(n) &&
                            Editor.isBlock(editor, n),
                    });
                    if (!blockEntry) {
                        return false;
                    }

                    const [, blockPath] = blockEntry;
                    return Editor.isStart(
                        editor,
                        Editor.start(editor, path),
                        blockPath
                    );
                });

                if (scheduleFlush) {
                    ReactEditor.androidScheduleFlush(editor);
                }
            });
        },
        [editor]
    );
    const [aiCompleteRes, setAICompleteRes] = useState("");
    const messages: Message[] = [
        {
            role: "user",
            content: extractContentToString(realtimeValue),
            date: new Date().toISOString(),
        },
    ];

    async function selectionAIComplete() {
        await AsyncFetchLlmStreamNextWeb(messages, llmUrlConfig, {
            onAloneMessage: (message, done) => {
                setAICompleteRes(message);
                editor.insertText(message);
            },
            onError: (error) => {
                console.error(error);
            },
            aiSearch: isCompleteWithEmb ? aiSearchList : [],
        })
            .then(() => {
                console.log("AI Complete Done");
                setIsAIComplete(false);
                editor.insertText(aiCompleteRes);
            })
            .catch((error) => {
                console.error(error);
                setIsAIComplete(false);
            });
    }

    function keyDownFunc(event: React.KeyboardEvent) {
        if (event.key === "Tab") {
            event.preventDefault();
            insertTab(editor, "tab");
        }
        for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event as any)) {
                event.preventDefault();
                const mark = HOTKEYS[hotkey];
                if (mark !== "aiComplete") {
                    toggleMark(editor, mark);
                } else {
                    if (!isAIComplete) {
                        selectionAIComplete();
                        setIsAIComplete(true);
                    }
                }
            }
        }
    }

    const words = "Call AI to Complete".split("");

    const handleCompositionStart = (
        event: React.CompositionEvent<HTMLDivElement>
    ) => {
        // console.log("Composition started", event);
        setIsComposition(true);
    };

    const handleCompositionUpdate = (
        event: React.CompositionEvent<HTMLDivElement>
    ) => {
        // console.log("Composition updated", event);
    };

    const handleCompositionEnd = (
        event: React.CompositionEvent<HTMLDivElement>
    ) => {
        // console.log("Composition ended", event);
        setIsComposition(false);
    };

    const SlateComponent = (
        <Slate
            editor={editor}
            initialValue={mdValue}
            onChange={(value) => {
                setMdValue(value);
                setRealtimeValueCallback(value);
            }}
        >
            <Editable
                onDOMBeforeInput={handleDOMBeforeInput}
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder="Write some markdown and 「cmd + k」is the Magic Key"
                spellCheck
                autoFocus
                className="focus:outline-none h-full"
                onKeyDown={(event) => {
                    keyDownFunc(event);
                }}
                // renderPlaceholder={({ attributes }) => (
                //     <div {...attributes}>
                //         <pre>
                //             Hi! Please write some markdown here.
                //             <br />
                //             <span>AI </span>
                //             <span>Will Help you~</span>
                //             <br />
                //             <br />
                //             <span className="text-4xl">
                //                 <span className="inline-block animate-rainbow">
                //                     # AI Markdown
                //                 </span>
                //             </span>
                //             <br />
                //             <br />
                //             <span className="text-2xl">## For subheading</span>
                //             <br />
                //             <br />
                //             <span className="text-2xl">
                //                 ### For subsubheading
                //             </span>
                //             <br />
                //             <br />
                //             「cmd + B」 will make the text <strong>Bold</strong>
                //             <br />
                //             「cmd + I」 will make the text <em>Italic</em>
                //             <br />
                //             「cmd + U」 will make the text <u>Underline</u>
                //             <br />
                //             <span className="inline-block font-bold text-lg animate-rainbow">
                //                 「cmd + K」{" "}
                //             </span>
                //             {words.map((char, index) => (
                //                 <span
                //                     key={index}
                //                     className={`inline-block animate-wave`}
                //                     style={{
                //                         animationDelay: `${index * 0.1}s`,
                //                     }}
                //                 >
                //                     {char === " " ? "\u00A0" : char}
                //                 </span>
                //             ))}
                //         </pre>
                //         <div></div>
                //     </div>
                // )}
                onCompositionStart={handleCompositionStart}
                onCompositionUpdate={handleCompositionUpdate}
                onCompositionEnd={handleCompositionEnd}
            />
        </Slate>
    );

    // return useMemo(
    //     () => SlateComponent,
    //     [mdValue, aiSearchList, isCompleteWithEmb]
    // );
    return SlateComponent;
}

// ---------------------------------------------------
// ---------------------------------------------------
// ---------------------------------------------------

const withShortcuts = (editor: Editor) => {
    const { deleteBackward, insertText } = editor;

    editor.insertText = (text: string) => {
        const { selection } = editor;

        editor.removeMark("ai");

        if (text.endsWith(" ") && selection && Range.isCollapsed(selection)) {
            const { anchor } = selection;
            const block = Editor.above(editor, {
                match: (n) =>
                    SlateElement.isElement(n) && Editor.isBlock(editor, n),
            });
            const path = block ? block[1] : [];
            const start = Editor.start(editor, path);
            const range = { anchor, focus: start };
            const beforeText = Editor.string(editor, range) + text.slice(0, -1);
            const type = SHORTCUTS[beforeText];

            if (type) {
                Transforms.select(editor, range);

                if (!Range.isCollapsed(range)) {
                    Transforms.delete(editor);
                }

                const newProperties: any = {
                    type,
                };
                Transforms.setNodes<SlateElement>(editor, newProperties, {
                    match: (n) =>
                        SlateElement.isElement(n) && Editor.isBlock(editor, n),
                });

                if (type === "list-item") {
                    const list: BulletedListElement = {
                        type: "bulleted-list",
                        children: [],
                    };
                    Transforms.wrapNodes(editor, list, {
                        match: (n) =>
                            !Editor.isEditor(n) &&
                            SlateElement.isElement(n) &&
                            n.type === "list-item",
                    });
                }

                return;
            }
        }
        insertText(text);
    };

    editor.deleteBackward = (...args) => {
        const { selection } = editor;

        editor.removeMark("ai");

        if (selection && Range.isCollapsed(selection)) {
            const match = Editor.above(editor, {
                match: (n) =>
                    SlateElement.isElement(n) && Editor.isBlock(editor, n),
            });

            if (match) {
                const [block, path] = match;
                const start = Editor.start(editor, path);

                if (
                    !Editor.isEditor(block) &&
                    SlateElement.isElement(block) &&
                    block.type !== "paragraph" &&
                    Point.equals(selection.anchor, start)
                ) {
                    const newProperties: Partial<SlateElement> = {
                        type: "paragraph",
                    };
                    Transforms.setNodes(editor, newProperties);

                    if (block.type === "list-item") {
                        Transforms.unwrapNodes(editor, {
                            match: (n) =>
                                !Editor.isEditor(n) &&
                                SlateElement.isElement(n) &&
                                n.type === "bulleted-list",
                            split: true,
                        });
                    }

                    return;
                }
            }

            deleteBackward(...args);
        }
    };

    return editor;
};

const Element = ({
    attributes,
    children,
    element,
}: {
    attributes: any;
    children: any;
    element: any;
}) => {
    switch (element.type) {
        case "block-quote":
            return <blockquote {...attributes}>{children}</blockquote>;
        case "bulleted-list":
            return <ul {...attributes}>{children}</ul>;
        case "numbered-list":
            return <ol {...attributes}>{children}</ol>;
        case "heading-one":
            return <h1 {...attributes}>{children}</h1>;
        case "heading-two":
            return <h2 {...attributes}>{children}</h2>;
        case "heading-three":
            return <h3 {...attributes}>{children}</h3>;
        case "heading-four":
            return <h4 {...attributes}>{children}</h4>;
        case "heading-five":
            return <h5 {...attributes}>{children}</h5>;
        case "heading-six":
            return <h6 {...attributes}>{children}</h6>;
        case "list-item":
            return <li {...attributes}>{children}</li>;
        default:
            return <p {...attributes}>{children}</p>;
    }
};
const Leaf = ({
    attributes,
    children,
    leaf,
}: {
    attributes: any;
    children: any;
    leaf: any;
}) => {
    if (leaf.bold) {
        children = <strong>{children}</strong>;
    }

    if (leaf.code) {
        children = <code>{children}</code>;
    }
    if (leaf.ai) {
        children = <span className="text-pink-300">{children}</span>;
    }

    if (leaf.italic) {
        children = <em>{children}</em>;
    }

    if (leaf.underline) {
        children = <u>{children}</u>;
    }

    return <span {...attributes}>{children}</span>;
};

export default MarkdownShortcuts;
