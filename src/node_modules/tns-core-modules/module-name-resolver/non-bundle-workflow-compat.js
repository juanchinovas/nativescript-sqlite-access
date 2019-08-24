Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("../file-system/file-system");
var appCommonModule = require("../application/application-common");
var cache = new Set();
var initialized = false;
function register(name, loader) {
    global.registerModule(name, loader);
}
function processFile(file) {
    var filePathRelativeToApp = file.path.substr(fs.knownFolders.currentApp().path.length + 1);
    var loadContent = function () { return file.readTextSync(); };
    switch (file.extension.toLocaleLowerCase()) {
        case ".js":
            var noExtPath = filePathRelativeToApp.substr(0, filePathRelativeToApp.length - ".js".length);
            register(filePathRelativeToApp, function () { return global.require(file.path); });
            register(noExtPath, function () { return global.require(file.path); });
            break;
        case ".css":
            register(filePathRelativeToApp, loadContent);
            break;
        case ".xml":
            register(filePathRelativeToApp, loadContent);
            break;
    }
    if (file.name === "package.json") {
        var json = global.require(file.path);
        if (json.main) {
            var name_1 = filePathRelativeToApp.substr(0, filePathRelativeToApp.length - "package.json".length - 1);
            var requirePath_1 = fs.path.join(file.parent.path, json.main);
            if (name_1.startsWith("tns_modules")) {
                name_1 = name_1.substr("tns_modules".length + 1);
            }
            register(name_1, function () { return global.require(requirePath_1); });
        }
    }
}
function processFolder(path) {
    if (fs.Folder.exists(path)) {
        var folder = fs.Folder.fromPath(path);
        folder.eachEntity(function (file) {
            if (file instanceof fs.File) {
                processFile(file);
            }
            return true;
        });
    }
}
function registerModulesFromFileSystem(moduleName) {
    initialize();
    if (cache.has(moduleName)) {
        return;
    }
    cache.add(moduleName);
    var path = fs.path.join(fs.knownFolders.currentApp().path, moduleName);
    if (fs.Folder.exists(path)) {
        processFolder(path);
        return;
    }
    var parentName = moduleName.substr(0, moduleName.lastIndexOf(fs.path.separator));
    var parentFolderPath = fs.path.join(fs.knownFolders.currentApp().path, parentName);
    if (fs.Folder.exists(parentFolderPath)) {
        processFolder(parentFolderPath);
        return;
    }
    var tnsModulesPath = fs.path.join(fs.knownFolders.currentApp().path, "tns_modules", moduleName);
    if (fs.Folder.exists(tnsModulesPath)) {
        processFolder(tnsModulesPath);
        return;
    }
    if (parentName) {
        var tnsParentFolderPath = fs.path.join(fs.knownFolders.currentApp().path, "tns_modules", parentName);
        if (fs.Folder.exists(tnsParentFolderPath)) {
            processFolder(tnsParentFolderPath);
            return;
        }
    }
}
exports.registerModulesFromFileSystem = registerModulesFromFileSystem;
function initialize() {
    if (!initialized) {
        appCommonModule.on("livesync", function (args) { return cache.clear(); });
        initialized = true;
    }
}
//# sourceMappingURL=non-bundle-workflow-compat.js.map