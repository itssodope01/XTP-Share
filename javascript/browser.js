function whichBrowser() {
    if (isFirefox()) return "Firefox";
    if (isEdge()) return "Edge";
    if (isIE()) return "Internet Explorer";
    if (isOpera()) return "Opera";
    if (isVivaldi()) return "Vivalid";
    if (isChrome()) return "Chrome";
    if (isSafari()) return "Safari";
    return "Unknown";
}

function agentHas(keyword) {
    return navigator.userAgent.toLowerCase().includes(keyword.toLowerCase());
}

function isIE() {
    return !!document.documentMode;
}

function isSafari() {
    return (window.ApplePaySetupFeature || window.safari) && agentHas("Safari") && !agentHas("Chrome") && !agentHas("CriOS");
}

function isChrome() {
    return agentHas("CriOS") || agentHas("Chrome") || !!window.chrome;
}

function isFirefox() {
    return agentHas("Firefox") || agentHas("FxiOS") || agentHas("Focus");
}

function isEdge() {
    return agentHas("Edg");
}

function isOpera() {
    return agentHas("OPR");
}

function isVivaldi() {
    return agentHas("Vivaldi");
}

var browser = whichBrowser();
document.body.classList.add(browser.toLowerCase());
