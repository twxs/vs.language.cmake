/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/// <reference path="../../declares.d.ts" />
'use strict';

define(["require", "exports", 'vs/base/strings', 'monaco', './snippets'], function (require, exports, strings, monaco, CMakeSnippets) {
    var ExtraInfoSupport = (function (_super) {
        function ExtraInfoSupport(ctx) {
            this.modelService = ctx.modelService;
        }

        ExtraInfoSupport.prototype.computeInfo = function (resource, position) {
            var range;
            var model = this.modelService.getModel(resource);
            var word = model.getWordAtPosition(position, false);
            if (word) {
                range = { startLineNumber: position.lineNumber, startColumn: word.startColumn, endLineNumber: position.lineNumber, endColumn: word.endColumn };
            }
            else {
                range = { startLineNumber: position.lineNumber, startColumn: position.column, endLineNumber: position.lineNumber, endColumn: position.column };
            }

            var found = CMakeSnippets.snippets.filter(
                function (data) { return data.label == word.word }
                );
                
            var _doc = '';
            var _type = '';
            if (found && found.length > 0) {
                _doc = '+' + found[0].documentationLabel;
                _type = found[0].type + ' : ' + word.word;
            }else {
                return null;
            }
            var ret = {
                value: '',
                range: range,
                className: 'typeInfo',
                htmlContent: [
                    { className: 'type', text: _type },
                    { className: 'documentation', text: _doc }
                ]
            };
            return ret;

        };
        return ExtraInfoSupport;
    })();
    return ExtraInfoSupport;
});
