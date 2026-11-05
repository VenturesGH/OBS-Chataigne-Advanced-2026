"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var rootDirectory = path.join(__dirname, "..");
var moduleSource = fs.readFileSync(path.join(rootDirectory, "OBSAdvanced.js"), "utf8");
var moduleDefinition = JSON.parse(fs.readFileSync(path.join(rootDirectory, "module.json"), "utf8"));
var sentMessages = [];
var logMessages = [];

function MockParameter(value) {
    this.value = value;
    this.setHistory = [];
}
MockParameter.prototype.get = function () { return this.value; };
MockParameter.prototype.set = function (value) {
    this.value = value;
    this.setHistory.push(value);
};
MockParameter.prototype.setAttribute = function () {};

function MockContainer(name) {
    this.name = name || "root";
    this.children = {};
}
MockContainer.prototype.getChild = function (name) { return this.children[name] || null; };
MockContainer.prototype.addContainer = function (name) {
    if (!this.children[name]) this.children[name] = new MockContainer(name);
    return this.children[name];
};
MockContainer.prototype.removeContainer = function (name) { delete this.children[name]; };
MockContainer.prototype.clear = function () { this.children = {}; };
MockContainer.prototype.addBoolParameter = function (name, description, value) {
    this.children[name] = new MockParameter(value);
    return this.children[name];
};
MockContainer.prototype.addStringParameter = MockContainer.prototype.addBoolParameter;
MockContainer.prototype.addFloatParameter = MockContainer.prototype.addBoolParameter;
MockContainer.prototype.addIntParameter = MockContainer.prototype.addBoolParameter;

function parameterTree(values) {
    var result = {};
    Object.keys(values).forEach(function (key) {
        result[key] = new MockParameter(values[key]);
    });
    return result;
}

var eventSubscriptions = parameterTree({
    general: true,
    config: true,
    scenes: true,
    inputs: true,
    transitions: true,
    filters: true,
    outputs: true,
    sceneItems: true,
    mediaInputs: true,
    vendors: true,
    ui: true,
    canvases: true,
    inputVolumeMeters: false,
    inputActiveStateChanged: false,
    inputShowStateChanged: false,
    sceneItemTransformChanged: false
});

var valuesRoot = new MockContainer("values");
var context = {
    console: console,
    script: {log: function () { logMessages.push(Array.prototype.join.call(arguments, " ")); }},
    local: {
        enabled: new MockParameter(true),
        values: valuesRoot,
        parameters: {
            eventSub: eventSubscriptions,
            enableAuthentication: new MockParameter(true),
            password: new MockParameter("secret")
        },
        send: function (message) { sentMessages.push(JSON.parse(message)); }
    },
    util: {
        encodeSHA256: function () {
            return "0000000000000000000000000000000000000000000000000000000000000000";
        },
        toBase64: function () { return "hash"; }
    }
};

vm.createContext(context);
vm.runInContext(moduleSource, context, {filename: "OBSAdvanced.js"});

assert.ok(moduleSource.indexOf("function wsMessageReceived(message)") !== -1,
    "WebSocket clients must use Chataigne's one-argument callback");

// OBS sends Hello only once, immediately after the socket opens. Reconnecting
// on the first update tick guarantees the script-loading transaction is over.
context.init();
assert.deepStrictEqual(context.local.enabled.setHistory, []);
context.update(0.02);
assert.deepStrictEqual(context.local.enabled.setHistory, [false, true]);
context.update(0.02);
assert.deepStrictEqual(context.local.enabled.setHistory, [false, true]);

// Every protocol request must be exposed as a generated Chataigne command.
assert.strictEqual(context.API.requests.length, 147);
assert.strictEqual(context.API.events.length, 60);
context.API.requests.forEach(function (request) {
    var command = moduleDefinition.commands[request.requestType];
    assert.ok(command, "missing command for " + request.requestType);
    assert.strictEqual(command.callback, "genericCommandExecutor");
    assert.strictEqual(command.parameters.requestId.type, "String");

    var generatedFields = JSON.parse(command.parameters.data.default).fieldList;
    var expectedFields = request.requestFields.filter(function (field) {
        return field.valueName.indexOf(".") === -1;
    });
    assert.deepStrictEqual(
        JSON.parse(JSON.stringify(generatedFields.map(function (field) { return field[0]; }))),
        JSON.parse(JSON.stringify(expectedFields.map(function (field) { return field.valueName; })))
    );
    generatedFields.forEach(function (field, index) {
        assert.strictEqual(field[2].optional, expectedFields[index].valueOptional,
            request.requestType + "." + field[0] + " optionality mismatch");
    });
});

