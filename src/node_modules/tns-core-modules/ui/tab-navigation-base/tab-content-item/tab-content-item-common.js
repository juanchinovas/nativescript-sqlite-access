Object.defineProperty(exports, "__esModule", { value: true });
var view_1 = require("../../core/view");
exports.traceCategory = "TabView";
var TabContentItemBase = (function (_super) {
    __extends(TabContentItemBase, _super);
    function TabContentItemBase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TabContentItemBase.prototype._addChildFromBuilder = function (name, value) {
        if (value instanceof view_1.View) {
            this.view = value;
        }
    };
    Object.defineProperty(TabContentItemBase.prototype, "view", {
        get: function () {
            return this._view;
        },
        set: function (value) {
            if (this._view !== value) {
                if (this._view) {
                    throw new Error("Changing the view of an already loaded TabContentItem is not currently supported.");
                }
                this._view = value;
                this._addView(value);
            }
        },
        enumerable: true,
        configurable: true
    });
    TabContentItemBase.prototype.eachChild = function (callback) {
        var view = this._view;
        if (view) {
            callback(view);
        }
    };
    TabContentItemBase.prototype.loadView = function (view) {
        var tabView = this.parent;
        if (tabView && tabView.items) {
            if (this.canBeLoaded) {
                _super.prototype.loadView.call(this, view);
            }
        }
    };
    TabContentItemBase = __decorate([
        view_1.CSSType("TabContentItem")
    ], TabContentItemBase);
    return TabContentItemBase;
}(view_1.ViewBase));
exports.TabContentItemBase = TabContentItemBase;
//# sourceMappingURL=tab-content-item-common.js.map