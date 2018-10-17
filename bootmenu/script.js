var jsonConfigurationName = "entertainBootMenuConfig";

var currentView = "maincontainer";

var demoURL = "https://cto-tvd.github.io/portal/bootmenu/sideload.json";

function callAjax(demoURL, callback) {
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            callback(xmlhttp.responseText);
        }
    }
    xmlhttp.open("GET", demoURL, true);
    xmlhttp.send();
}


var configuration = {
    "environmentGroup": "local",
    "receiverGroup": "mrsat",
    "buildGroup": "nightly",
    "subscriberGroup": "SATHYBRID",
    "resolution": "720p",
    "loglevel": "debug",
    "imagescale": "true",
    "localbackendGroup": "preprod",
    "appname": "ui20"
}

function commit() {
    uiToModel();
    var url = buildUrl();
    showUrl(url);
    saveModel();
    window.location.replace(url);

}


function modelToUI() {
    setValueForRadioGroup("environmentGroup", configuration.environmentGroup);
    setValueForRadioGroup("receiverGroup", configuration.receiverGroup);
    setValueForRadioGroup("buildGroup", configuration.buildGroup);
    setValueForRadioGroup("subscriberGroup", configuration.subscriberGroup);
    setValueForRadioGroup("resolution", configuration.resolution);
    setValueForRadioGroup("loglevel", configuration.loglevel);
    setValueForRadioGroup("imagescale", configuration.imagescale);
    setValueForRadioGroup("localbackendGroup", configuration.localbackendGroup);
    setValueForRadioGroup("appname", configuration.appname);
}

function getData() {
    loadModel();
    loadDisabled();
    modelToUI();

    callAjax(demoURL, function (JSONdata) {
        try {
            environmentList = JSON.parse(JSONdata);
            var url = buildUrl();
            showUrl(url);
        }
        catch (e) {
            showMessage("Error at loading URL from Server.");
        }
    });

}


function loadDisabled() {
    var node1 = findParentformcolumn(document.getElementById('nbuild'));
    var node2 = findParentformcolumn(document.getElementById('preprodBackend'));
    if (configuration.environmentGroup != "local") {
        document.getElementById('nbuild').removeAttribute("disabled");
        document.getElementById('nv2build').removeAttribute("disabled");
        document.getElementById('sbuild').removeAttribute("disabled");
        document.getElementById('sbuildv2').removeAttribute("disabled");
        document.getElementById('hbuild').removeAttribute("disabled");
        node1.className = "formcolumn";
        document.getElementById('preprodBackend').setAttribute("disabled", "disabled");
        document.getElementById('t0Backend').setAttribute("disabled", "disabled");
        node2.className = "formcolumn disabled";

    }

    else {
        document.getElementById('nbuild').setAttribute("disabled", "disabled");
        document.getElementById('nv2build').removeAttribute("disabled");
        document.getElementById('sbuild').setAttribute("disabled", "disabled");
        document.getElementById('sbuildv2').setAttribute("disabled", "disabled");
        document.getElementById('hbuild').setAttribute("disabled", "disabled");
        node1.className = "formcolumn disabled";
        document.getElementById('preprodBackend').removeAttribute("disabled");
        document.getElementById('t0Backend').removeAttribute("disabled");
        node2.className = "formcolumn";
    }
}

function saveModel() {
    modelToUI();
    var url = buildUrl();
    showUrl(url);

    try {
        var jsonData = JSON.stringify(configuration);
        localStorage.setItem(jsonConfigurationName, jsonData);

        showMessage("Configuration successfully saved.");
    }
    catch (e) {

        showMessage("Error at saving configuration.");

    }
}

function loadModel() {
    try {
        var jsonData = JSON.parse(localStorage.getItem(jsonConfigurationName));
        if (jsonData) configuration = jsonData;
    }
    catch (e) {
        showMessage("Error at loading configuration.");

    }
}

