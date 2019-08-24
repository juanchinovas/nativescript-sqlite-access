function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var view_1 = require("../../core/view");
var text_base_1 = require("../../text-base");
__export(require("../../core/view"));
exports.traceCategory = "TabView";
var TabStripItem = (function (_super) {
    __extends(TabStripItem, _super);
    function TabStripItem() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TabStripItem_1 = TabStripItem;
    TabStripItem.prototype._addChildFromBuilder = function (name, value) {
        if (name === "Image") {
            this.image = value;
            this.iconSource = value.src;
            this._addView(value);
        }
        if (name === "Label") {
            this.label = value;
            this.title = value.text;
            this._addView(value);
        }
    };
    TabStripItem.prototype.requestLayout = function () {
        var parent = this.parent;
        if (parent) {
            parent.requestLayout();
        }
    };
    TabStripItem.prototype._updateTabStateChangeHandler = function (subscribe) {
        var _this = this;
        if (subscribe) {
            this._highlightedHandler = this._highlightedHandler || (function () {
                _this._goToVisualState("highlighted");
            });
            this._normalHandler = this._normalHandler || (function () {
                _this._goToVisualState("normal");
            });
            this.on(TabStripItem_1.selectEvent, this._highlightedHandler);
            this.on(TabStripItem_1.unselectEvent, this._normalHandler);
            var parent_1 = this.parent;
            var tabStripParent = parent_1 && parent_1.parent;
            if (this.index === tabStripParent.selectedIndex) {
                this._goToVisualState("highlighted");
            }
        }
        else {
            this.off(TabStripItem_1.selectEvent, this._highlightedHandler);
            this.off(TabStripItem_1.unselectEvent, this._normalHandler);
        }
    };
    TabStripItem.prototype[view_1.backgroundColorProperty.getDefault] = function () {
        var parent = this.parent;
        var tabStripParent = parent && parent.parent;
        return tabStripParent && tabStripParent.getTabBarBackgroundColor();
    };
    TabStripItem.prototype[view_1.backgroundColorProperty.setNative] = function (value) {
        var parent = this.parent;
        var tabStripParent = parent && parent.parent;
        return tabStripParent && tabStripParent.setTabBarItemBackgroundColor(this, value);
    };
    TabStripItem.prototype[view_1.backgroundInternalProperty.getDefault] = function () {
        return null;
    };
    TabStripItem.prototype[view_1.backgroundInternalProperty.setNative] = function (value) {
    };
    TabStripItem.prototype[view_1.colorProperty.getDefault] = function () {
        var parent = this.parent;
        var tabStripParent = parent && parent.parent;
        return tabStripParent && tabStripParent.getTabBarItemColor(this);
    };
    TabStripItem.prototype[view_1.colorProperty.setNative] = function (value) {
        var parent = this.parent;
        var tabStripParent = parent && parent.parent;
        return tabStripParent && tabStripParent.setTabBarItemColor(this, value);
    };
    TabStripItem.prototype[view_1.fontSizeProperty.getDefault] = function () {
        var parent = this.parent;
        var tabStripParent = parent && parent.parent;
        return tabStripParent && tabStripParent.getTabBarItemFontSize(this);
    };
    TabStripItem.prototype[view_1.fontSizeProperty.setNative] = function (value) {
        var parent = this.parent;
        var tabStripParent = parent && parent.parent;
        return tabStripParent && tabStripParent.setTabBarItemFontSize(this, value);
    };
    TabStripItem.prototype[view_1.fontInternalProperty.getDefault] = function () {
        var parent = this.parent;
        var tabStripParent = parent && parent.parent;
        return tabStripParent && tabStripParent.getTabBarItemFontInternal(this);
    };
    TabStripItem.prototype[view_1.fontInternalProperty.setNative] = function (value) {
        var parent = this.parent;
        var tabStripParent = parent && parent.parent;
        return tabStripParent && tabStripParent.setTabBarItemFontInternal(this, value);
    };
    TabStripItem.prototype[text_base_1.textTransformProperty.getDefault] = function () {
        var parent = this.parent;
        var tabStripParent = parent && parent.parent;
        return tabStripParent && tabStripParent.getTabBarItemTextTransform(this);
    };
    TabStripItem.prototype[text_base_1.textTransformProperty.setNative] = function (value) {
        var parent = this.parent;
        var tabStripParent = parent && parent.parent;
        return tabStripParent && tabStripParent.setTabBarItemTextTransform(this, value);
    };
    var TabStripItem_1;
    TabStripItem.tapEvent = "tap";
    TabStripItem.selectEvent = "select";
    TabStripItem.unselectEvent = "unselect";
    __decorate([
        view_1.PseudoClassHandler("normal", "highlighted", "pressed", "active")
    ], TabStripItem.prototype, "_updateTabStateChangeHandler", null);
    TabStripItem = TabStripItem_1 = __decorate([
        view_1.CSSType("TabStripItem")
    ], TabStripItem);
    return TabStripItem;
}(view_1.View));
exports.TabStripItem = TabStripItem;
//# sourceMappingURL=tab-strip-item.js.map