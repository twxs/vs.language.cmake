// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {workspace, window, languages, TextDocument, DocumentFilter, Position, commands,LanguageConfiguration, CompletionItemKind, CompletionItem, CompletionItemProvider, Hover, HoverProvider, Disposable, CancellationToken} from 'vscode';
import util  = require('util');
import child_process = require("child_process");

/// strings Helpers
function strContains(word, pattern) {
    return word.indexOf(pattern) > -1;
}

function strEquals(word, pattern) {
    return word == pattern;
}



/// Cmake process helpers

// Simple helper function that invoke the CMAKE executable
// and return a promise with stdout
let cmake = (args: string[]): Promise<string> => {
    return new Promise(function(resolve, reject) {
        let cmd = child_process.spawn('cmake', args.map(arg=> { return arg.replace(/\r/gm, ''); }));
        let stdout: string = '';
        cmd.stdout.on('data', function(data) {
            var txt: string = data.toString('utf8');
            stdout += txt.replace(/\r/gm, '');
        });
        cmd.on("error", function(error) {
            reject();
        });
        cmd.on('exit', function(code) {
            resolve(stdout);
        });
    });
}




// return the cmake command list
function cmake_help_command_list(): Promise<string> {
    return cmake(['--help-command-list']);
}

function cmake_help_command(name: string): Promise<string> {
    return cmake_help_command_list()
        .then(function(result: string) {
            let contains = result.indexOf(name) > -1;
            return new Promise(function(resolve, reject) {
                if (contains) {
                    resolve(name);
                } else {
                    reject('not found');
                }
            });
        }, function(e) { })
        .then(function(n: string) {
            return cmake(['--help-command', n]);
        }, null);
}


function cmake_help_variable_list(): Promise<string> {
    return cmake(['--help-variable-list']);
}

function cmake_help_variable(name: string): Promise<string> {
    return cmake_help_variable_list()
        .then(function(result: string) {
            let contains = result.indexOf(name) > -1;
            return new Promise(function(resolve, reject) {
                if (contains) {
                    resolve(name);
                } else {
                    reject('not found');
                }
            });
        }, function(e) { }).then(function(name: string) { return cmake(['--help-variable', name]); }, null);
}


function cmake_help_property_list(): Promise<string> {
    return cmake(['--help-property-list']);
}

function cmake_help_property(name: string): Promise<string> {
    return cmake_help_property_list()
        .then(function(result: string) {
            let contains = result.indexOf(name) > -1;
            return new Promise(function(resolve, reject) {
                if (contains) {
                    resolve(name);
                } else {
                    reject('not found');
                }
            });
        }, function(e) { }).then(function(name: string) { return cmake(['--help-property', name]); }, null);
}

function cmake_help_module_list(): Promise<string> {
    return cmake(['--help-module-list']);
}

function cmake_help_module(name: string): Promise<string> {
    return cmake_help_module_list()
        .then(function(result: string) {
            let contains = result.indexOf(name) > -1;
            return new Promise(function(resolve, reject) {
                if (contains) {
                    resolve(name);
                } else {
                    reject('not found');
                }
            });
        }, function(e) { }).then(function(name: string) { return cmake(['--help-module', name]); }, null);
}    

function cmake_help_all() {
    let promises = {
        'function': (name: string) => {
            return cmake_help_command(name);
        },
        'module': (name: string) => {
            return cmake_help_module(name);
        },
        'variable': (name: string) => {
            return cmake_help_variable(name);
        }
        ,
        'property': (name: string) => {
            return cmake_help_property(name);
        }
    };
    return promises;
}

function cmake_online_help(search:string) {
    return Promise.all([
            cmCommandsSuggestionsExact(search),
            cmVariablesSuggestionsExact(search),
            cmModulesSuggestionsExact(search),
            cmPropertiesSuggestionsExact(search),
        ]).then(function(results){
             var opener = require("opener");
            
             var suggestions = Array.prototype.concat.apply([], results);
             if(suggestions.length == 0 ) {
                 search = search.replace(/[<>]/g, '');
                 if(search.length == 0) {
                    opener('https://cmake.org/cmake/help/latest/');                     
                 }else {
                    opener('https://cmake.org/cmake/help/latest/search.html?q='+ search +'&check_keywords=yes&area=default');
                 } 
            }else {
                let suggestion = suggestions[0];
                let type = cmakeTypeFromvscodeKind(suggestion.kind);
                if(type == 'property') {
                    // TODO : needs to filter properties per scope to detect the right URL
                    opener('https://cmake.org/cmake/help/latest/search.html?q='+ search +'&check_keywords=yes&area=default');                    
                }else {
                if(type == 'function') {
                    type = 'command';
                }
                search = search.replace(/[<>]/g, '');
                opener('https://cmake.org/cmake/help/latest/' + type + '/' + search + '.html'); 
                }
             }
        });
}

