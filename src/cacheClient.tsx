import { LRUCache } from "lru-cache";

const cache = new LRUCache({
    max: 100,
    ttl: 0, // 0 = infinity，不过期
});

/*
cache中已经有的key
1. userDataPath
2. zustandFlag

*/

export default cache;