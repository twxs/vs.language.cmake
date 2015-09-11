/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/// <reference path="../declares.d.ts" />
'use strict';
define(["require", "exports"], function (require, exports) {
    exports.language = {
        displayName: 'Cmake',
        name: 'cmake',
        mimeTypes: [],
        defaultToken: '',
        ignoreCase: false,
        lineComment: '#',
        autoClosingPairs: [['{', '}'],
         ['"', '"']],
       keywords : [
           'if', 'endif',
           'foreach', 'endforeach',
           'function', 'endfunction',
           'macro', 'endmacro',
           'include',
           'set',
           'project'
       ],
        brackets: [
         //   { token: 'delimiter.bracket', open: '{', close: '}' },
            { token: 'delimiter.parenthesis', open: '(', close: ')' },
        ],
        textAfterBrackets: true,
        variable: /\$\{\w+\}/,
        enhancedBrackets: [           
            {
                openTrigger: '\)',
                open: /if\((\w*)\)/i,
                closeComplete: 'endif\($1\)',
                matchCase: true,
                closeTrigger: '\)',
                close: /endif\($1\)$/,
                tokenType: 'keyword.tag-if'
            },
            {
                openTrigger: '\)',
                open: /foreach\((\w*)\)/i,
                closeComplete: 'endforeach\($1\)',
                matchCase: true,
                closeTrigger: '\)',
                close: /endforeach\($1\)$/,
                tokenType: 'keyword.tag-foreach'
            },
            {
                openTrigger: '\)',
                open: /function\((\w+)\)/i,
                closeComplete: 'endfunction\($1\)',
                matchCase: true,
                closeTrigger: '\)',
                close: /function\($1\)$/,
                tokenType: 'keyword.tag-function'
            },
            {
                openTrigger: '\)',
                open: /macro\((\w+)\)/i,
                closeComplete: 'endmacro\($1\)',
                matchCase: true,
                closeTrigger: '\)',
                close: /macro\($1\)$/,
                tokenType: 'keyword.tag-macro'
            }
        ],

        // we include these common regular expressions
        symbols: /[=><!~?&|+\-*\/\^;\.,]+/,
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
        // The main tokenizer for our languages
        tokenizer: {
            root: [
                [/([a-zA-Z_]\w*)( *\()/,  [{cases: { '@keywords': { token: 'keyword.$0' } , '@default': 'identifier.method'}}, '']],
               // [/[a-zA-Z]\w*/, { cases: { '@keywords': 'keyword' , '@default': 'annotation'} }],
                { include: '@whitespace' },
                [/\$\{\w+\}/, 'variable'],
                [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                [/0[xX][0-9a-fA-F_]*[0-9a-fA-F]/, 'number.hex'],
                [/\d+/, 'number'],
                [/"/, 'string', '@string."'],
                [/'/, 'string', '@string.\''],
            ],
            whitespace: [
                [/[ \t\r\n]+/, ''],
                [/#.*$/, 'comment'],
            ],
            string: [
                [/[^\\"'%]+/, { cases: { '@eos': { token: 'string', next: '@popall' }, '@default': 'string' } }],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/\$\{[\w ]+\}/, 'variable'],
                [/["']/, { cases: { '$#==$S2': { token: 'string', next: '@pop' }, '@default': 'string' } }],
                [/$/, 'string', '@popall']
            ],
        },
    };
});