// this method is called when your extension is activated. activation is
// controlled by the activation events defined in package.json
export function activate(disposables: Disposable[]) {

    commands.registerCommand('cmake.onlineHelp', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        var editor = window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        var selection = editor.selection;
        let document = editor.document; 
        let position = selection.start;
        var currentWord = document.getText(selection);
        let wordAtPosition = document.getWordRangeAtPosition(position);
        
        var currentWord = '';
        
        if (wordAtPosition && wordAtPosition.start.character < position.character) {
            var word = document.getText(wordAtPosition);
            currentWord =word;
        }
        
        window.showInputBox({prompt: 'Search on Cmake online documentation', placeHolder:currentWord}).then(function(result){  
            if(result == null) {
                result = currentWord;
            }       
            cmake_online_help(result);
        });
    });
    
    const CMAKE_MODE: DocumentFilter = { language: 'cmake', scheme: 'file' }
    languages.registerHoverProvider('cmake', new CMakeExtraInfoSupport());
    languages.registerCompletionItemProvider('cmake', new CMakeSuggestionSupport());
    
    languages.setLanguageConfiguration(CMAKE_MODE.language, {
		indentationRules: {
			// ^(.*\*/)?\s*\}.*$
			decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
			// ^.*\{[^}"']*$
			increaseIndentPattern: /^.*\{[^}"']*$/
		},
		wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
		comments: {
			lineComment: '#'
		},
		brackets: [
			['{', '}'],
			['(', ')'],
		],

		__electricCharacterSupport: {
			brackets: [
				{ tokenType:'delimiter.curly.ts', open: '{', close: '}', isElectric: true },
				{ tokenType:'delimiter.square.ts', open: '[', close: ']', isElectric: true },
				{ tokenType:'delimiter.paren.ts', open: '(', close: ')', isElectric: true }
			]
		},

		__characterPairSupport: {
			autoClosingPairs: [
				{ open: '{', close: '}' },
				{ open: '(', close: ')' },
				{ open: '"', close: '"', notIn: ['string'] },
			]
		}
    });
}

// Show Tooltip on mouse over
class CMakeExtraInfoSupport implements HoverProvider {
   
    public provideHover(document: TextDocument, position: Position, token: CancellationToken): Thenable<Hover> {
     let range = document.getWordRangeAtPosition(position);
        let value = document.getText(range);
        let promises = cmake_help_all();
        
        return Promise.all([
            cmCommandsSuggestionsExact(value),
            cmVariablesSuggestionsExact(value),
            cmModulesSuggestionsExact(value),
            cmPropertiesSuggestionsExact(value),
        ]).then(function(results){
             var suggestions = Array.prototype.concat.apply([], results);
             if(suggestions.length == 0) {
                 return null;
             }
             let suggestion : CompletionItem = suggestions[0];
             
            return promises[cmakeTypeFromvscodeKind(suggestion.kind)](suggestion.label).then(function(result:string){    
                let lines = result.split('\n');
                
                lines = lines.slice(2, Math.min(20, lines.length));
              
               
                let hover = new Hover({language: 'md', value: lines.join('\n')});
                return hover;
            });
        });
    }
}

function vscodeKindFromCMakeCodeClass(kind: string): CompletionItemKind {
	switch (kind) {
		case "function":
			return CompletionItemKind.Function;
		case "variable":
			return CompletionItemKind.Variable;
		case "module":
			return CompletionItemKind.Module;
	}
	return CompletionItemKind.Property; // TODO@EG additional mappings needed?
}

function cmakeTypeFromvscodeKind(kind: CompletionItemKind): string {
	switch (kind) {
		case CompletionItemKind.Function:
			return "function";
		case CompletionItemKind.Variable:
        return "variable";
		case CompletionItemKind.Module:
        return "module";
	}
    return "property";
}


  function suggestionsHelper(cmake_cmd, currentWord: string, type:string, insertText, matchPredicate) : Thenable<CompletionItem[]>{
         return new Promise(function(resolve, reject) {
            cmake_cmd.then(function(stdout: string) {
                let commands = stdout.split('\n').filter(function(v){return matchPredicate(v, currentWord)});
                if(commands.length>0) {
                    let suggestions = commands.map(function(command_name){
                        var item = new CompletionItem(command_name);
                        item.kind = vscodeKindFromCMakeCodeClass(type);
                        if(insertText == null || insertText == '') {
                            item.insertText = command_name;
                        }else {
                            item.insertText = insertText(command_name);
                        }
                        return item;
                    });
                    resolve(suggestions);
                }else {
                    resolve([]);
                }
                
            }).catch(function(err) { 
                reject(err); 
            });
        });
    }
function cmModuleInsertText(module:string) {
    if(module.indexOf('Find') == 0){
        return 'find_package('+ module.replace('Find', '')+'{{ REQUIRED}})';
    }else {
        return 'include('+module+')';
    }
}

