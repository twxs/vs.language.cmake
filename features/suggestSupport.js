'use strict';

define(["require", "exports",  './snippets'], function (require, exports, CMakeSnippets) {
    var SuggestSupport = (function () {
       
        function SuggestSupport(modelService) {
            this.triggerCharacters = [];
            this.excludeTokens = [];
            this.modelService = modelService;
        }
        
        SuggestSupport.prototype.suggest = function (resource, position) {
            
            var model = this.modelService.getModel(resource);

            var versionId = model.getVersionId();
            
            if (versionId !== model.getVersionId()) {
                return  Promise.resolve([ret]);
            }

            // Need to capture the word at position before we send the request.
            // The model can move forward while the request is evaluated.
            var word = model.getWordAtPosition(position, false);
            
            var ret = {
                    currentWord: word ? word.word.substring(0, position.column - word.startColumn) : '',
                    suggestions: []
            };
       //     CMakeSnippets.snippets[0].codeSnippet = JSON.stringify(resource);
            ret.suggestions = CMakeSnippets.snippets;
            return Promise.resolve( [ret]);
        };
        return SuggestSupport;
    })();
    exports.SuggestSupport = SuggestSupport;
});