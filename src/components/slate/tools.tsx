import { Element as SlateElement, Descendant } from "slate";

const extractContentToString = (mdValue: Descendant[]): string => {
    return mdValue
        .map((node) => {
            if (SlateElement.isElement(node)) {
                return node.children.map((child: any) => child.text).join("\n");
            } else {
                return node.text;
            }
        })
        .filter((text) => text.trim().length > 0) // Skip if trimmed length is 0
        .join("\n");
};

export { extractContentToString };
