import { EventEmitter } from "events";

class EventManager extends EventEmitter{
    public call(command:string,value:string){
        this.emit(command,value);
    }
}
export const eventManager: EventManager = new EventManager();