assert.ok(moduleDefinition.commands.GetCanvasList);
assert.ok(moduleDefinition.commands.GetInputDeinterlaceMode);
assert.ok(moduleDefinition.commands["Request Batch"]);
assert.strictEqual(moduleDefinition.parameters.EventSub.Canvases.default, true);

// Hello without authentication: authentication must be omitted, and the new
// canvases subscription bit must be part of the Identify payload.
sentMessages.length = 0;
context.wsMessageReceived(JSON.stringify({
    op: 0,
    d: {
        obsStudioVersion: "32.1.0",
        obsWebSocketVersion: "5.7.0",
        rpcVersion: 1
    }
}));
assert.strictEqual(sentMessages.length, 1);
assert.strictEqual(sentMessages[0].op, 1);
assert.strictEqual(sentMessages[0].d.rpcVersion, 1);
assert.strictEqual(sentMessages[0].d.authentication, undefined);
assert.ok((sentMessages[0].d.eventSubscriptions & (1 << 11)) !== 0);

// Successful identification triggers the parameterless Get requests and all
// generated request ids are normalized to protocol-required strings.
sentMessages.length = 0;
context.wsMessageReceived(JSON.stringify({op: 2, d: {negotiatedRpcVersion: 1}}));
assert.ok(sentMessages.length > 10);
sentMessages.forEach(function (message) {
    assert.strictEqual(message.op, 6);
    assert.strictEqual(typeof message.d.requestId, "string");
});

// Subscription changes use Reidentify instead of requiring a reconnect.
sentMessages.length = 0;
context.moduleParameterChanged({name: "canvases"});
assert.strictEqual(sentMessages[0].op, 3);

// Request arrays use request mappings (not the old hard-coded events prefix).
context.wsMessageReceived(JSON.stringify({
    op: 7,
    d: {
        requestType: "GetMonitorList",
        requestId: "monitors",
        requestStatus: {result: true, code: 100},
        responseData: {
            monitors: [
                {monitorName: "Right(0)", monitorIndex: 0, monitorWidth: 1920,
                    monitorHeight: 1080, monitorPositionX: 1920, monitorPositionY: 0},
                {monitorName: "Left(1)", monitorIndex: 1, monitorWidth: 1920,
                    monitorHeight: 1080, monitorPositionX: 0, monitorPositionY: 0}
            ]
        }
    }
}));
var monitorResponse = valuesRoot.getChild("Responses").getChild("GetMonitorList");
assert.ok(monitorResponse.getChild("Monitor: 0"));
assert.ok(monitorResponse.getChild("Monitor: 1"));
assert.strictEqual(monitorResponse.getChild("monitorCount").value, 2);
assert.strictEqual(valuesRoot.getChild("Merged").getChild("Monitoren")
    .getChild("Links naar rechts").value, "1;0");

// Object response fields are retained as JSON instead of being discarded.
context.wsMessageReceived(JSON.stringify({
    op: 7,
    d: {
        requestType: "GetInputSettings",
        requestId: "settings",
        requestStatus: {result: true, code: 100},
        responseData: {inputSettings: {url: "https://example.invalid"}, inputKind: "browser_source"}
    }
}));
var settings = valuesRoot.getChild("Responses").getChild("GetInputSettings");
assert.strictEqual(settings.getChild("inputSettings").value,
    JSON.stringify({url: "https://example.invalid"}));

// Failed request responses have no responseData; they must be visible and not
// crash the generic response renderer.
context.wsMessageReceived(JSON.stringify({
    op: 7,
    d: {
        requestType: "OpenSourceProjector",
        requestId: "bad-projector",
        requestStatus: {result: false, code: 601, comment: "Parameter: sourceName"}
    }
}));
var failed = valuesRoot.getChild("Responses").getChild("OpenSourceProjector");
assert.strictEqual(failed.getChild("success").value, false);
assert.strictEqual(failed.getChild("statusCode").value, 601);

// Batch opcode 8 generation and opcode 9 response rendering.
sentMessages.length = 0;
context.sendRequestBatch("batch-1", true, 0, '[{"requestType":"GetVersion"}]');
assert.deepStrictEqual(JSON.parse(JSON.stringify(sentMessages[0])), {
    op: 8,
    d: {
        requestId: "batch-1",
        haltOnFailure: true,
        executionType: 0,
        requests: [{requestType: "GetVersion"}]
    }
});
context.wsMessageReceived(JSON.stringify({
    op: 9,
    d: {
        requestId: "batch-1",
        results: [{
            requestType: "GetVersion",
            requestId: "one",
            requestStatus: {result: true, code: 100},
            responseData: {obsVersion: "32.1.0"}
        }]
    }
}));
assert.strictEqual(valuesRoot.getChild("Responses").getChild("Batch")
    .getChild("batch-1").getChild("resultCount").value, 1);

console.log("protocol integration tests passed");
