/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/// <reference path="../../declares.d.ts" />
'use strict';

//
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};

define(["require", "exports",  'monaco', './snippets'], function (require, exports, monaco, CMakeSnippets) {
//define(["require", "exports", './abstractSupport', 'monaco', './snippets'], function (require, exports, AbstractSupport, monaco, CMakeSnippets) {
    var SuggestSupport = (function (_super) {
        // _super seems to be the default complettion instance
        // we extend it to add specific cmake snippets
        //__extends(SuggestSupport, _super);
        
        function SuggestSupport(ctx) {
            //_super.apply(this, arguments);
            this.modelService = ctx.modelService;
        }
        
        SuggestSupport.prototype.suggest = function (resource, position) {
            
            var model = this.modelService.getModel(resource);

            var versionId = model.getVersionId();
            
            if (versionId !== model.getVersionId()) {
                return [ret];
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
            return [ret];
        };
        return SuggestSupport;
    })();
    return SuggestSupport;
});