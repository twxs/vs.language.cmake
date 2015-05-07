'use strict';
define(["require", "exports"], function (require, exports) {
    exports.snippets = [
        {
            "type": "snippet",
            "label": "set",
            "documentationLabel": "set Variable",
            "codeSnippet": "set({{VAR}} {{}})"
        },
        {
            "type": "snippet",
            "label": "cmake_minimum_required",
            "documentationLabel": "cmake_minimum_required",
            "codeSnippet": "cmake_minimum_required(VERSION {{3.0.0}} FATAL_ERROR)\n"
        },
        {
            "type": "snippet",
            "label": "target_link_library",
            "documentationLabel": "target_link_library",
            "codeSnippet": "target_link_library({{target}} PUBLIC {{}})\n"
        },
        {
            "type": "snippet",
            "label": "target_link_library",
            "documentationLabel": "target_link_library PRIVATE",
            "codeSnippet": "target_link_library({{target}} PRIVATE {{}})\n"
        },
    ];
});