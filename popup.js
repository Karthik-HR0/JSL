document.addEventListener("DOMContentLoaded", function() {
    let jsFiles = [];

    // Fetch JS links from the content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: findJavaScriptFiles
        }, (results) => {
            if (results && results[0] && results[0].result) {
                jsFiles = results[0].result;
                displayResults(jsFiles);
            }
        });
    });

    function displayResults(files) {
        let list = document.getElementById("jsList");
        list.innerHTML = "";
        files.forEach(url => {
            let li = document.createElement("li");
            li.textContent = url;
            list.appendChild(li);
        });
    }

    document.getElementById("applyFilter").addEventListener("click", () => {
        let filterValue = document.getElementById("filterInput").value.toLowerCase();
        let filteredFiles = jsFiles.filter(url => url.toLowerCase().includes(filterValue));
        displayResults(filteredFiles);
    });

    document.getElementById("copyBtn").addEventListener("click", () => {
        let textToCopy = jsFiles.join("\n");
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert("Copied to clipboard!");
        });
    });
});

function findJavaScriptFiles() {
    let jsLinks = new Set();

    // Collect from <script> tags
    document.querySelectorAll("script[src]").forEach(script => jsLinks.add(script.src));

    // Collect from performance API
    performance.getEntriesByType("resource").forEach(entry => {
        if (entry.name.endsWith(".js")) jsLinks.add(entry.name);
    });

    // Collect from inline scripts
    document.querySelectorAll("script:not([src])").forEach(script => {
        let matches = script.innerHTML.match(/https?:\/\/[^"'\s]+\.js/g);
        if (matches) matches.forEach(url => jsLinks.add(url));
    });

    return Array.from(jsLinks);
}
