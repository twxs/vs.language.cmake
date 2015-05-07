cat <<EOF
// generated file
'use strict';
define(["require", "exports"], function (require, exports) {
     exports.snippets = [
EOF

cmd=set

echo $doc

for cmd in $(cmake --help-command-list); do 
  doc=$(cmake --help-command $cmd | tail -n +4 | head -n 1 | sed -e "s/\"/'/g")
cat <<EOF
{  "type": "function",  "label": "${cmd}",  "documentationLabel": "${doc}",  "codeSnippet": "${cmd}({{}})" },
EOF
done


for cmd in $(cmake --help-variable-list); do 
  doc=$(cmake --help-variable $cmd | tail -n +4 | head -n 1 | sed -e "s/\"/'/g")
cat <<EOF
{  "type": "variable",  "label": "${cmd}",  "documentationLabel": "${doc}",  "codeSnippet": "${cmd}" },
EOF
done


for cmd in $(cmake --help-module-list); do 
  doc=$(cmake --help-module $cmd | tail -n +4 | head -n 1 | sed -e "s/\"/'/g")
cat <<EOF
{  "type": "module",  "label": "${cmd}",  "documentationLabel": "${doc}",  "codeSnippet": "${cmd}" },
EOF
done



for cmd in $(cmake --help-property-list); do 
  doc=$(cmake --help-property $cmd | tail -n +4 | head -n 1 | sed -e "s/\"/'/g")
cat <<EOF
{  "type": "property",  "label": "${cmd}",  "documentationLabel": "${doc}",  "codeSnippet": "${cmd}" },
EOF
done
