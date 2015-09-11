/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/// <reference path="../declares.d.ts" />
'use strict';
define(["require", "exports", './cmakeDef', 'monaco', '../features/suggestSupport', '../features/extraInfoSupport'], function (require, exports, cmakeDef, monaco, suggestSupport, extraInfoSupport) {
   // Syntax highlighting
   monaco.Modes.registerMonarchDefinition('cmake', cmakeDef.language);
        
   function activate() {
        var MODE_ID = 'cmake';
        
        // Cmake Completion
        monaco.Modes.SuggestSupport.register(MODE_ID, new suggestSupport.SuggestSupport(monaco.Services.ModelService));
        // Displays tooltips on mouse over
        monaco.Modes.ExtraInfoSupport.register(MODE_ID, new extraInfoSupport.ExtraInfoSupport(monaco.Services.ModelService));
        // SUport for comment service
        monaco.Modes.CommentsSupport.register(MODE_ID, {
            commentsConfiguration: {
                lineCommentTokens: ['#']
            }
        });
    }

    exports.activate = activate;
});
