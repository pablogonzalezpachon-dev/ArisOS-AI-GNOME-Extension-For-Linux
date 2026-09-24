import St from "gi://St";
import Clutter from "gi://Clutter";
import Gio from "gi://Gio";
import Meta from "gi://Meta";
import Pango from "gi://Pango";
export default class ChatOverlayExtension {
    _isCollapsed = false;
    dir;
    _arisChat;
    _floatingInputBar;
    BoxLayout;
    _peekHeight = 62;
    messages = [];
    _xAlignConstraint;
    _yAlignConstraint;
    _arisScrollView;
    _windowControl;
    _messsagesBox;
    _signalId;
    _inputEnterEventId;
    _globalFocusWindowId;
    _globalWindowCreatedId;
    callAris;
    _chatInputBar;
    _state = "floating";
    constructor(dir, callAris) {
        this.dir = dir;
        this.callAris = callAris;
    }
    createInputBar(mode) {
        let bar;
        if (mode === "floating") {
            bar = new St.BoxLayout({
                style_class: "text-input-floating",
                reactive: true,
                visible: true,
                layout_manager: new Clutter.BoxLayout(),
            });
            this._xAlignConstraint = new Clutter.AlignConstraint({
                source: global.stage,
                align_axis: Clutter.AlignAxis.X_AXIS,
                factor: 0.5,
            });
            this._yAlignConstraint = new Clutter.AlignConstraint({
                source: global.stage,
                align_axis: Clutter.AlignAxis.Y_AXIS,
                factor: 0.5,
            });
            bar.add_constraint(this._xAlignConstraint);
            bar.add_constraint(this._yAlignConstraint);
        }
        else {
            bar = new St.BoxLayout({
                style_class: "text-input-chat",
                reactive: true,
                visible: true,
            });
        }
        const addIcon = this.createIcon("add", 40);
        const micIcon = this.createIcon("microphone", 20);
        const spacer = new St.Widget({
            x_expand: true,
        });
        const entry = new St.Entry({
            style_class: "aris-text-entry",
            hint_text: mode === "floating" ? "Where should we start?" : "Ask anything",
            can_focus: true,
            reactive: true,
        });
        const submitButton = new St.Button({
            reactive: true,
            can_focus: true,
            child: new St.Icon({
                gicon: new Gio.FileIcon({
                    file: this.dir.get_child(`icons/submit.svg`),
                }),
                icon_size: 30,
                style_class: "submit-button",
                width: 50,
                height: 50,
            }),
            visible: false,
        });
        const text = entry.get_clutter_text();
        text.connect("text-changed", () => {
            const hasText = text.get_text().trim().length > 0;
            submitButton.visible = hasText;
        });
        submitButton.connect("clicked", () => {
            this.submitQuery(text, this.callAris);
        });
        text.connect("activate", () => {
            this.submitQuery(text, this.callAris);
        });
        bar.add_child(addIcon);
        bar.add_child(micIcon);
        bar.add_child(entry);
        bar.add_child(spacer);
        bar.add_child(submitButton);
        return bar;
    }
    createIcon(name, size, styleClass) {
        return new St.Icon({
            gicon: new Gio.FileIcon({
                file: this.dir.get_child(`icons/${name}.svg`),
            }),
            icon_size: size,
            styleClass: styleClass ? styleClass : "",
        });
    }
    addNewBubble(message) {
        const row = new St.BoxLayout({
            x_expand: true,
        });
        const bubble = new St.Label({
            text: message.content,
            style_class: message.role === "user"
                ? "user-message"
                : message.type === "step"
                    ? "step-message"
                    : "ai-message",
        });
        const clutterText = bubble.get_clutter_text();
        clutterText.set_line_wrap(true);
        clutterText.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        clutterText.set_ellipsize(Pango.EllipsizeMode.NONE);
        if (message.role === "user") {
            row.add_child(new St.Widget({ x_expand: true }));
            row.add_child(bubble);
        }
        else {
            row.add_child(bubble);
            row.add_child(new St.Widget({ x_expand: true }));
        }
        this._messsagesBox?.add_child(row);
    }
    transformToChat() {
        if (this._state === "chat")
            return;
        this._arisChat.visible = true;
        global.display.disconnect(this._globalFocusWindowId);
        global.display.disconnect(this._globalWindowCreatedId);
        this._floatingInputBar.visible = false;
        this._floatingInputBar?.remove_child(this._windowControl);
        this._windowControl.styleClass = "chat-window-control";
        this._arisChat?.add_child(this._windowControl);
        this._arisChat?.add_child(this._arisScrollView);
        this._arisChat?.add_child(this._chatInputBar);
        this._state = "chat";
    }
    submitQuery(text, callAris) {
        const value = text.get_text().trim();
        if (value.length === 0)
            return;
        this._arisChat.visible = true;
        this.transformToChat();
        callAris(value);
        let userMessage = { content: value, role: "user" };
        this.messages.push(userMessage);
        this.addNewBubble(userMessage);
        text.set_text("");
    }
    collapse() {
        if (!this._floatingInputBar || this._isCollapsed)
            return;
        if (this._state === "chat") {
            this.transformToFloating();
        }
        const floatingBarHeight = this._floatingInputBar.height;
        this._floatingInputBar.ease({
            translationY: floatingBarHeight * 5 + 80,
            duration: 300,
            mode: Clutter.AnimationMode.EASE_OUT_CUBIC,
        });
        this._isCollapsed = true;
    }
    expand() {
        if (!this._floatingInputBar || !this._isCollapsed)
            return;
        this._floatingInputBar.ease({
            translationY: 0,
            duration: 300,
            mode: Clutter.AnimationMode.EASE_OUT_CUBIC,
        });
        this._isCollapsed = false;
    }
    hasVisibleWindows() {
        const windows = global.display.get_tab_list(Meta.TabList.NORMAL_ALL, null);
        return windows.some((w) => !w.minimized);
    }
    dockToBottom() {
        if (!this._floatingInputBar)
            return;
        const floatingBarHeight = this._floatingInputBar.height;
        this._floatingInputBar.ease({
            translationY: floatingBarHeight * 5 + 10,
            duration: 300,
            mode: Clutter.AnimationMode.EASE_OUT_CUBIC,
        });
        this._isCollapsed = false;
    }
    updateOverlayPosition() {
        if (!this._floatingInputBar)
            return;
        if (this.hasVisibleWindows()) {
            this.dockToBottom();
        }
        else {
            this.expand();
        }
    }
    createWindowControl() {
        const minimizeButton = new St.Button({
            reactive: true,
            can_focus: true,
            child: new St.BoxLayout({
                width: 20,
                height: 20,
                style_class: "window-minimize-symbolic",
            }),
        });
        const maximizeButton = new St.Button({
            reactive: true,
            can_focus: true,
            child: new St.BoxLayout({
                width: 20,
                height: 20,
                style_class: "window-maximize-symbolic",
            }),
        });
        minimizeButton.connect("clicked", () => {
            this.collapse();
        });
        const windowControl = new St.BoxLayout({
            reactive: true,
        });
        windowControl.add_child(maximizeButton);
        windowControl.add_child(minimizeButton);
        return windowControl;
    }
    transformToFloating() {
        if (this._state === "floating")
            return;
        this._arisChat.visible = false;
        this._floatingInputBar.visible = true;
        this.connectWindowListeners();
        this._arisChat?.remove_child(this._chatInputBar);
        this._arisChat?.remove_child(this._arisScrollView);
        this._arisChat?.remove_child(this._windowControl);
        this._floatingInputBar?.add_child(this._windowControl);
        this._windowControl.styleClass = "";
        this._state = "floating";
    }
    connectWindowListeners() {
        this._globalFocusWindowId = global.display.connect("notify::focus-window", () => {
            if (this._isCollapsed)
                return;
            this.updateOverlayPosition();
        });
        this._globalWindowCreatedId = global.display.connect("window-created", () => {
            if (this._isCollapsed)
                return;
            this.updateOverlayPosition();
        });
    }
    createChatOverlay() {
        this._arisChat = new St.BoxLayout({
            style_class: "aris-chat",
            reactive: true,
            visible: false,
            vertical: true,
        });
        this._arisScrollView = new St.ScrollView({
            visible: true,
            reactive: true,
            x_expand: true,
            y_expand: true,
            overlay_scrollbars: true,
        });
        this._messsagesBox = new St.BoxLayout({
            vertical: true,
            y_expand: true,
            x_expand: true,
            style_class: "messages-box",
        });
        this._arisScrollView.add_child(this._messsagesBox);
        this._floatingInputBar = this.createInputBar("floating");
        this._chatInputBar = this.createInputBar("chat");
        this._windowControl = this.createWindowControl();
        this._inputEnterEventId = this._floatingInputBar.connect("enter-event", () => {
            if (this._isCollapsed) {
                this.updateOverlayPosition();
            }
        });
        this._floatingInputBar.add_child(this._windowControl);
        this.connectWindowListeners();
        this._signalId = Gio.DBus.session.signal_subscribe("org.aris.gnome_node", // sender
        "org.aris.gnome_node", // interface
        "Message", // signal name
        "/org/aris/gnome_node", // object path
        null, Gio.DBusSignalFlags.NONE, (_conn, _sender, _path, _iface, _signal, params) => {
            const [message] = params.deep_unpack();
            this.addNewBubble(message);
        });
        return { inputBar: this._floatingInputBar, chat: this._arisChat };
    }
}
