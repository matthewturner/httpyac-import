"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestDefinitionBuilder = void 0;
var RequestDefinitionBuilder = /** @class */ (function () {
    function RequestDefinitionBuilder() {
        this._definition = '';
        this._ignoreHeaders = [];
    }
    RequestDefinitionBuilder.prototype.from = function (item) {
        this._item = item;
        if (this._definition.length > 0) {
            this._definition += '\n\n\n';
        }
        return this;
    };
    RequestDefinitionBuilder.prototype.ignoreHeaders = function (headers) {
        var _a;
        (_a = this._ignoreHeaders).push.apply(_a, headers);
        return this;
    };
    RequestDefinitionBuilder.prototype.appendName = function () {
        this._definition += "### ".concat(this._item.name);
        return this;
    };
    RequestDefinitionBuilder.prototype.appendPreRequestScript = function () {
        var preRequestTest = this._item.events.find(function (e) { return e.listen == 'prerequest'; }, null);
        if (preRequestTest === undefined) {
            return this;
        }
        if (preRequestTest.script.exec.length == 1 && preRequestTest.script.exec[0] == '') {
            console.log('Pre request script is not set');
            return this;
        }
        this._definition += '\n\n{{\n';
        this._definition += '// TODO: Fixup Postman pre-request script\n';
        this._definition += "// ".concat(preRequestTest.script.exec.join('\n//'));
        this._definition += '\n}}';
        return this;
    };
    RequestDefinitionBuilder.prototype.appendTestScript = function () {
        var test = this._item.events.find(function (e) { return e.listen == 'test'; }, null);
        if (test === undefined) {
            return this;
        }
        var handled = true;
        var statusCode = null;
        var idProperty = '';
        var etagProperty = '';
        var idRegex = /\s+pm\.environment\.set\("(\w+)\", pm\.response\.json\(\)\.id\);/;
        var etagRegex = /\s+pm\.environment\.set\("(\w+)\", pm\.response\.headers\.get\(\"Etag\"\)\);/;
        for (var _i = 0, _a = test.script.exec; _i < _a.length; _i++) {
            var statement = _a[_i];
            if (statement.startsWith('pm.test')) {
                continue;
            }
            if (statement === '});') {
                continue;
            }
            if (statement.indexOf('pm.response.to.have.status') >= 0) {
                statusCode = this.statusCodeFor(statement);
                continue;
            }
            var idMatch = idRegex.exec(statement);
            if (idMatch) {
                idProperty = idMatch[1];
                continue;
            }
            var etagMatch = etagRegex.exec(statement);
            if (etagMatch) {
                etagProperty = etagMatch[1];
                continue;
            }
            handled = false;
        }
        if (statusCode != null) {
            this._definition += '\n\n';
            this._definition += "?? status == ".concat(statusCode);
        }
        if (!handled || idProperty != '' || etagProperty != '') {
            this._definition += '\n\n{{';
        }
        if (idProperty != '') {
            this._definition += '\n';
            this._definition += "    $global.".concat(idProperty, " = response.parsedBody.id;");
        }
        if (etagProperty != '') {
            this._definition += '\n';
            this._definition += "    $global.".concat(etagProperty, " = response.headers.etag;");
        }
        if (!handled) {
            this._definition += '\n';
            this._definition += '// TODO: Fixup Postman test script\n';
            this._definition += "// ".concat(test.script.exec.join('\n//'));
            this._definition += '\n}}';
        }
        if (!handled || idProperty != '' || etagProperty != '') {
            this._definition += '\n}}';
        }
        return this;
    };
    RequestDefinitionBuilder.prototype.appendHeaders = function () {
        if (this._item.request.headers === undefined) {
            return this;
        }
        for (var _i = 0, _a = this._item.request.headers.all(); _i < _a.length; _i++) {
            var header = _a[_i];
            if (!this.shouldInclude(header.key)) {
                continue;
            }
            this._definition += '\n';
            this._definition += "".concat(header.key, ": ").concat(header.value);
        }
        return this;
    };
    RequestDefinitionBuilder.prototype.shouldInclude = function (header) {
        for (var _i = 0, _a = this._ignoreHeaders; _i < _a.length; _i++) {
            var ignoreHeader = _a[_i];
            if (header.match(ignoreHeader)) {
                console.log("Ignoring header ".concat(header, "..."));
                return false;
            }
        }
        return true;
    };
    RequestDefinitionBuilder.prototype.appendBody = function () {
        if (this._item.request.body === undefined) {
            return this;
        }
        this._definition += '\n';
        this._definition += 'Content-Type: application/json';
        this._definition += '\n\n';
        this._definition += this._item.request.body.toString();
        return this;
    };
    RequestDefinitionBuilder.prototype.appendRequest = function () {
        this._definition += '\n\n';
        this._definition += "".concat(this._item.request.method, " ").concat(this._item.request.url.getHost()).concat(this._item.request.url.getPath());
        var paramCount = 0;
        for (var _i = 0, _a = this._item.request.url.query.all(); _i < _a.length; _i++) {
            var x = _a[_i];
            if (paramCount == 0) {
                this._definition += "\n    ?".concat(x);
                paramCount++;
            }
            else {
                this._definition += "\n    &".concat(x);
            }
        }
        return this;
    };
    RequestDefinitionBuilder.prototype.toString = function () {
        return this._definition;
    };
    RequestDefinitionBuilder.prototype.statusCodeFor = function (statement) {
        var statusCodeMatch = statement.match(/have\.status\((\d+)\)/);
        if (statusCodeMatch) {
            return statusCodeMatch[1];
        }
        return null;
    };
    return RequestDefinitionBuilder;
}());
exports.RequestDefinitionBuilder = RequestDefinitionBuilder;
//# sourceMappingURL=RequestDefinitionBuilder.js.map