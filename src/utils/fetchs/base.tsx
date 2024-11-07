async function fetchWithTimeout(url: string, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
        ...options,
        signal: controller.signal,
    });

    clearTimeout(id);

    return response;
}

async function checkHealth(
    url: string,
    maxRetries = Infinity,
    retryInterval = 5000
) {
    let retries = 0;

    while (retries < maxRetries) {
        try {
            const response = await fetchWithTimeout(url, {}, 5000);
            if (response.ok) {
                console.log("Backend is healthy");
                return true;
            }
        } catch (error) {
            console.error("Health check failed:", error);
        }

        retries++;
        console.log(
            `Retrying in ${
                retryInterval / 1000
            } seconds... (Attempt ${retries})`
        );
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }

    console.error("Max retries reached. Backend is not responding.");
    return false;
}

export { fetchWithTimeout, checkHealth };
