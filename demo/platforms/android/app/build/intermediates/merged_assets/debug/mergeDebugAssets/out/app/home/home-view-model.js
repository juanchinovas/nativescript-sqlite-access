"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var observable_1 = require("tns-core-modules/data/observable");
var nativescript_sqlite_access_1 = require("nativescript-sqlite-access");
var HomeViewModel = /** @class */ (function (_super) {
    __extends(HomeViewModel, _super);
    function HomeViewModel() {
        var _this = _super.call(this) || this;
        _this.db = nativescript_sqlite_access_1.builder("test.sqlite");
        //console.log(d.builder);
        //console.log(d.SqliteAccess);
        //console.log(d);
        _this.set('text', 'test me here');
        return _this;
    }
    ;
    HomeViewModel.prototype.addText = function () { };
    return HomeViewModel;
}(observable_1.Observable));
exports.HomeViewModel = HomeViewModel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9tZS12aWV3LW1vZGVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaG9tZS12aWV3LW1vZGVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0RBQThEO0FBQzlELHlFQUE4RDtBQUU5RDtJQUFtQyxpQ0FBVTtJQUV6QztRQUFBLFlBQ0ksaUJBQU8sU0FTVjtRQVBHLEtBQUksQ0FBQyxFQUFFLEdBQUcsb0NBQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUVqQyx5QkFBeUI7UUFDekIsOEJBQThCO1FBQzlCLGlCQUFpQjtRQUVqQixLQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQzs7SUFDckMsQ0FBQztJQUVELENBQUM7SUFHRCwrQkFBTyxHQUFQLGNBQVcsQ0FBQztJQUVoQixvQkFBQztBQUFELENBQUMsQUFuQkQsQ0FBbUMsdUJBQVUsR0FtQjVDO0FBbkJZLHNDQUFhIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJ0bnMtY29yZS1tb2R1bGVzL2RhdGEvb2JzZXJ2YWJsZVwiO1xuaW1wb3J0IHtidWlsZGVyLCBJRGF0YWJhc2V9IGZyb20gJ25hdGl2ZXNjcmlwdC1zcWxpdGUtYWNjZXNzJztcblxuZXhwb3J0IGNsYXNzIEhvbWVWaWV3TW9kZWwgZXh0ZW5kcyBPYnNlcnZhYmxlIHtcbiAgICBwcml2YXRlIGRiOiBJRGF0YWJhc2U7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5kYiA9IGJ1aWxkZXIoXCJ0ZXN0LnNxbGl0ZVwiKTtcblxuICAgICAgICAvL2NvbnNvbGUubG9nKGQuYnVpbGRlcik7XG4gICAgICAgIC8vY29uc29sZS5sb2coZC5TcWxpdGVBY2Nlc3MpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKGQpO1xuXG4gICAgICAgIHRoaXMuc2V0KCd0ZXh0JywgJ3Rlc3QgbWUgaGVyZScpO1xuICAgIH1cblxuICAgIDtcblxuXG4gICAgYWRkVGV4dCgpIHt9XG5cbn1cbiJdfQ==