const { determineScope, definitionToSymbolInformation } = require("../helpers");
const { getIndexForScope } = require("../index");

class CtagsDefinitionProvider {
    constructor(extension) {
        this.extension = extension;
    }

    async provideDefinition(document, position) {
        const symbol = document.getText(document.getWordRangeAtPosition(position));
        const scope = determineScope(document);
        const { symbolIndex } = await getIndexForScope(this.extension, scope);

        const definitions = symbolIndex.get(symbol);
        if (definitions) {
            return definitions
                .map(definition => definitionToSymbolInformation(definition, scope))
                .map(({ location }) => location);
        }
    }
}

module.exports = { CtagsDefinitionProvider };
