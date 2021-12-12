const vscode = require("vscode");

const { reindexScope } = require("./index");

describe("reindexScope", () => {
    const scope = { uri: { fsPath: "/test" } };

    it("shows a warning when file does not exist", () => {
        const stash = {
            context: { workspaceState: new vscode.Memento() },
            statusBarItem: new vscode.StatusBarItem(),
        };
        const fs = {
            existsSync: (path) => {
                expect(path).toEqual("/test/path/to/ctags");
                return false;
            }
        };

        reindexScope(stash, scope, { fs });

        expect(stash.context.workspaceState.state).toEqual({});
        expect(stash.statusBarItem.text).toMatch(/not found/);
        expect(stash.statusBarItem.visible).toBeTruthy();
    });

    describe("when file exists", () => {
        const fs = {
            existsSync: (path) => {
                expect(path).toEqual("/test/path/to/ctags");
                return true;
            }
        };

        it("indicates activity in status bar", () => {
            const stash = {
                context: { workspaceState: new vscode.Memento() },
                statusBarItem: new vscode.StatusBarItem(),
            };

            reindexScope(stash, scope, { fs: { ...fs, readFileSync: () => "" } });

            expect(stash.statusBarItem.text).toMatch(/reindexing/);
            expect(stash.statusBarItem.visible).toBeFalsy();
            expect(stash.statusBarItem._wasShown).toBeTruthy();
        });

        it("skips meta lines", () => {
            const stash = {
                context: { workspaceState: new vscode.Memento() },
                statusBarItem: new vscode.StatusBarItem(),
            };

            line = "!_THIS_LINE_SHOULD_BE_IGNORED";
            reindexScope(stash, scope, { fs: { ...fs, readFileSync: () => line } });

            expect(stash.context.workspaceState.state).toEqual({
                indexes: {
                    "/test": {
                        symbolIndex: [],
                        documentIndex: []
                    }
                }
            });
        });

        it.each([
            [
                'KONSTANT	test_projects/python/source.py	/^KONSTANT = "KONSTANT"$/;"	kind:variable	line:1',
                "KONSTANT",
                "test_projects/python/source.py",
            ],
            [
                'method	test_projects/python/source.py	/^    def method(self):$/;"	kind:member	line:9	class:Klass',
                "method",
                "test_projects/python/source.py",
            ],
            [
                'ExternalLib	/usr/lib/pyhon/external_lib.py	/^class ExternalLib:$/;"	kind:class	line:22',
                "ExternalLib",
                "/usr/lib/pyhon/external_lib.py",
            ],
        ])("indexes tags", (line, expectedSymbol, expectedPath) => {
            const stash = {
                context: { workspaceState: new vscode.Memento() },
                statusBarItem: new vscode.StatusBarItem(),
            };

            reindexScope(stash, scope, { fs: { ...fs, readFileSync: () => line } });

            expect(stash.context.workspaceState.state).toEqual({
                indexes: {
                    "/test": {
                        symbolIndex: [[expectedSymbol, [line]]],
                        documentIndex: [[expectedPath, [line]]],
                    }
                }
            });
        });

        it("appends to already indexed symbols", () => {
            const stash = {
                context: { workspaceState: new vscode.Memento() },
                statusBarItem: new vscode.StatusBarItem(),
            };

            const firstDefinition = 'Klass	first.py	/^class Klass:$/;"	kind:class	line:1';
            const secondDefinition = 'Klass	second.py	/^class Klass:$/;"	kind:class	line:2';

            lines = firstDefinition + "\n" + secondDefinition;
            reindexScope(stash, scope, { fs: { ...fs, readFileSync: () => lines } });

            expect(stash.context.workspaceState.state).toEqual({
                indexes: {
                    "/test": {
                        symbolIndex: [
                            ["Klass", [firstDefinition, secondDefinition]]
                        ],
                        documentIndex: [
                            ["first.py", [firstDefinition]],
                            ["second.py", [secondDefinition]],
                        ],
                    }
                }
            });
        });

        it("appends to already indexed documents", () => {
            const stash = {
                context: { workspaceState: new vscode.Memento() },
                statusBarItem: new vscode.StatusBarItem(),
            };

            const fooDefinition = 'Foo	src.py	/^class Foo:$/;"	kind:class	line:1';
            const barDefinition = 'Bar	src.py	/^class Bar:$/;"	kind:class	line:2';

            lines = fooDefinition + "\n" + barDefinition;
            reindexScope(stash, scope, { fs: { ...fs, readFileSync: () => lines } });

            expect(stash.context.workspaceState.state).toEqual({
                indexes: {
                    "/test": {
                        symbolIndex: [
                            ["Foo", [fooDefinition]],
                            ["Bar", [barDefinition]],
                        ],
                        documentIndex: [
                            ["src.py", [fooDefinition, barDefinition]],
                        ]
                    }
                }
            });
        });

        it("does not clash with built-in properties", () => {
            const stash = {
                context: { workspaceState: new vscode.Memento() },
                statusBarItem: new vscode.StatusBarItem(),
            };

            const clashingDefinition = 'hasOwnProperty	src.py	/^def hasOwnProperty():$/;"	kind:function line:1';
            const fooDefinition = 'Foo	src.py	/^class Foo:$/;"	kind:class	line:10';

            lines = clashingDefinition + "\n" + fooDefinition;
            reindexScope(stash, scope, { fs: { ...fs, readFileSync: () => lines } });

            expect(stash.context.workspaceState.state).toEqual({
                indexes: {
                    "/test": {
                        symbolIndex: [
                            ["hasOwnProperty", [clashingDefinition]],
                            ["Foo", [fooDefinition]],
                        ],
                        documentIndex: [
                            ["src.py", [clashingDefinition, fooDefinition]]
                        ]
                    }
                }
            });
        });
    });
});

