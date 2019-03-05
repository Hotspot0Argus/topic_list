import * as vscode from "vscode";
import { EventEmitter } from "events";

const request = require('request');

class EventManager extends EventEmitter{
    public call(command:string,value:string){
        this.emit(command,value);
    }
}
export const eventManager: EventManager = new EventManager();