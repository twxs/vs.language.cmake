'use strict';

import * as path from 'path';
import * as fs from 'fs';
import * as proc from 'child_process';
import * as os from 'os';

//import * as vscode from 'vscode';

interface CMakeHelpFunc {
    (source: string): Promise<string>;
    }

export /**
 * CMakeHelpers
 */
    class CMakeHelpers {
    constructor() {
    }

    private async cmake(args: Array<string>): Promise<string> {
        args.map
        return new Promise<string>(function (resolve, reject) {

            let cmd = proc.spawn('cmake', args.map(arg => { return arg.replace(/\r/gm, ''); }));
            let stdout: string = '';
            cmd.stdout.on('data', function (data) {
                var txt: string = data.toString('utf8');
                stdout += txt.replace(/\r/gm, '');
            });
            cmd.on("error", function (error) {
                reject();
            });
            cmd.on('exit', function (code) {
                resolve(stdout);
            });
        });
    }


    private async cmake_help_list(kind: string): Promise<string> {
        return await this.cmake(['--help-' + kind + '-list']);
    }
    private async cmake_help_command_list(): Promise<string> {
        return await this.cmake_help_list('command');
    }
    private async cmake_help_variable_list(): Promise<string> {
        return await this.cmake_help_list('variable');
    }
    private async cmake_help_property_list(): Promise<string> {
        return await this.cmake_help_list('property');
    }
    private async cmake_help_module_list(): Promise<string> {
        return await this.cmake_help_list('module');
    }
   
    private async cmake_help(kind: string, name: string): Promise<string> {
        try {
            const result = await this.cmake_help_list(kind);
            if (result.indexOf(name) > -1) {
                return await this.cmake(['--help-' + kind, name]);
            } else {
                throw ('not found');
            }
        } catch (e) {
            throw ('not found');
        }
    }
    
    public async cmake_help_command(name: string): Promise<string> {
        return await this.cmake_help('command', name);
    }
    public async cmake_help_variable(name: string): Promise<string> {
        return await this.cmake_help('variable', name);
    }
    public async cmake_help_module(name: string): Promise<string> {
        return await this.cmake_help('module', name);
    }
    public async cmake_help_property(name: string): Promise<string> {
        return await this.cmake_help('property', name);
    }
    
    
    public cmake_help_all() : {
        'function' : CMakeHelpFunc,
        'module' : CMakeHelpFunc,
        'variable' : CMakeHelpFunc,
        'property' : CMakeHelpFunc
    } {
    let promises = {
        'function': (name: string) => {
            return this.cmake_help_command(name);
        },
        'module': (name: string) => {
            return this.cmake_help_module(name);
        },
        'variable': (name: string) => {
            return this.cmake_help_variable(name);
        }
        ,
        'property': (name: string) => {
            return this.cmake_help_property(name);
        }
    };
    return promises;
}


}