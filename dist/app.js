#! /usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var postman_collection_1 = require("postman-collection");
var ts_command_line_args_1 = require("ts-command-line-args");
var path_1 = require("path");
var helpers_1 = require("./helpers");
var RequestDefinitionBuilder_1 = require("./RequestDefinitionBuilder");
var args = (0, ts_command_line_args_1.parse)({
    sourcePath: {
        type: String, alias: 's', optional: true, description: 'Path to the exported postman_collection.json'
    },
    targetPath: {
        type: String, alias: 'd', optional: true, description: 'Path to the root directory to output the .http files'
    },
    ignoreHeaders: {
        type: String,
        alias: 'i',
        multiple: true,
        optional: true,
        description: 'List of headers to ignore, useful when using default headers. Supports regex patterns',
        defaultValue: []
    },
    help: {
        type: Boolean, optional: true, alias: 'h', description: 'Prints this usage guide'
    },
}, {
    helpArg: 'help',
    headerContentSections: [{ header: 'HttpYac Import', content: 'Converts Postman collections to HttpYac format' }]
});
var sourcePostmanCollectionPath = args.sourcePath.toString();
var sourcePostmanCollection = JSON.parse((0, fs_1.readFileSync)(sourcePostmanCollectionPath).toString());
var targetPaths = [args.targetPath];
var sourceCollection = new postman_collection_1.Collection(sourcePostmanCollection);
function processItems(items) {
    for (var _i = 0, _a = items.all(); _i < _a.length; _i++) {
        var item = _a[_i];
        if (item instanceof postman_collection_1.Item) {
            processItem(item);
            continue;
        }
        var propertyGroup = item;
        targetPaths.push((0, helpers_1.sanitize)(item.name));
        processItems(propertyGroup.items);
        targetPaths.pop();
    }
}
function processItem(item) {
    var directory = path_1.join.apply(void 0, targetPaths);
    if (!(0, fs_1.existsSync)(directory)) {
        console.log("Creating directory ".concat(directory, "..."));
        (0, fs_1.mkdirSync)(directory, { recursive: true });
    }
    var filename = "".concat((0, helpers_1.sanitize)(item.name), ".http");
    console.log("Creating file ".concat(filename, "..."));
    var path = (0, path_1.join)(directory, filename);
    console.log('Writing request definition...');
    var requestDefinition = new RequestDefinitionBuilder_1.RequestDefinitionBuilder()
        .ignoreHeaders(args.ignoreHeaders)
        .from(item)
        .appendName()
        .appendRequest()
        .appendHeaders()
        .appendBody()
        .appendPreRequestScript()
        .appendTestScript()
        .toString();
    console.log(requestDefinition);
    (0, fs_1.writeFileSync)(path, requestDefinition, { flag: 'w' });
}
processItems(sourceCollection.items);
//# sourceMappingURL=app.js.map