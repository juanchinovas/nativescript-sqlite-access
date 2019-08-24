Object.defineProperty(exports, "__esModule", { value: true });
var color_1 = require("../../../color");
var view_1 = require("../../core/view");
var text_base_1 = require("../../text-base");
exports.traceCategory = "TabView";
exports.highlightColorProperty = new view_1.Property({ name: "highlightColor", equalityComparer: color_1.Color.equals, valueConverter: function (v) { return new color_1.Color(v); } });
var TabStrip = (function (_super) {
    __extends(TabStrip, _super);
    function TabStrip() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TabStrip.prototype.eachChild = function (callback) {
        var items = this.items;
        if (items) {
            items.forEach(function (item, i) {
                callback(item);
            });
        }
    };
    TabStrip.prototype._addArrayFromBuilder = function (name, value) {
        if (name === "items") {
            this.items = value;
        }
    };
    TabStrip.prototype._addChildFromBuilder = function (name, value) {
        if (name === "TabStripItem") {
            if (!this.items) {
                this.items = new Array();
            }
            this.items.push(value);
            this._addView(value);
        }
    };
    TabStrip.prototype[view_1.backgroundColorProperty.getDefault] = function () {
        var parent = this.parent;
        return parent && parent.getTabBarBackgroundColor();
    };
    TabStrip.prototype[view_1.backgroundColorProperty.setNative] = function (value) {
        var parent = this.parent;
        return parent && parent.setTabBarBackgroundColor(value);
    };
    TabStrip.prototype[view_1.backgroundInternalProperty.getDefault] = function () {
        return null;
    };
    TabStrip.prototype[view_1.backgroundInternalProperty.setNative] = function (value) {
    };
    TabStrip.prototype[view_1.colorProperty.getDefault] = function () {
        var parent = this.parent;
        return parent && parent.getTabBarColor();
    };
    TabStrip.prototype[view_1.colorProperty.setNative] = function (value) {
        var parent = this.parent;
        return parent && parent.setTabBarColor(value);
    };
    TabStrip.prototype[view_1.fontInternalProperty.getDefault] = function () {
        var parent = this.parent;
        return parent && parent.getTabBarFontInternal();
    };
    TabStrip.prototype[view_1.fontInternalProperty.setNative] = function (value) {
        var parent = this.parent;
        return parent && parent.setTabBarFontInternal(value);
    };
    TabStrip.prototype[text_base_1.textTransformProperty.getDefault] = function () {
        var parent = this.parent;
        return parent && parent.getTabBarTextTransform();
    };
    TabStrip.prototype[text_base_1.textTransformProperty.setNative] = function (value) {
        var parent = this.parent;
        return parent && parent.setTabBarTextTransform(value);
    };
    TabStrip.prototype[exports.highlightColorProperty.getDefault] = function () {
        var parent = this.parent;
        return parent && parent.getTabBarHighlightColor();
    };
    TabStrip.prototype[exports.highlightColorProperty.setNative] = function (value) {
        var parent = this.parent;
        return parent && parent.setTabBarHighlightColor(value);
    };
    TabStrip = __decorate([
        view_1.CSSType("TabStrip")
    ], TabStrip);
    return TabStrip;
}(view_1.View));
exports.TabStrip = TabStrip;
exports.iosIconRenderingModeProperty = new view_1.Property({ name: "iosIconRenderingMode", defaultValue: "automatic" });
exports.iosIconRenderingModeProperty.register(TabStrip);
exports.highlightColorProperty.register(TabStrip);
//# sourceMappingURL=tab-strip.js.map