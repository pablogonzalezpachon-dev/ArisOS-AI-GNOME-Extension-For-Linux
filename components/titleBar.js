import St from "gi://St";
import Clutter from "gi://Clutter";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
const DASH_TO_DOCK_SCHEMA = "org.gnome.shell.extensions.dash-to-dock";
const DESKTOP_SCHEMA = "org.gnome.shell.extensions.just-perfection.gschema";
export default class TitleBarExtension {
    _titlebar;
    window;
    constructor(window) {
        this.window = window;
        this._createTitlebar();
        this._attachTitlebarToWindow(window);
    }
    _createTitlebar() {
        const bar = new St.BoxLayout({
            style_class: "aris-titlebar",
            reactive: true,
            can_focus: false,
        });
        const lights = new St.BoxLayout({
            style_class: "aris-traffic-lights",
        });
        const close = new St.Button({
            style_class: "aris-traffic-light aris-close",
        });
        const minimize = new St.Button({
            style_class: "aris-traffic-light aris-minimize",
        });
        const maximize = new St.Button({
            style_class: "aris-traffic-light aris-maximize",
        });
        lights.add_child(close);
        lights.add_child(minimize);
        lights.add_child(maximize);
        const icon = new St.Icon({
            icon_size: 16,
        });
        const title = new St.Label({
            style_class: "aris-title",
            text: "",
            y_align: Clutter.ActorAlign.CENTER,
        });
        bar.add_child(lights);
        bar.add_child(icon);
        bar.add_child(title);
        return { bar, close, minimize, maximize, icon, title };
    }
    _onWindowFocused(window) {
        this._attachTitlebarToWindow(window);
    }
    _attachTitlebarToWindow(window) {
        if (!this._titlebar)
            this._titlebar = this._createTitlebar();
        const rect = window.get_frame_rect();
        this._titlebar.bar.set_position(rect.x + 16, rect.y - 48);
        this._titlebar.title.text = window.get_title();
        Main.layoutManager.addChrome(this._titlebar.bar);
    }
}
