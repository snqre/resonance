import * as FbEmitter from "fbemitter";

class Bus {
    private constructor() {}
    private static _emitter: FbEmitter.EventEmitter = new FbEmitter.EventEmitter();

    public static dispatchEvent(event: string, item?: unknown): typeof Bus {
        this._emitter.emit(event, item);
        return this;
    }

    public static subscribe(event: string, handler: (item?: unknown) => void | Promise<void>): FbEmitter.EventSubscription {
        return this._emitter.addListener(event, handler);
    }
}

export { Bus };