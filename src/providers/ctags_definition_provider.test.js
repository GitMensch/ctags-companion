const vscode = require("vscode");

const { CtagsDefinitionProvider } = require("./ctags_definition_provider");
const { reindexScope } = require("../index");

const position = Symbol("position");
const wordRange = Symbol("wordRange");

function makeDocumentWithSymbol(detectedSymbol) {
    return {
        uri: { fsPath: "/test/test.txt" },
        getWordRangeAtPosition: (p) => {
            expect(p).toBe(position);
            return wordRange;
        },
        getText: (wr) => {
            expect(wr).toBe(wordRange);
            return detectedSymbol;
        }
    };
}

describe(CtagsDefinitionProvider, () => {
    describe("provideDefinition", () => {
        const stash = {
            context: { workspaceState: new vscode.Memento() }
        };
        stash.context.workspaceState.update("indexes", {
            "/test": {
                symbolIndex: [
                    ["emptyListSymbol", []],
                    ["foo", ['foo	src.py	/^    def foo(self):$/;"	kind:member	line:32	class:Goo']]
                ]
            }
        });

        it("returns nothing when no definitions are found", async () => {
            const document = makeDocumentWithSymbol("unknownSymbol");
            const provider = new CtagsDefinitionProvider(stash);

            const definitions = await provider.provideDefinition(document, position);

            expect(definitions).toBe(undefined);
        });

        it("handles empty list", async () => {
            const document = makeDocumentWithSymbol("emptyListSymbol");
            const provider = new CtagsDefinitionProvider(stash);

            const definitions = await provider.provideDefinition(document, position);

            expect(definitions).toEqual([]);
        });

        it("returns locations given indexed symbol", async () => {
            const document = makeDocumentWithSymbol("foo");
            const provider = new CtagsDefinitionProvider(stash);

            const definitions = await provider.provideDefinition(document, position);

            expect(definitions).toEqual([
                {
                    uri: "/test/src.py",
                    rangeOrPosition: { line: 31, character: 0 }
                }
            ]);
        });
    });
});

