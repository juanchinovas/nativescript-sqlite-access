function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
var tab_navigation_base_1 = require("../tab-navigation-base/tab-navigation-base");
var tabs_common_1 = require("./tabs-common");
var frame_1 = require("../frame");
var view_1 = require("../core/view");
var color_1 = require("../../color");
var utils_1 = require("../../utils/utils");
var image_source_1 = require("../../image-source");
__export(require("./tabs-common"));
var MDCTabBarDelegateImpl = (function (_super) {
    __extends(MDCTabBarDelegateImpl, _super);
    function MDCTabBarDelegateImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MDCTabBarDelegateImpl.initWithOwner = function (owner) {
        var delegate = MDCTabBarDelegateImpl.new();
        delegate._owner = owner;
        return delegate;
    };
    MDCTabBarDelegateImpl.prototype.tabBarShouldSelectItem = function (tabBar, item) {
        var owner = this._owner.get();
        var shouldSelectItem = owner._canSelectItem;
        var selectedIndex = owner.tabBarItems.indexOf(item);
        if (owner.selectedIndex !== selectedIndex) {
            owner._canSelectItem = false;
        }
        return shouldSelectItem;
    };
    MDCTabBarDelegateImpl.prototype.tabBarWillSelectItem = function (tabBar, item) {
    };
    MDCTabBarDelegateImpl.prototype.tabBarDidSelectItem = function (tabBar, selectedItem) {
        var owner = this._owner.get();
        var tabBarItems = owner.tabBarItems;
        var selectedIndex = tabBarItems.indexOf(selectedItem);
        owner.selectedIndex = selectedIndex;
    };
    MDCTabBarDelegateImpl.ObjCProtocols = [MDCTabBarDelegate];
    return MDCTabBarDelegateImpl;
}(NSObject));
var UIPageViewControllerImpl = (function (_super) {
    __extends(UIPageViewControllerImpl, _super);
    function UIPageViewControllerImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    UIPageViewControllerImpl.initWithOwner = function (owner) {
        var handler = UIPageViewControllerImpl.alloc().initWithTransitionStyleNavigationOrientationOptions(1, 0, null);
        handler._owner = owner;
        return handler;
    };
    UIPageViewControllerImpl.prototype.viewDidLoad = function () {
        var owner = this._owner.get();
        var tabBarItems = owner.tabBarItems;
        var tabBar = MDCTabBar.alloc().initWithFrame(this.view.bounds);
        if (tabBarItems && tabBarItems.length) {
            tabBar.items = NSArray.arrayWithArray(tabBarItems);
        }
        tabBar.delegate = this.tabBarDelegate = MDCTabBarDelegateImpl.initWithOwner(new WeakRef(owner));
        tabBar.tintColor = UIColor.blueColor;
        tabBar.barTintColor = UIColor.whiteColor;
        tabBar.setTitleColorForState(UIColor.blackColor, 0);
        tabBar.setTitleColorForState(UIColor.blackColor, 1);
        tabBar.autoresizingMask = 2 | 32;
        tabBar.alignment = 0;
        tabBar.sizeToFit();
        this.tabBar = tabBar;
        this.view.addSubview(tabBar);
    };
    UIPageViewControllerImpl.prototype.viewWillAppear = function (animated) {
        _super.prototype.viewWillAppear.call(this, animated);
        var owner = this._owner.get();
        if (!owner) {
            return;
        }
        if (!owner.isLoaded) {
            owner.callLoaded();
        }
    };
    UIPageViewControllerImpl.prototype.viewDidLayoutSubviews = function () {
        _super.prototype.viewDidLayoutSubviews.call(this);
        var owner = this._owner.get();
        if (!owner) {
            return;
        }
        var tabsPosition = owner.tabsPosition;
        var parent = owner.parent;
        var tabBarTop = this.view.safeAreaInsets.top;
        var tabBarHeight = this.tabBar.frame.size.height;
        var scrollViewTop = this.tabBar.frame.size.height;
        var scrollViewHeight = this.view.bounds.size.height - this.tabBar.frame.size.height;
        if (parent) {
            tabBarTop = Math.max(this.view.safeAreaInsets.top, owner.parent.nativeView.safeAreaInsets.top);
        }
        if (tabsPosition === "bottom") {
            tabBarTop = this.view.frame.size.height - this.tabBar.frame.size.height - this.view.safeAreaInsets.bottom;
            scrollViewTop = this.view.frame.origin.y;
            scrollViewHeight = this.view.frame.size.height - this.view.safeAreaInsets.bottom;
        }
        this.tabBar.frame = CGRectMake(this.view.safeAreaInsets.left, tabBarTop, this.tabBar.frame.size.width, tabBarHeight);
        var subViews = this.view.subviews;
        var scrollView = null;
        var mdcBar = null;
        for (var i = 0; i < subViews.count; i++) {
            var view = subViews[i];
            if (view instanceof UIScrollView) {
                scrollView = view;
            }
            if (view instanceof MDCTabBar) {
                mdcBar = view;
            }
        }
        if (scrollView) {
            this.scrollView = scrollView;
            if (!owner.swipeEnabled) {
                scrollView.scrollEnabled = false;
            }
            scrollView.frame = CGRectMake(this.view.safeAreaInsets.left, scrollViewTop, this.view.bounds.size.width, scrollViewHeight);
        }
    };
    return UIPageViewControllerImpl;
}(UIPageViewController));
var UIPageViewControllerDataSourceImpl = (function (_super) {
    __extends(UIPageViewControllerDataSourceImpl, _super);
    function UIPageViewControllerDataSourceImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    UIPageViewControllerDataSourceImpl.initWithOwner = function (owner) {
        var dataSource = UIPageViewControllerDataSourceImpl.new();
        dataSource._owner = owner;
        return dataSource;
    };
    UIPageViewControllerDataSourceImpl.prototype.pageViewControllerViewControllerBeforeViewController = function (pageViewController, viewController) {
        var owner = this._owner.get();
        var selectedIndex = owner.selectedIndex;
        if (selectedIndex === 0) {
            return null;
        }
        selectedIndex--;
        var prevItem = owner.items[selectedIndex];
        var prevViewController = prevItem.__controller;
        owner._setCanBeLoaded(selectedIndex);
        owner._loadUnloadTabItems(selectedIndex);
        return prevViewController;
    };
    UIPageViewControllerDataSourceImpl.prototype.pageViewControllerViewControllerAfterViewController = function (pageViewController, viewController) {
        var owner = this._owner.get();
        var selectedIndex = owner.selectedIndex;
        if (selectedIndex === owner.items.length - 1) {
            return null;
        }
        selectedIndex++;
        var nextItem = owner.items[selectedIndex];
        var nextViewController = nextItem.__controller;
        owner._setCanBeLoaded(selectedIndex);
        owner._loadUnloadTabItems(selectedIndex);
        return nextViewController;
    };
    UIPageViewControllerDataSourceImpl.prototype.presentationCountForPageViewController = function (pageViewController) {
        return 0;
    };
    UIPageViewControllerDataSourceImpl.prototype.presentationIndexForPageViewController = function (pageViewController) {
        return 0;
    };
    UIPageViewControllerDataSourceImpl.ObjCProtocols = [UIPageViewControllerDataSource];
    return UIPageViewControllerDataSourceImpl;
}(NSObject));
var UIPageViewControllerDelegateImpl = (function (_super) {
    __extends(UIPageViewControllerDelegateImpl, _super);
    function UIPageViewControllerDelegateImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    UIPageViewControllerDelegateImpl.initWithOwner = function (owner) {
        var delegate = UIPageViewControllerDelegateImpl.new();
        delegate._owner = owner;
        return delegate;
    };
    UIPageViewControllerDelegateImpl.prototype.pageViewControllerWillTransitionToViewControllers = function (pageViewController, viewControllers) {
    };
    UIPageViewControllerDelegateImpl.prototype.pageViewControllerDidFinishAnimatingPreviousViewControllersTransitionCompleted = function (pageViewController, didFinishAnimating, previousViewControllers, transitionCompleted) {
        if (!transitionCompleted) {
            return;
        }
        var owner = this._owner.get();
        var ownerViewControllers = owner.viewControllers;
        var selectedIndex = owner.selectedIndex;
        var nextViewController = pageViewController.viewControllers[0];
        var nextViewControllerIndex = ownerViewControllers.indexOf(nextViewController);
        if (selectedIndex !== nextViewControllerIndex) {
            owner.selectedIndex = nextViewControllerIndex;
            owner._canSelectItem = true;
        }
    };
    UIPageViewControllerDelegateImpl.ObjCProtocols = [UIPageViewControllerDelegate];
    return UIPageViewControllerDelegateImpl;
}(NSObject));
function iterateIndexRange(index, eps, lastIndex, callback) {
    var rangeStart = Math.max(0, index - eps);
    var rangeEnd = Math.min(index + eps, lastIndex);
    for (var i = rangeStart; i <= rangeEnd; i++) {
        callback(i);
    }
}
var Tabs = (function (_super) {
    __extends(Tabs, _super);
    function Tabs() {
        var _this = _super.call(this) || this;
        _this._iconsCache = {};
        _this.viewController = _this._ios = UIPageViewControllerImpl.initWithOwner(new WeakRef(_this));
        _this.nativeViewProtected = _this._ios.view;
        return _this;
    }
    Tabs.prototype.initNativeView = function () {
        _super.prototype.initNativeView.call(this);
        this._dataSource = UIPageViewControllerDataSourceImpl.initWithOwner(new WeakRef(this));
        this._delegate = UIPageViewControllerDelegateImpl.initWithOwner(new WeakRef(this));
    };
    Tabs.prototype.disposeNativeView = function () {
        this._dataSource = null;
        this._delegate = null;
        this._ios.tabBarDelegate = null;
        this._ios.tabBar = null;
        _super.prototype.disposeNativeView.call(this);
    };
    Tabs.prototype.onLoaded = function () {
        _super.prototype.onLoaded.call(this);
        var selectedIndex = this.selectedIndex;
        var selectedView = this.items && this.items[selectedIndex] && this.items[selectedIndex].view;
        if (selectedView instanceof frame_1.Frame) {
            selectedView._pushInFrameStackRecursive();
        }
        this._ios.dataSource = this._dataSource;
        this._ios.delegate = this._delegate;
        if (!this.tabBarItems) {
            var tabStripItems = this.tabStrip ? this.tabStrip.items : null;
            this.setTabStripItems(tabStripItems);
        }
    };
    Tabs.prototype.onUnloaded = function () {
        this._ios.dataSource = null;
        this._ios.delegate = null;
        _super.prototype.onUnloaded.call(this);
    };
    Object.defineProperty(Tabs.prototype, "ios", {
        get: function () {
            return this._ios;
        },
        enumerable: true,
        configurable: true
    });
    Tabs.prototype.layoutNativeView = function (left, top, right, bottom) {
    };
    Tabs.prototype._setNativeViewFrame = function (nativeView, frame) {
    };
    Tabs.prototype.onSelectedIndexChanged = function (oldIndex, newIndex) {
        var items = this.items;
        if (!items) {
            return;
        }
        this._loadUnloadTabItems(newIndex);
        _super.prototype.onSelectedIndexChanged.call(this, oldIndex, newIndex);
    };
    Tabs.prototype._loadUnloadTabItems = function (newIndex) {
        var _this = this;
        var items = this.items;
        var lastIndex = this.items.length - 1;
        var offsideItems = this.offscreenTabLimit;
        var toUnload = [];
        var toLoad = [];
        iterateIndexRange(newIndex, offsideItems, lastIndex, function (i) { return toLoad.push(i); });
        items.forEach(function (item, i) {
            var indexOfI = toLoad.indexOf(i);
            if (indexOfI < 0) {
                toUnload.push(i);
            }
        });
        toUnload.forEach(function (index) {
            var item = items[index];
            if (items[index]) {
                item.unloadView(item.view);
            }
        });
        var newItem = items[newIndex];
        var selectedView = newItem && newItem.view;
        if (selectedView instanceof frame_1.Frame) {
            selectedView._pushInFrameStackRecursive();
        }
        toLoad.forEach(function (index) {
            var item = items[index];
            if (_this.isLoaded && items[index]) {
                item.loadView(item.view);
            }
        });
    };
    Tabs.prototype.onMeasure = function (widthMeasureSpec, heightMeasureSpec) {
        var width = utils_1.layout.getMeasureSpecSize(widthMeasureSpec);
        var widthMode = utils_1.layout.getMeasureSpecMode(widthMeasureSpec);
        var height = utils_1.layout.getMeasureSpecSize(heightMeasureSpec);
        var heightMode = utils_1.layout.getMeasureSpecMode(heightMeasureSpec);
        var widthAndState = view_1.View.resolveSizeAndState(width, width, widthMode, 0);
        var heightAndState = view_1.View.resolveSizeAndState(height, height, heightMode, 0);
        this.setMeasuredDimension(widthAndState, heightAndState);
    };
    Tabs.prototype._onViewControllerShown = function (viewController) {
        if (this._ios.viewControllers && this._ios.viewControllers.containsObject(viewController)) {
            this.selectedIndex = this._ios.viewControllers.indexOfObject(viewController);
        }
        else {
        }
    };
    Tabs.prototype.getViewController = function (item) {
        var newController = item.view ? item.view.viewController : null;
        if (newController) {
            item.setViewController(newController, newController.view);
            return newController;
        }
        if (item.view.ios instanceof UIViewController) {
            newController = item.view.ios;
            item.setViewController(newController, newController.view);
        }
        else if (item.view.ios && item.view.ios.controller instanceof UIViewController) {
            newController = item.view.ios.controller;
            item.setViewController(newController, newController.view);
        }
        else {
            newController = view_1.ios.UILayoutViewController.initWithOwner(new WeakRef(item.view));
            newController.view.addSubview(item.view.nativeViewProtected);
            item.view.viewController = newController;
            item.setViewController(newController, item.view.nativeViewProtected);
        }
        return newController;
    };
    Tabs.prototype._setCanBeLoaded = function (index) {
        var items = this.items;
        var lastIndex = items.length - 1;
        var offsideItems = this.offscreenTabLimit;
        iterateIndexRange(index, offsideItems, lastIndex, function (i) {
            if (items[i]) {
                items[i].canBeLoaded = true;
            }
        });
    };
    Tabs.prototype.setViewControllers = function (items) {
        var _this = this;
        var length = items ? items.length : 0;
        if (length === 0) {
            return;
        }
        var viewControllers = [];
        items.forEach(function (item) {
            var controller = _this.getViewController(item);
            viewControllers.push(controller);
        });
        this.viewControllers = viewControllers;
        iterateIndexRange(this.selectedIndex, 1, this.items.length, function (index) {
            items[index].canBeLoaded = true;
        });
    };
    Tabs.prototype.setTabStripItems = function (items) {
        var _this = this;
        if (!this.tabStrip || !items) {
            return;
        }
        var tabBarItems = [];
        items.forEach(function (item, i) {
            item.index = i;
            var tabBarItem = _this.createTabBarItem(item, i);
            tabBarItems.push(tabBarItem);
            item.setNativeView(tabBarItem);
        });
        this.tabBarItems = tabBarItems;
        if (this.viewController && this.viewController.tabBar) {
            this.viewController.tabBar.itemAppearance = this._getTabBarItemAppearance();
            this.viewController.tabBar.items = NSArray.arrayWithArray(tabBarItems);
            this.viewController.tabBar.sizeToFit();
            this.tabStrip.setNativeView(this.viewController.tabBar);
        }
    };
    Tabs.prototype.createTabBarItem = function (item, index) {
        var image;
        var title;
        image = this._getIcon(item);
        title = item.label ? item.label.text : item.title;
        if (!this.tabStrip._hasImage) {
            this.tabStrip._hasImage = !!image;
        }
        if (!this.tabStrip._hasTitle) {
            this.tabStrip._hasTitle = !!title;
        }
        var tabBarItem = UITabBarItem.alloc().initWithTitleImageTag(title, image, index);
        return tabBarItem;
    };
    Tabs.prototype._getTabBarItemAppearance = function () {
        var itemAppearance;
        if (this.tabStrip._hasImage && this.tabStrip._hasTitle) {
            itemAppearance = 2;
        }
        else if (this.tabStrip._hasImage) {
            itemAppearance = 1;
        }
        else {
            itemAppearance = 0;
        }
        return itemAppearance;
    };
    Tabs.prototype._getIconRenderingMode = function () {
        return 1;
    };
    Tabs.prototype._getIcon = function (tabStripItem) {
        var iconSource = tabStripItem.image ? tabStripItem.image.src : tabStripItem.iconSource;
        if (!iconSource) {
            return null;
        }
        var image = this._iconsCache[iconSource];
        if (!image) {
            var is = new image_source_1.ImageSource;
            if (utils_1.isFontIconURI(iconSource)) {
                var fontIconCode = iconSource.split("//")[1];
                var font = tabStripItem.style.fontInternal;
                var color = tabStripItem.style.color;
                is = image_source_1.fromFontIconCode(fontIconCode, font, color);
            }
            else {
                is = image_source_1.fromFileOrResource(iconSource);
            }
            if (is && is.ios) {
                var originalRenderedImage = is.ios.imageWithRenderingMode(this._getIconRenderingMode());
                this._iconsCache[iconSource] = originalRenderedImage;
                image = originalRenderedImage;
            }
            else {
            }
        }
        return image;
    };
    Tabs.prototype.getTabBarBackgroundColor = function () {
        return this._ios.tabBar.barTintColor;
    };
    Tabs.prototype.setTabBarBackgroundColor = function (value) {
        this._ios.tabBar.barTintColor = value instanceof color_1.Color ? value.ios : value;
    };
    Tabs.prototype.getTabBarFontInternal = function () {
        return this._ios.tabBar.unselectedItemTitleFont;
    };
    Tabs.prototype.setTabBarFontInternal = function (value) {
        var defaultTabItemFontSize = 10;
        var tabItemFontSize = this.tabStrip.style.fontSize || defaultTabItemFontSize;
        var font = this.tabStrip.style.fontInternal.getUIFont(UIFont.systemFontOfSize(tabItemFontSize));
        this._ios.tabBar.unselectedItemTitleFont = font;
        this._ios.tabBar.selectedItemTitleFont = font;
    };
    Tabs.prototype.getTabBarTextTransform = function () {
        return null;
    };
    Tabs.prototype.setTabBarTextTransform = function (value) {
        if (value === "none") {
            this._ios.tabBar.titleTextTransform = 1;
        }
        else if (value === "uppercase") {
            this._ios.tabBar.titleTextTransform = 2;
        }
    };
    Tabs.prototype.getTabBarColor = function () {
        return this._ios.tabBar.titleColorForState(0);
    };
    Tabs.prototype.setTabBarColor = function (value) {
        var nativeColor = value instanceof color_1.Color ? value.ios : value;
        this._ios.tabBar.setTitleColorForState(nativeColor, 0);
        this._ios.tabBar.setTitleColorForState(nativeColor, 1);
    };
    Tabs.prototype.getTabBarHighlightColor = function () {
        return this._ios.tabBar.tintColor;
    };
    Tabs.prototype.setTabBarHighlightColor = function (value) {
        var nativeColor = value instanceof color_1.Color ? value.ios : value;
        this._ios.tabBar.tintColor = nativeColor;
    };
    Tabs.prototype[tab_navigation_base_1.selectedIndexProperty.setNative] = function (value) {
        var _this = this;
        if (value > -1) {
            var item = this.items[value];
            var controllers = NSMutableArray.alloc().initWithCapacity(1);
            var itemController = item.__controller;
            controllers.addObject(itemController);
            var navigationDirection = 0;
            if (this._currentNativeSelectedIndex && this._currentNativeSelectedIndex > value) {
                navigationDirection = 1;
            }
            this._currentNativeSelectedIndex = value;
            this.viewController.setViewControllersDirectionAnimatedCompletion(controllers, navigationDirection, true, function (finished) {
                if (finished) {
                    _this._canSelectItem = true;
                    _this._setCanBeLoaded(value);
                    _this._loadUnloadTabItems(value);
                }
            });
            if (this.tabBarItems && this.tabBarItems.length && this.viewController && this.viewController.tabBar) {
                this.viewController.tabBar.setSelectedItemAnimated(this.tabBarItems[value], true);
            }
        }
    };
    Tabs.prototype[tab_navigation_base_1.itemsProperty.getDefault] = function () {
        return null;
    };
    Tabs.prototype[tab_navigation_base_1.itemsProperty.setNative] = function (value) {
        this.setViewControllers(value);
        tab_navigation_base_1.selectedIndexProperty.coerce(this);
    };
    Tabs.prototype[tab_navigation_base_1.tabStripProperty.getDefault] = function () {
        return null;
    };
    Tabs.prototype[tab_navigation_base_1.tabStripProperty.setNative] = function (value) {
        this.setTabStripItems(value.items);
    };
    Tabs.prototype[tabs_common_1.swipeEnabledProperty.getDefault] = function () {
        return true;
    };
    Tabs.prototype[tabs_common_1.swipeEnabledProperty.setNative] = function (value) {
        if (this.viewController && this.viewController.scrollView) {
            this.viewController.scrollView.scrollEnabled = value;
        }
    };
    return Tabs;
}(tabs_common_1.TabsBase));
exports.Tabs = Tabs;
//# sourceMappingURL=tabs.ios.js.map