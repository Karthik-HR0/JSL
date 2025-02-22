chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getJSFiles") {
        findJavaScriptFiles().then(jsFiles => sendResponse({ jsFiles }));
        return true;  // Keep the message channel open for async response
    }
});

async function findJavaScriptFiles() {
    let jsLinks = new Set();

    // 1️⃣ Extract from <script> tags
    document.querySelectorAll("script[src]").forEach(script => jsLinks.add(script.src));

    // 2️⃣ Extract from Performance API (Network Requests)
    performance.getEntriesByType("resource").forEach(entry => {
        if (entry.name.endsWith(".js")) jsLinks.add(entry.name);
    });

    // 3️⃣ Extract from inline scripts using regex
    document.querySelectorAll("script:not([src])").forEach(script => {
        let matches = script.innerHTML.match(/https?:\/\/[^"'\s]+\.js/g);
        if (matches) matches.forEach(url => jsLinks.add(url));
    });

    // 4️⃣ Extract from fetch(), XMLHttpRequest, and WebSockets
    await getNetworkJSFiles(jsLinks);

    return Array.from(jsLinks);
}

// Hook into network requests to capture dynamically loaded JS files
async function getNetworkJSFiles(jsLinks) {
    if (window.performance && window.performance.getEntriesByType) {
        let resources = performance.getEntriesByType("resource");
        resources.forEach(entry => {
            if (entry.name.endsWith(".js")) jsLinks.add(entry.name);
        });
    }

    // Listen for new script insertions in the DOM
    let observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.tagName === "SCRIPT" && node.src) {
                    jsLinks.add(node.src);
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return jsLinks;
}
