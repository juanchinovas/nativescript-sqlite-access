Object.defineProperty(exports, "__esModule", { value: true });
function sanitizeModuleName(moduleName, removeExtension) {
    if (removeExtension === void 0) { removeExtension = true; }
    moduleName = moduleName.trim();
    if (moduleName.startsWith("~/")) {
        moduleName = moduleName.substring(2);
    }
    else if (moduleName.startsWith("/")) {
        moduleName = moduleName.substring(1);
    }
    if (removeExtension) {
        var lastDot = moduleName.lastIndexOf(".");
        if (lastDot > 0) {
            moduleName = moduleName.substr(0, lastDot);
        }
    }
    return moduleName;
}
exports.sanitizeModuleName = sanitizeModuleName;
//# sourceMappingURL=module-name-sanitizer.js.map