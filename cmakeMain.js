/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/// <reference path="../declares.d.ts" />
'use strict';
define(["require", "exports", './cmakeDef', 'monaco', './features/suggestSupport', './features/extraInfoSupport'], function (require, exports, cmakeDef, monaco, SuggestSupport, ExtraInfoSupport) {
   function activate(_ctx) {

        var ctx = {
            modelService: _ctx.modelService,
            markerService: _ctx.markerService,
            configurationService: _ctx.configurationService
        };
        
        // Syntax highlighting
        monaco.Modes.registerMonarchDefinition('cmake', cmakeDef.language);
        // Cmake Completion
        monaco.Modes.SuggestSupport.register('cmake', new SuggestSupport(ctx));
        // Displays tooltips on mouse over
        monaco.Modes.ExtraInfoSupport.register('cmake', new ExtraInfoSupport(ctx));
    }

    exports.activate = activate;
});
