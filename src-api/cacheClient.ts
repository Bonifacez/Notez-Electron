import { LRUCache } from "lru-cache";

const cache = new LRUCache({
    max: 100,
    // ttl: 0, // 0 = infinity，不过期
    ttl: 1000 * 60 * 60 * 24, // 24 hours
});

//现有key
/*
1. userDataPath
*/

export default cache;