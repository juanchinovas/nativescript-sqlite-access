"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getTypeCode(value) {
    if (!parseFloat(value))
        return 1;
    if (!!parseFloat(value) && Number.isInteger(value))
        return 2;
    return 3;
}
exports.getTypeCode = getTypeCode;
//# sourceMappingURL=Common.js.map