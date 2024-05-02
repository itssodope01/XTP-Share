function whichDevice() {
    if (isIPhone()) return "iPhone";
    if (isAndroid()) return "Android";
    return "Unknown";
}

function agentHas(keyword) {
    return navigator.userAgent.toLowerCase().includes(keyword.toLowerCase());
}

function isIPhone() {
    return agentHas("iPhone") || agentHas("iPod");
}

function isAndroid() {
    return agentHas("Android");
}

var device = whichDevice();
document.body.classList.add(device.toLowerCase());