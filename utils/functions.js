function getWindowState(win) {
    if (win.minimized)
        return "minimized";
    if (win.maximized_horizontally && win.maximized_vertically) {
        return "maximized";
    }
    return "normal";
}
function findWindowById(windowId) {
    const windows = global.get_window_actors();
    for (const actor of windows) {
        const win = actor.meta_window;
        if (win && win.get_id() === windowId) {
            return win;
        }
    }
    return null;
}
export { getWindowState, findWindowById };