function cmFunctionInsertText(func:string) {
    let scoped_func = ['if', 'function', 'while', 'macro', 'foreach'];
    let is_scoped = scoped_func.reduceRight(function(prev, name, idx, array){return prev || func == name;}, false ) ;
    if(is_scoped)
    return func + '({{}})\n\t\nend'+func+'()\n';
    else
    return func + '({{}})'
}
function cmVariableInsertText(variable:string) {
    return variable.replace(/<(.*)>/g,'{{$1}}');
}
function cmPropetryInsertText(variable:string) {
    return variable.replace(/<(.*)>/g,'{{$1}}');
}

  function cmCommandsSuggestions(currentWord: string) : Thenable<CompletionItem[]> {
      let cmd = cmake_help_command_list();
      return suggestionsHelper(cmd, currentWord, 'function', cmFunctionInsertText, strContains);
  }

  function cmVariablesSuggestions(currentWord: string): Thenable<CompletionItem[]> {
      let cmd = cmake_help_variable_list();
      return suggestionsHelper(cmd, currentWord, 'variable', cmVariableInsertText, strContains);
  }


  function cmPropertiesSuggestions(currentWord: string): Thenable<CompletionItem[]> {
      let cmd = cmake_help_property_list();
      return suggestionsHelper(cmd, currentWord, 'property', cmPropetryInsertText, strContains);
  }

  function cmModulesSuggestions(currentWord: string) : Thenable<CompletionItem[]>{
      let cmd = cmake_help_module_list();
      return suggestionsHelper(cmd, currentWord, 'module', cmModuleInsertText, strContains);
  }
    
  function cmCommandsSuggestionsExact(currentWord: string) : Thenable<CompletionItem[]>{
      let cmd = cmake_help_command_list();
      return suggestionsHelper(cmd, currentWord, 'function', cmFunctionInsertText, strEquals);
  }

  function cmVariablesSuggestionsExact(currentWord: string): Thenable<CompletionItem[]> {
      let cmd = cmake_help_variable_list();
      return suggestionsHelper(cmd, currentWord, 'variable', cmVariableInsertText, strEquals);
  }


  function cmPropertiesSuggestionsExact(currentWord: string) : Thenable<CompletionItem[]>{
      let cmd = cmake_help_property_list();
      return suggestionsHelper(cmd, currentWord, 'property', cmPropetryInsertText, strEquals);
  }

  function cmModulesSuggestionsExact(currentWord: string) : Thenable<CompletionItem[]> {
      let cmd = cmake_help_module_list();
      return suggestionsHelper(cmd, currentWord, 'module', cmModuleInsertText, strEquals);
  }
    
class CMakeSuggestionSupport implements CompletionItemProvider {
    public triggerCharacters: string[];
    public excludeTokens: string[] = ['string', 'comment', 'numeric'];

   
    public provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken) : Thenable<CompletionItem[]> {
        let wordAtPosition = document.getWordRangeAtPosition(position);
        var currentWord = '';
        if (wordAtPosition && wordAtPosition.start.character < position.character) {
            var word = document.getText(wordAtPosition);
            currentWord = word.substr(0, position.character - wordAtPosition.start.character);
        }
        
        return new Promise(function(resolve, reject) {
            Promise.all([
                cmCommandsSuggestions(currentWord),
                cmVariablesSuggestions(currentWord),
                cmPropertiesSuggestions(currentWord),
                cmModulesSuggestions(currentWord)
            ]).then(function(results){
                var suggestions = Array.prototype.concat.apply([], results);
                resolve(suggestions);
            }).catch(err=>{ reject(err); });
        });
    }
   
    public resolveCompletionItem(item: CompletionItem, token: CancellationToken) : Thenable<CompletionItem>{
        let promises = cmake_help_all();
        let type = cmakeTypeFromvscodeKind(item.kind);
        return promises[type](item.label).then(function(result:string){            
            item.documentation  = result.split('\n')[3];
            return item;
        });       
     }
}


// CMake Language Definition

class CMakeLanguageDef  /*implements LanguageConfiguration*/ {
        public comments = {
			lineComment: '#',
		}
        public name:string = 'cmake';
        public displayName:string= 'Cmake';
        public ignoreCase: boolean = true;
        public lineComment: string = '#';
        public autoClosingPairs:string[][] = [
            ['{', '}'],
            ['"', '"']];
       public keywords :string[] = [
           'if', 'endif', 'else',
           'foreach', 'endforeach',
           'function', 'endfunction',
           'macro', 'endmacro',
           'include',
           'set',
           'project'
       ];
        public brackets = [
            { token: 'delimiter.parenthesis', open: '(', close: ')' },
        ];
        public textAfterBrackets:boolean = true;
        public variable= /\$\{\w+\}/;
       public  enhancedBrackets = [           
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
        ];

        // we include these common regular expressions
        public symbols = /[=><!~?&|+\-*\/\^;\.,]+/;
        public escapes= /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/;
        // The main tokenizer for our languages
        public tokenizer= {
            root: [
                [/([a-zA-Z_]\w*)( *\()/,  [{cases: { '@keywords': { token: 'keyword.$0' } , '@default': 'identifier.method'}}, '']],
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
        };
    }