function uiToModel() {
    configuration.environmentGroup = getRadioValue("environmentGroup")
    configuration.receiverGroup = getRadioValue("receiverGroup")
    configuration.buildGroup = getRadioValue("buildGroup")
    configuration.subscriberGroup = getRadioValue("subscriberGroup")
    configuration.resolution = getRadioValue("resolution");
    configuration.loglevel = getRadioValue("loglevel");
    configuration.imagescale = getRadioValue("imagescale");
    configuration.localbackendGroup = getRadioValue("localbackendGroup");
    configuration.appname = getRadioValue("appname");
}

function showUrl(url) {
    document.getElementById("url").innerHTML = url;
}

function showMessage(message) {
    document.getElementById("message").innerHTML = message;
}

function buildUrl() {
    var url;
    if (configuration.environmentGroup === "local") {

        var baseUrl = getUrlParameter("baseurl");
        if (!baseUrl) baseUrl = "http://192.168.2.222/appTvHostv2/index.html";

        url = baseUrl + "?";

    }
    else {

        var environment = environmentList.filter(function (env) {
            return env.env == configuration.environmentGroup && env.model.toUpperCase() == configuration.receiverGroup.toUpperCase() && env.build.toUpperCase() == configuration.buildGroup.toUpperCase()
        });
        try {
            url = environment[0].url;
            url = url + "?";
            showMessage("");
        }
        catch (e) {
            showMessage("There is no URL for this combination availible.");
        }
    }
    if (configuration.resolution) {
        url += "resolution=" + configuration.resolution + "&";
    }
    if (configuration.environmentGroup === "local") {
        if (configuration.receiverGroup) {
            url += "features.assignment=" + configuration.receiverGroup + "&";
        }
        if (configuration.localbackendGroup) {
            url += "env=" + configuration.localbackendGroup + "&";
        }
    }
    if (configuration.loglevel) {
        url += "logging.loglevel=" + configuration.loglevel + "&";
    }
    if (configuration.subscriberGroup) {
        url += "subscriber_type=" + configuration.subscriberGroup + "&";
    }
    if (configuration.imagescale) {
        url += "imagescale.enabled=" + configuration.imagescale + "&";
    }
    if (configuration.appname) {
        url += "features.featureStructure.assignment.mr401.values.appname720.value=" + configuration.appname + "&";
    }

    return url;
}

function setValueForRadioGroup(groupName, value) {

    var values = document.querySelectorAll('input[name="' + groupName + '"]');

    for (var i = 0; i < values.length; i++) {
        if (values[i].value === value) {
            values[i].checked = true;
        }
    }
}

function showView(viewName) {
    var hideView = viewName == "maincontainer" ? "settingcontainer" : "maincontainer";
    currentView = viewName;

    var elements = document.getElementsByClassName(hideView);
    if (elements) {
        elements[0].className = hideView + " hidden";
    }
    elements = document.getElementsByClassName(viewName);
    if (elements) {
        elements[0].className = viewName;
    }
    focusFirst();
}


function getRadioValue(groupName) {
    var radioGroup = document.querySelector('input[name="' + groupName + '"]:checked');
    if (radioGroup)
        return radioGroup.value;
    else
        undefined;
}

function radioFocus(event) {
    var e = event || window.event;
    if (e.target)
        e.target.parentNode.className = "radioarea focus";
    else
        e.srcElement.parentNode.className = "radioarea focus";
}

function radioBlur(event) {
    var e = event || window.event;
    if (e.target)
        e.target.parentNode.className = "radioarea";
    else
        e.srcElement.parentNode.className = "radioarea";
}

