import Shell from "gi://Shell";
import Gio from "gi://Gio";
import Meta from "gi://Meta";
import { findWindowById, getWindowState } from "../utils/functions.js";
const IFACE_XML = `
<node>
  <interface name="org.aris.node_gnome">
    <method name="GetDesktopState">
      <arg type="a{ss}" name="state" direction="out"/>
    </method>
    <method name="LaunchApp">
      <arg type="s" name="desktopId" direction="in"/>
      <arg type="s" name="content" direction="out"/>
      <arg type="i" name="status" direction="out"/>
    </method>
    <method name="MaximizeApp">
      <arg type="u" name="windowId" direction="in"/>
      <arg type="s" name="content" direction="out"/>
      <arg type="i" name="status" direction="out"/>
    </method>
    <method name="MinimizeApp">
      <arg type="u" name="windowId" direction="in"/>
      <arg type="s" name="content" direction="out"/>
      <arg type="i" name="status" direction="out"/>
    </method>
    <method name="SwitchApp">
      <arg type="u" name="windowId" direction="in"/>
      <arg type="s" name="content" direction="out"/>
      <arg type="i" name="status" direction="out"/>
    </method>
  </interface>
</node>
`;
export const ArisService = Gio.DBusExportedObject.wrapJSObject(IFACE_XML, {
    GetDesktopState() {
        const tracker = Shell.WindowTracker.get_default();
        const appSystem = Shell.AppSystem.get_default();
        const desktopState = { activeApp: "", runningApps: "", installedApps: "" };
        desktopState.runningApps += `Name|State|windowId|appId \n`;
        desktopState.activeApp += `Name|State|windowId|appId \n`;
        for (const app of appSystem.get_running()) {
            const windows = app.get_windows();
            for (const win of windows) {
                desktopState.runningApps += `${win.get_title()}|${getWindowState(win)}|${win.get_id()}|${app.get_id()}\n`;
            }
        }
        const focusedWindow = global.display.get_focus_window();
        if (focusedWindow) {
            const focusedApp = tracker.get_window_app(focusedWindow);
            desktopState.activeApp += `${focusedWindow.get_title()}|${getWindowState(focusedWindow)}|${focusedWindow.get_id()}|${focusedApp.get_id()}`;
        }
        else {
            desktopState.activeApp += `No active app found`;
        }
        for (const app of appSystem.get_installed()) {
            if (!app.get_name())
                continue;
            if (!app.get_executable())
                continue;
            if (!app.should_show())
                continue;
            desktopState.installedApps += `${app.get_id()} \n`;
        }
        return desktopState;
    },
    LaunchApp(desktopId) {
        try {
            const app = Shell.AppSystem.get_default().lookup_app(desktopId);
            if (!app)
                return [`App does not exist.`, -1];
            app.activate();
            return [`App ${app.get_name()} was successfully launched`, 0];
        }
        catch (e) {
            return [`An error ocurred launching the app ${String(e)}`, -1];
        }
    },
    MaximizeApp(windowId) {
        try {
            const win = findWindowById(windowId);
            if (!win) {
                return [`Window not found`, -1];
            }
            win.activate(global.get_current_time());
            win.maximize(Meta.MaximizeFlags.HORIZONTAL | Meta.MaximizeFlags.VERTICAL);
            return [`Window ${win.get_title()} maximized successfully`, 0];
        }
        catch (e) {
            return [`Error maximizing window: ${String(e)}`, -1];
        }
    },
    MinimizeApp(windowId) {
        try {
            const win = findWindowById(windowId);
            if (!win) {
                return [`Window not found`, -1];
            }
            win.minimize();
            return [`Window ${win.get_title()} minimized successfully`, 0];
        }
        catch (e) {
            return [`Error minimizing window: ${String(e)}`, -1];
        }
    },
    SwitchApp(windowId) {
        try {
            const win = findWindowById(windowId);
            if (!win) {
                return [`Window not found`, -1];
            }
            if (win.minimized)
                win.unminimize();
            win.activate(global.get_current_time());
            return [`Switched to window ${win.get_title()} successfully`, 0];
        }
        catch (e) {
            return [`Error switching to window: ${String(e)}`, -1];
        }
    },
});
