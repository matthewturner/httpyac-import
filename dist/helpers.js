"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitize = sanitize;
function sanitize(name) {
    return name
        .toLowerCase()
        .replaceAll(' ', '-')
        .replaceAll('"', '')
        .replaceAll('/', '_');
}
//# sourceMappingURL=helpers.js.map