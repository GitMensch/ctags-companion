const path = require('path');

const SymbolKind = {
    Class: 4,
    Property: 6,
    Function: 11,
    Variable: 12,
};

const _scope = { uri: { fsPath: "/test" } };

const workspace = {
    workspaceFolders: [_scope],

    getConfiguration: () => ({
        get: (key) => {
            switch (key) {
                case "path":
                    return "path/to/ctags";
                case "fuzzyMatchingEnabled":
                    return true;
            }
        }
    }),

    asRelativePath: ({ fsPath }) => {
        return fsPath.replace(/^(\/test\/)/, "");
    }
};

console.assert(workspace.asRelativePath({ fsPath: "/test/foo" }) == "foo");
console.assert(workspace.asRelativePath({ fsPath: "/elsewhere/bar" }) == "/elsewhere/bar");

const window = {
    showErrorMessage: jest.fn(),
};

function Position(line, character) {
    return { line, character };
}

function Location(uri, rangeOrPosition) {
    return { uri, rangeOrPosition };
}

function SymbolInformation(name, kind, containerName, location) {
    return { name, kind, containerName, location };
}

const Uri = {
    parse: (path) => path,
    joinPath: (left, right) => path.join(left.fsPath, right)
};

class Memento {
    constructor() {
        this.state = {};
    }
    get(key) {
        return this.state[key];
    }
    update(key, value) {
        this.state[key] = value;
    }
}

class StatusBarItem {
    constructor() {
        this.text = null;
        this.visible = false;
        this._wasShown = false;
    }
    show() {
        this.visible = true;
        this._wasShown = true;
    }
    hide() {
        this.visible = false;
    }
}

module.exports = { SymbolKind, workspace, window, Position, Location, SymbolInformation, Uri, Memento, StatusBarItem };
