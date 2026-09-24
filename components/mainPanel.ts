import St from "gi://St";
import Clutter from "gi://Clutter";
import Shell from "gi://Shell";
import Gio from "gi://Gio";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
const DASH_TO_DOCK_SCHEMA = "org.gnome.shell.extensions.dash-to-dock";
const DESKTOP_SCHEMA = "org.gnome.shell.extensions.just-perfection.gschema";
import * as ExtensionUtils from "resource:///org/gnome/shell/misc/extensionUtils.js";
import Pango from "gi://Pango";
import Meta from "gi://Meta";

export default class MainPanelExtension {
  private dir: Gio.File;

  constructor(dir: Gio.File) {
    this.dir = dir;
  }

  createIconButton = (
    type: "icon" | "label",
    name?: string,
    size = 16,
    cb?: () => void,
  ) => {
    const button = new St.Button({
      reactive: true,
      can_focus: true,
      track_hover: true,
      style_class: "aris-menu-button",
    });

    if (type == "icon") {
      const icon = new St.Icon({
        gicon: new Gio.FileIcon({
          file: this.dir?.get_child(`icons/${name}.svg`),
        }),
        icon_size: size,
        style_class: "aris-menu-icon",
      });
      button.set_child(icon);
    } else if (type == "label") {
      const dateLabel = new St.Label({
        text: name,
        style_class: "aris-menu-text",
      });
      button.set_child(dateLabel);
    }

    if (cb) {
      button.connect("clicked", () => {
        cb();
      });
    }
    return button;
  };
  createMainPanel() {
    let mainPanel = new St.BoxLayout({
      style_class: "aris-left-menu",
      reactive: true,
      can_focus: true,
    });

    const quickSettingFunction = () => {
      const qs = Main.panel.statusArea.quickSettings;
      if (!qs) return;

      qs.menu.open();
    };

    const dateMenuFunction = () => {
      const dt = Main.panel.statusArea.dateMenu;
      if (!dt) return;
      dt.menu.open();
    };

    const arisLogo = this.createIconButton(
      "icon",
      "arisLogo",
      20,
      quickSettingFunction,
    );
    const batteryIcon = this.createIconButton(
      "icon",
      "battery",
      20,
      quickSettingFunction,
    );
    const wifiIcon = this.createIconButton(
      "icon",
      "wifi",
      undefined,
      quickSettingFunction,
    );
    const widgetIcon = this.createIconButton(
      "icon",
      "widget",
      undefined,
      quickSettingFunction,
    );
    const dateLabel = this.createIconButton(
      "label",
      "Mon Jun 22 7:01 AM",
      undefined,
      dateMenuFunction,
    );

    mainPanel.add_child(arisLogo);
    mainPanel.add_child(batteryIcon);
    mainPanel.add_child(wifiIcon);
    mainPanel.add_child(widgetIcon);
    mainPanel.add_child(dateLabel);

    return mainPanel;
  }
}
