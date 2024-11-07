import { BASE_URL } from "@/config.js";
import useApiStore from "@/store/apiStore.js";
import { Button, Card } from "@nextui-org/react";
import {
    ReactElement,
    JSXElementConstructor,
    ReactNode,
    ReactPortal,
    useState,
    useEffect,
} from "react";
import { string } from "slate";

export default function ApiCheck() {
    const [apiStatues, setApiStatues] = useApiStore((state) => [
        state.getApiStatues(),
        state.setApiStatues,
    ]);

    const [status, setStatus] = useState([]);

    useEffect(() => {
        // console.log("apiStatues", apiStatues);
        const newStatus: any = Object.keys(apiStatues).map((apiUrl) => {
            const status = apiStatues[apiUrl];
            return `${apiUrl} --------- ${JSON.stringify(status)}`; // 你可以根据需要格式化输出
        });
        setStatus(newStatus); // 更新 status 状态
    }, [apiStatues]);

    return (
        <>
            <Button
                onPress={() => {
                    fetch(`${BASE_URL}/api`, {
                        method: "GET",
                        mode: "cors",
                    })
                        .then((res) => res.json())
                        .then((data) => {
                            setApiStatues(`${BASE_URL}/api`, {
                                info: JSON.stringify(data),
                            });
                        })
                        .catch((err) => {
                            console.log("error", err);
                            // setApiStatues(`${BASE_URL}/api`, {
                            //     info: JSON.stringify(err),
                            // });
                        });
                }}
            >
                check api health
            </Button>
            <h2>ApiCheck</h2>

            <div>
                {status.map((item) => (
                    <div key={Math.random()}>{item}</div>
                ))}
            </div>
        </>
    );
}
