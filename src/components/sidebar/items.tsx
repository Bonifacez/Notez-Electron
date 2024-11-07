import mdStore from "@/store/mdStore.js";
import {
    Button,
    Card,
    CardBody,
    ScrollShadow,
    Tooltip,
} from "@nextui-org/react";
import { mdSession } from "@/store/mdStore.js"; // Import or define the correct type for mdSession
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function SessionItems({ isExpanded }: { isExpanded: boolean }) {
    const sessions = mdStore((state) => state.sessions);
    const clearData = mdStore((state) => state.clearData);
    const selectSession = mdStore((state) => state.selectSession);
    const removeSession = mdStore((state) => state.removeSession);

    const [isRendered, setIsRendered] = useState(false);
    useEffect(() => {
        setIsRendered(true);
        // clearData();
    }, []);

    function DeleteSession({ index }: { index: number }): JSX.Element {
        return (
            <Button
                className="text-gray-400 text-sm"
                size="sm"
                variant="light"
                isIconOnly
                color="danger"
                radius="full"
                onPress={() => {
                    // console.log("delete session", index);
                    removeSession(index);
                }}
            >
                <X size={15} />
            </Button>
        );
    }

    return (
        <ScrollShadow isEnabled={true} className="h-full " hideScrollBar>
            {isRendered && sessions && (
                <div className="flex flex-col justify-center items-center w-full">
                    {isExpanded &&
                        sessions.map((session: mdSession, index: number) => (
                            <Tooltip
                                key={index}
                                placement="left"
                                radius="full"
                                content={<DeleteSession index={index} />}
                            >
                                <Card
                                    key={session.id}
                                    className="m-1 flex flex-row max-w-[110px] truncate"
                                    shadow="sm"
                                    isPressable
                                    onPress={() => {
                                        selectSession(index);
                                    }}
                                >
                                    <div className="text-gray-400 overflow-hidden p-1 pt-1.5 flex flex-col justify-start items-start truncate">
                                        <div className="truncate ">
                                            {session.title}
                                        </div>
                                        <span className="text-sm">
                                            {new Date(session.initDate)
                                                .toLocaleString()
                                                .slice(5, -3)}
                                        </span>
                                    </div>
                                </Card>
                            </Tooltip>
                        ))}

                    {!isExpanded &&
                        sessions.map((session: mdSession, index: number) => (
                            <Card
                                key={session.id}
                                className="m-1 p-1 flex flex-row truncate max-w-[50px]"
                                shadow="sm"
                                isPressable
                                onPress={() => {
                                    selectSession(index);
                                }}
                            >
                                <div className="text-gray-400 overflow-hidden p-1 pt-1.5 flex flex-col justify-start items-start">
                                    <div className="overflow-hidden truncate">
                                        {session.title.slice(0, 4)}
                                    </div>
                                </div>
                            </Card>
                        ))}
                </div>
            )}
        </ScrollShadow>
    );
}
