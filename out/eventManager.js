"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const request = require('request');
class EventManager extends events_1.EventEmitter {
    call(command, value) {
        this.emit(command, value);
    }
}
exports.eventManager = new EventManager();
//# sourceMappingURL=eventManager.js.map