// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import {workspace, window, languages, Modes, TextDocument, Position, commands, Disposable, CancellationToken} from 'vscode';
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
                    reject('note found');
                }
            });
        }, function(e) { }).then(function(name: string) { return cmake(['--help-variable', name]); }, null);
}


function cmake_help_property_list(): Promise<string> {
    return cmake(['--help-property-list']);
}

function cmake_help_property(name: string): Promise<string> {
    return cmake_help_variable_list()
        .then(function(result: string) {
            let contains = result.indexOf(name) > -1;
            return new Promise(function(resolve, reject) {
                if (contains) {
                    resolve(name);
                } else {
                    reject('note found');
                }
            });
        }, function(e) { }).then(function(name: string) { return cmake(['--help-property', name]); }, null);
}

function cmake_help_module_list(): Promise<string> {
    return cmake(['--help-module-list']);
}

function cmake_help_module(name: string): Promise<string> {
    return cmake_help_variable_list()
        .then(function(result: string) {
            let contains = result.indexOf(name) > -1;
            return new Promise(function(resolve, reject) {
                if (contains) {
                    resolve(name);
                } else {
                    reject('note found');
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
             if(suggestions.length == 0) {
                opener('https://cmake.org/cmake/help/latest/search.html?q='+ search +'&check_keywords=yes&area=default');
             }else {
                let suggestion = suggestions[0];
                let type = suggestion.type;
                if(type == 'function') {
                    type = 'command';
                }
                opener('https://cmake.org/cmake/help/latest/' + type + '/' + search + '.html'); 
             }
        });
}

// this method is called when your extension is activated. activation is
// controlled by the activation events defined in package.json
export function activate(disposables: Disposable[]) {

    commands.registerCommand('cmake.onlineHelp', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        var editor = window.getActiveTextEditor();
        if (!editor) {
            return; // No open text editor
        }
        var selection = editor.getSelection();
        let document = editor.getTextDocument(); 
        let position = selection.start;
        var currentWord = document.getTextInRange(selection);
        let wordAtPosition = document.getWordRangeAtPosition(position);
        
        var currentWord = '';
        
        if (wordAtPosition && wordAtPosition.start.character < position.character) {
            var word = document.getTextInRange(wordAtPosition);
            currentWord =word;// word.substr(0, position.character - wordAtPosition.start.character);
        }
        
        window.showInputBox({prompt: 'Search on Cmake online documentation', placeHolder:currentWord}).then(function(result){         
            cmake_online_help(currentWord);
        });
    });
    
     
   
    
    Modes.registerMonarchDefinition('cmake', new CMakeLanguageDef());

    Modes.SuggestSupport.register('cmake', new CMakeSuggestionSupport());

    Modes.ExtraInfoSupport.register('cmake', new CMakeExtraInfoSupport());


}

// Show Tooltip on mouse over
class CMakeExtraInfoSupport implements Modes.IExtraInfoSupport {
    private computeInfoHelper(cmake_get_help, value, range) {
        return new Promise(function(resolve, reject) {
            let cmd = cmake_get_help(value);
            cmd.then(function(stdout) {
                let documentationContent = stdout.split('\n').map(function(line: string) {
                    return { className: 'documentation', text: line }
                });
                var extraInfoResult = {
                    value: '',
                    range: range,
                    className: 'typeInfo',
                    htmlContent: [{ className: 'type', text: value }].concat(documentationContent)
                };
                resolve(extraInfoResult);
            }).catch(function(e) { 
                console.log(e);
                reject(); 
            });
        });
    }
    public computeInfo(document: TextDocument, position: Position, token: CancellationToken) /*: Thenable<IComputeExtraInfoResult>*/ {
        let range = document.getWordRangeAtPosition(position);
        let value = document.getTextInRange(range);
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
             let suggestion = suggestions[0];
             
            return promises[suggestion.type](suggestion.label).then(function(result:string){    
                let lines = result.split('\n');
                
                lines = lines.slice(2, Math.min(20, lines.length));
               let documentationContent = lines.map(function(line: string) {
                return { className: 'documentation', text: line }
               });
               var extraInfoResult = {
                    value: value,
                    range: range,
                    className: 'typeInfo',
                    htmlContent: [{ className: 'type', text: value }].concat(documentationContent)
                };        
                return extraInfoResult;
            });
        });
    }
}



  function suggestionsHelper(cmake_cmd, currentWord: string, type:string, suffix:string, matchPredicate) {
         return new Promise(function(resolve, reject) {
            cmake_cmd.then(function(stdout: string) {
                let commands = stdout.split('\n').filter(function(v){return matchPredicate(v, currentWord)});
                if(commands.length>0) {
                    let suggestions = commands.map(function(command_name){
                        return {
                            'type' : type,
                            'label' : command_name,
                            'codeSnippet': command_name+suffix
                        };
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

  function cmCommandsSuggestions(currentWord: string) {
      let cmd = cmake_help_command_list();
      return suggestionsHelper(cmd, currentWord, 'function', '({{}})', strContains);
  }

  function cmVariablesSuggestions(currentWord: string) {
      let cmd = cmake_help_variable_list();
      return suggestionsHelper(cmd, currentWord, 'variable', '', strContains);
  }


  function cmPropertiesSuggestions(currentWord: string) {
      let cmd = cmake_help_property_list();
      return suggestionsHelper(cmd, currentWord, 'property', '', strContains);
  }

  function cmModulesSuggestions(currentWord: string) {
      let cmd = cmake_help_module_list();
      return suggestionsHelper(cmd, currentWord, 'module', '', strContains);
  }
    
  function cmCommandsSuggestionsExact(currentWord: string) {
      let cmd = cmake_help_command_list();
      return suggestionsHelper(cmd, currentWord, 'function', '({{}})', strEquals);
  }

  function cmVariablesSuggestionsExact(currentWord: string) {
      let cmd = cmake_help_variable_list();
      return suggestionsHelper(cmd, currentWord, 'variable', '', strEquals);
  }


  function cmPropertiesSuggestionsExact(currentWord: string) {
      let cmd = cmake_help_property_list();
      return suggestionsHelper(cmd, currentWord, 'property', '', strEquals);
  }

  function cmModulesSuggestionsExact(currentWord: string) {
      let cmd = cmake_help_module_list();
      return suggestionsHelper(cmd, currentWord, 'module', '', strEquals);
  }
    
class CMakeSuggestionSupport implements Modes.ISuggestSupport {
    public triggerCharacters: string[];
    public excludeTokens: string[] = ['string', 'comment', 'numeric'];

   
    public suggest(document: TextDocument, position: Position, token: CancellationToken) {
        let wordAtPosition = document.getWordRangeAtPosition(position);
        var currentWord = '';
        if (wordAtPosition && wordAtPosition.start.character < position.character) {
            var word = document.getTextInRange(wordAtPosition);
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
                resolve([{
                        'currentWord': currentWord,
                        'suggestions': suggestions}]);
            }).catch(err=>{ reject(err); });
        });
    }
   
    public getSuggestionDetails(document: TextDocument, position: Position, suggestion:Modes.ISuggestion, token: CancellationToken) {
        let promises = cmake_help_all();
        return promises[suggestion.type](suggestion.label).then(function(result:string){            
            suggestion.documentationLabel = result.split('\n')[3];
            return suggestion;
        });
       
     }
}


// CMake Language Definition

class CMakeLanguageDef {

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

