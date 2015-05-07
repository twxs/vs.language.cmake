/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/// <reference path="../declares.d.ts" />
'use strict';
define(["require", "exports", './cmakeDef', 'monaco', './features/suggestSupport'], function (require, exports, cmakeDef, monaco, SuggestSupport) {
   function activate(_ctx) {

        var ctx = {
            modelService: _ctx.modelService,
            markerService: _ctx.markerService,
            configurationService: _ctx.configurationService
        };

        monaco.Modes.registerMonarchDefinition('cmake', cmakeDef.language);
        monaco.Modes.SuggestSupport.register('cmake', new SuggestSupport(ctx))
    }

    exports.activate = activate;
   // monaco.Modes.registerMonarchDefinition('cmake', languageDef.language);
});
