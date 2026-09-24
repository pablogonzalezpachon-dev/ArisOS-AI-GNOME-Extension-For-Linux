import Gio from "gi://Gio";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
const DASH_TO_DOCK_SCHEMA = "org.gnome.shell.extensions.dash-to-dock";
const DESKTOP_SCHEMA = "org.gnome.shell.extensions.just-perfection.gschema";
import MainPanelExtension from "./components/mainPanel.js";
import ChatOverlayExtension from "./components/chatOverlay.js";
import GLib from "gi://GLib";
import { ArisService } from "./server/arisService.js";
const dockSettings = new Gio.Settings({
    schema_id: DASH_TO_DOCK_SCHEMA,
});
export default class ArisDockExtension extends Extension {
    _arisMenu;
    _textInput;
    _windowCreatedId;
    _titlebars = new Map();
    _arisOverlay;
    callAris(command) {
        Gio.DBus.session.call("org.aris.gnome_node", "/org/aris/gnome_node", "org.aris.gnome_node", "ExecuteModel", new GLib.Variant("(s)", [command]), null, Gio.DBusCallFlags.NONE, -1, null, (conn, res) => {
            try {
                const result = conn.call_finish(res);
                // 🔑 D-Bus always returns tuples
                const [response] = result?.deep_unpack();
                log(response);
            }
            catch (e) {
                logError(e, "Failed to call Aris");
            }
        });
    }
    enable() {
        const bus = Gio.bus_get_sync(Gio.BusType.SESSION, null);
        ArisService.export(bus, "/org/aris/node_gnome");
        Gio.bus_own_name(Gio.BusType.SESSION, "org.aris.node_gnome", Gio.BusNameOwnerFlags.NONE, null, null, null);
        const mainPanelExtension = new MainPanelExtension(this.dir);
        this._arisMenu = mainPanelExtension.createMainPanel();
        Main.panel._leftBox.insert_child_at_index(this._arisMenu, 0);
        const chatOverlayExtension = new ChatOverlayExtension(this.dir, this.callAris);
        const { inputBar, chat } = chatOverlayExtension.createChatOverlay();
        this._textInput = inputBar;
        Main.layoutManager.addChrome(chat);
        Main.layoutManager.addChrome(this._textInput);
        Main.panel.statusArea.activities?.container.hide();
        Main.panel.statusArea.dateMenu.hide();
        Main.panel.statusArea.quickSettings.hide();
        Main.extensionManager.disableExtension("ding@rastersoft.com");
        dockSettings.set_int("dash-max-icon-size", 60);
        dockSettings.set_boolean("dock-fixed", true);
        dockSettings.set_boolean("show-show-apps-button", false);
        dockSettings.set_boolean("show-mounts", false);
    }
    disable() {
        // ArisService.unexport();
        if (this._arisMenu) {
            this._arisMenu.destroy();
        }
        if (this._textInput) {
            this._textInput.destroy();
        }
        if (this._arisOverlay) {
            this._arisOverlay.destroy();
        }
    }
}
