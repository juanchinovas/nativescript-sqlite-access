function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var tab_content_item_common_1 = require("./tab-content-item-common");
var view_1 = require("../../core/view");
__export(require("./tab-content-item-common"));
var TabContentItem = (function (_super) {
    __extends(TabContentItem, _super);
    function TabContentItem() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(TabContentItem.prototype, "_hasFragments", {
        get: function () {
            return true;
        },
        enumerable: true,
        configurable: true
    });
    TabContentItem.prototype.disposeNativeView = function () {
        _super.prototype.disposeNativeView.call(this);
        this.canBeLoaded = false;
    };
    TabContentItem.prototype._getChildFragmentManager = function () {
        var tabView = this.parent;
        var tabFragment = null;
        var fragmentManager = tabView._getFragmentManager();
        if (typeof this.index === "undefined") {
            view_1.traceWrite("Current TabContentItem index is not set", tab_content_item_common_1.traceCategory, view_1.traceMessageType.error);
        }
        for (var _i = 0, _a = fragmentManager.getFragments().toArray(); _i < _a.length; _i++) {
            var fragment = _a[_i];
            if (fragment.index === this.index) {
                tabFragment = fragment;
                break;
            }
        }
        if (!tabFragment) {
            return tabView._getRootFragmentManager();
        }
        return tabFragment.getChildFragmentManager();
    };
    return TabContentItem;
}(tab_content_item_common_1.TabContentItemBase));
exports.TabContentItem = TabContentItem;
//# sourceMappingURL=tab-content-item.android.js.map