function addKeyhandling(inputs) {
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].onkeydown = function (e) {
            /* OK key */
            if (e.keyCode == 13) {
                this.checked = true;
                // changes to model
                uiToModel();

                if (this.name == "environmentGroup") {
                    var node = findParentformcolumn(document.getElementById('nbuild'));
                    if (this.value == "local") {
                        document.getElementById('nbuild').setAttribute("disabled", "disabled");
                        document.getElementById('sbuild').setAttribute("disabled", "disabled");
                        document.getElementById('sbuildv2').setAttribute("disabled", "disabled");
                        document.getElementById('hbuild').setAttribute("disabled", "disabled");
                        node.className = "formcolumn disabled";
                    }
                    else {
                        document.getElementById('nbuild').removeAttribute("disabled");
                        document.getElementById('sbuild').removeAttribute("disabled");
                        document.getElementById('sbuildv2').removeAttribute("disabled");
                        document.getElementById('hbuild').removeAttribute("disabled");
                        node.className = "formcolumn";
                    }
                }
                if (this.name == "environmentGroup") {
                    var node = findParentformcolumn(document.getElementById('preprodBackend'));
                    if (this.value != "local") {
                        document.getElementById('preprodBackend').setAttribute("disabled", "disabled");
                        document.getElementById('t0Backend').setAttribute("disabled", "disabled");
                        node.className = "formcolumn disabled";
                    }
                    else {
                        document.getElementById('preprodBackend').removeAttribute("disabled");
                        document.getElementById('t0Backend').removeAttribute("disabled");
                        node.className = "formcolumn";
                    }
                }
                modelToUI();
                var url = buildUrl();
                showUrl(url)
            }
            /* DOWN key or UP key */
            if (e.keyCode == 40 || e.keyCode == 38) {
                focusNextPreviousInput(e, this);
            }
            /* LEFT key or RIGHT key */
            if (e.keyCode == 37 || e.keyCode == 39) {
                focusNextPreviousColumn(e, this);
            }
            //Back Key
            if (e.keyCode == 461) {
                showView('maincontainer');
            }
        }
    }
}

function focusFirst() {
    var element = currentView == "maincontainer" ? document.getElementById("commitbutton") : document.getElementById("backbutton");
    if (element) element.focus();
}

function focusNextPreviousColumn(e, eventNode) {
    var node = findParentformcolumn(eventNode);
    var nextNode;

    if (node && node.className.indexOf("formcolumn") >= 0) {
        (e.keyCode == 39) ? nextNode = node.nextSibling.nextSibling : nextNode = node.previousSibling.previousSibling;
        while (nextNode) {
            if (nextNode.className && nextNode.className.indexOf("formcolumn") >= 0 && nextNode.className.indexOf("disabled") == -1) break;
            nextNode = (e.keyCode == 39) ? nextNode.nextSibling.nextSibling : nextNode.previousSibling.previousSibling;
        }
        if (!nextNode) {
            nextNode = node.parentNode;
            var collection = nextNode.getElementsByClassName("formcolumn");
            if (collection && collection.length > 0 && collection[0].className.indexOf("disabled") == -1) {

                nextNode = (e.keyCode == 39) ? collection[0] : collection[collection.length - 1];
            }
            else {
                nextNode = (e.keyCode == 39) ? collection[1] : collection[collection.length - 1];
            }
        }
    }
    focusFirstInputChild(e, nextNode);
}


function focusNextPreviousInput(e, node) {
    var nextNode = findParentArea(node);

    if (nextNode && nextNode.className && (nextNode.className.indexOf("radioarea") >= 0 || nextNode.className.indexOf("buttonarea") >= 0)) {
        e.preventDefault();
        // dependency to DOM structure. TODO other solution
        (e.keyCode == 40) ? nextNode = nextNode.nextSibling.nextSibling : nextNode = nextNode.previousSibling.previousSibling;

        focusFirstInputChild(e, nextNode);
    }
}

function focusFirstInputChild(e, nextNode) {
    var nextInput = nextNode.querySelector("input");

    nextInput.focus();
    e.preventDefault();
    return false;
}

function findParentformcolumn(node) {
    var parent = node.parentNode;
    while (node) {
        if (parent.className.indexOf("formcolumn") >= 0) break;
        parent = parent.parentNode;
    }
    return parent;
}

function findParentArea(node) {
    var nextNode = node.parentNode;
    while (nextNode) {
        if (nextNode.className && (nextNode.className.indexOf("radioarea") >= 0 || nextNode.className.indexOf("buttonarea") >= 0)) break;
        nextNode = nextNode.parentNode;
    }
    return nextNode;
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

addKeyhandling(document.getElementsByTagName("input"));
addKeyhandling(document.getElementsByTagName("select"));
