"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var moduleSource = fs.readFileSync(path.join(__dirname, "..", "OBSAdvanced.js"), "utf8");
var sent = [];
var wireMessages = [];
var logMessages = [];
var context = {
    console: console,
    script: {log: function (message) { logMessages.push(message); }},
    local: {send: function (message) { wireMessages.push(JSON.parse(message)); }},
    sent: sent
};

vm.createContext(context);
vm.runInContext(moduleSource, context, {filename: "OBSAdvanced.js"});
var realSendObsCommand = context.sendObsCommand;
context.sendObsCommand = function (requestType, requestData, requestId) {
    sent.push({requestType: requestType, requestData: requestData, requestId: requestId});
};

function execute(requestType, fieldList, values) {
    sent.length = 0;
    var args = [JSON.stringify({fieldList: fieldList}), requestType, 0].concat(values);
    context.genericCommandExecutor.apply(null, args);
    assert.strictEqual(sent.length, 1);
    return sent[0].requestData;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

function MockParameter(value) {
    this.value = value;
}
MockParameter.prototype.set = function (value) { this.value = value; };
MockParameter.prototype.setAttribute = function () {};

function MockContainer() {
    this.children = {};
}
MockContainer.prototype.getChild = function (name) { return this.children[name] || null; };
MockContainer.prototype.addContainer = function (name) {
    if (!this.children[name]) this.children[name] = new MockContainer();
    return this.children[name];
};
MockContainer.prototype.removeContainer = function (name) { delete this.children[name]; };
MockContainer.prototype.clear = function () { this.children = {}; };
MockContainer.prototype.addIntParameter = function (name, description, value) {
    this.children[name] = new MockParameter(value);
    return this.children[name];
};
MockContainer.prototype.addFloatParameter = MockContainer.prototype.addIntParameter;
MockContainer.prototype.addBoolParameter = MockContainer.prototype.addIntParameter;
MockContainer.prototype.addStringParameter = MockContainer.prototype.addIntParameter;

var projectorFields = [
    ["sourceName", "String"],
    ["sourceUuid", "String"],
    ["monitorIndex", "Number"],
    ["projectorGeometry", "String"]
];

var projectorFields57 = [
    ["canvasUuid", "String", {optional: true}],
    ["sourceName", "String", {optional: true}],
    ["sourceUuid", "String", {optional: true}],
    ["monitorIndex", "Number", {optional: true}],
    ["projectorGeometry", "String", {optional: true}]
];

assert.deepStrictEqual(plain(execute("OpenSourceProjector", projectorFields,
    ["SPX", "", 0, ""])), {sourceName: "SPX", monitorIndex: 0});

assert.deepStrictEqual(plain(execute("OpenSourceProjector", projectorFields,
    ["SPX", "", -1, ""])), {sourceName: "SPX", monitorIndex: -1});

assert.deepStrictEqual(plain(execute("OpenSourceProjector", projectorFields,
    ["SPX", "", 0, "geometry-data"])), {sourceName: "SPX", projectorGeometry: "geometry-data"});

assert.deepStrictEqual(plain(execute("OpenSourceProjector", projectorFields57,
    ["", "SPX", "", 0, ""])), {sourceName: "SPX", monitorIndex: 0});

assert.deepStrictEqual(plain(execute("OpenVideoMixProjector", [
    ["videoMixType", "String"],
    ["monitorIndex", "Number"],
    ["projectorGeometry", "String"]
], ["OBS_WEBSOCKET_VIDEO_MIX_TYPE_PROGRAM", 0, "geometry-data"])), {
    videoMixType: "OBS_WEBSOCKET_VIDEO_MIX_TYPE_PROGRAM",
    projectorGeometry: "geometry-data"
});

assert.deepStrictEqual(plain(execute("OpenSourceProjector", projectorFields,
    ["SPX", undefined, 0, null])), {sourceName: "SPX", monitorIndex: 0});

var embeddedApi = context.API;
context.API = undefined;
assert.deepStrictEqual(plain(execute("OpenSourceProjector", projectorFields,
    ["SPX", null, 0, null])), {sourceName: "SPX", monitorIndex: 0});
context.API = embeddedApi;

sent.length = 0;
logMessages.length = 0;
context.genericCommandExecutor(JSON.stringify({fieldList: projectorFields}),
    "OpenSourceProjector", 0, null, null, 0, null);
assert.strictEqual(sent.length, 0);
assert.ok(logMessages[0].indexOf("sourceName or sourceUuid is required; request not sent") !== -1);

assert.deepStrictEqual(plain(context.sortMonitorsLeftToRight([
    {monitorIndex: 0, monitorPositionX: 1720},
    {monitorIndex: 2, monitorPositionX: -1720},
    {monitorIndex: 1, monitorPositionX: 0}
])), [
    {index: 2, x: -1720},
    {index: 1, x: 0},
    {index: 0, x: 1720}
]);
assert.deepStrictEqual(plain(context.sortMonitorsLeftToRight([
    {monitorIndex: 0, monitorPositionX: 0},
    {monitorIndex: 1, monitorPositionX: 1720}
])), [
    {index: 0, x: 0},
    {index: 1, x: 1720}
]);

var monitorResponse = new MockContainer();
var monitorMerged = new MockContainer();
context.updateGetMonitorListSummary([
    {monitorIndex: 0, monitorPositionX: 1720},
    {monitorIndex: 2, monitorPositionX: -1720},
    {monitorIndex: 1, monitorPositionX: 0}
], monitorResponse, monitorMerged);
assert.strictEqual(monitorResponse.getChild("monitorCount").value, 3);
assert.strictEqual(monitorMerged.getChild("Monitoren").getChild("Links").value, 2);
assert.strictEqual(monitorMerged.getChild("Monitoren").getChild("Midden").value, 1);
assert.strictEqual(monitorMerged.getChild("Monitoren").getChild("Rechts").value, 0);
context.updateGetMonitorListSummary([
    {monitorIndex: 0, monitorPositionX: 0},
    {monitorIndex: 1, monitorPositionX: 1720}
], monitorResponse, monitorMerged);
assert.strictEqual(monitorResponse.getChild("monitorCount").value, 2);
assert.strictEqual(monitorMerged.getChild("Monitoren").getChild("Positie 1").value, 0);
assert.strictEqual(monitorMerged.getChild("Monitoren").getChild("Positie 2").value, 1);
assert.strictEqual(monitorMerged.getChild("Monitoren").getChild("Links naar rechts").value, "0;1");

assert.deepStrictEqual(plain(execute("SetSceneSceneTransitionOverride", [
    ["sceneName", "String"],
    ["sceneUuid", "String"],
    ["transitionName", "String"],
    ["transitionDuration", "Number"]
], ["Scene", "", null, null])), {
    sceneName: "Scene",
    transitionName: null,
    transitionDuration: null
});

assert.deepStrictEqual(plain(execute("SetInputSettings", [
    ["inputName", "String"],
    ["inputUuid", "String"],
    ["inputSettings", "Object"],
    ["overlay", "Boolean"]
], ["SPX", "", "{}", false])), {
    inputName: "SPX",
    inputSettings: {},
    overlay: false
});

assert.deepStrictEqual(plain(execute("SetSceneItemIndex", [
    ["sceneName", "String"],
    ["sceneUuid", "String"],
    ["sceneItemId", "Number"],
    ["sceneItemIndex", "Number"]
], ["Scene", "", 1, 0])), {
    sceneName: "Scene",
    sceneItemId: 1,
    sceneItemIndex: 0
});

assert.deepStrictEqual(plain(execute("SetTBarPosition", [
    ["position", "Number", {optional: false}],
    ["release", "Boolean", {optional: true, omitIfDefault: true}]
], [0.5, true])), {position: 0.5});

assert.deepStrictEqual(plain(execute("SetTBarPosition", [
    ["position", "Number", {optional: false}],
    ["release", "Boolean", {optional: true, omitIfDefault: true}]
], [0.5, false])), {position: 0.5, release: false});

assert.deepStrictEqual(plain(execute("SetInputVolume", [
    ["inputName", "String", {optional: true}],
    ["inputUuid", "String", {optional: true}],
    ["inputVolumeMul", "Number", {optional: true}],
    ["inputVolumeDb", "Number", {optional: true}]
], ["Mic", "", "0", ""])), {inputName: "Mic", inputVolumeMul: 0});

sent.length = 0;
logMessages.length = 0;
context.genericCommandExecutor(JSON.stringify({fieldList: [
    ["inputName", "String", {optional: true}],
    ["inputUuid", "String", {optional: true}],
    ["inputVolumeMul", "Number", {optional: true}],
    ["inputVolumeDb", "Number", {optional: true}]
]}), "SetInputVolume", 0, "Mic", "", "1", "-6");
assert.strictEqual(sent.length, 0);
assert.ok(logMessages[0].indexOf("mutually exclusive") !== -1);

assert.deepStrictEqual(plain(execute("SyntheticRequest", [
    ["emptyArray", "Array<String>", {optional: true}],
    ["emptyObject", "Object", {optional: true}],
    ["unsetObject", "Object", {optional: true}]
], ["[]", "{}", ""])), {emptyArray: [], emptyObject: {}});

assert.deepStrictEqual(plain(execute("SyntheticRequest", [
    ["requiredEmptyArray", "Array<String>"],
    ["requiredEmptyObject", "Object"]
], ["[]", "{}"])), {requiredEmptyArray: [], requiredEmptyObject: {}});

assert.deepStrictEqual(plain(execute("SyntheticRequest", [
    ["optionalText", "String", {optional: true, allowEmptyString: true}]
], [""])), {optionalText: ""});

sent.length = 0;
logMessages.length = 0;
context.genericCommandExecutor(JSON.stringify({fieldList: [["profileName", "String"]]}),
    "SetCurrentProfile", 0, "");
assert.strictEqual(sent.length, 0);
assert.ok(logMessages[0].indexOf("required field profileName") !== -1);

assert.deepStrictEqual(plain(execute("OpenSourceProjector", projectorFields57,
    ["", "SPX", "", "0", ""])), {sourceName: "SPX", monitorIndex: 0});

sent.length = 0;
logMessages.length = 0;
context.genericCommandExecutor(JSON.stringify({fieldList: [["requiredText", "String"]]}),
    "SyntheticRequest", 0, undefined);
assert.strictEqual(sent.length, 0);
assert.ok(logMessages[0].indexOf("required field requiredText is undefined; request not sent") !== -1);

wireMessages.length = 0;
context.sendObsCommand = realSendObsCommand;
context.genericCommandExecutor(JSON.stringify({fieldList: projectorFields}),
    "OpenSourceProjector", 0, "SPX", "", 0, "");
assert.deepStrictEqual(plain(wireMessages[0]), {
    op: 6,
    d: {
        requestType: "OpenSourceProjector",
        requestId: "0",
        requestData: {sourceName: "SPX", monitorIndex: 0}
    }
});

var generatedModule = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "module.json"), "utf8"));
var sourceProjectorParameters = generatedModule.commands.OpenSourceProjector.parameters;
assert.deepStrictEqual(Object.keys(sourceProjectorParameters).slice(3), [
    "canvasUuid", "sourceName", "sourceUuid", "monitorIndex", "projectorGeometry"
]);
assert.strictEqual(moduleSource.indexOf(".call("), -1);

console.log("genericCommandExecutor tests passed");
