export class x86_tracer_tools {
    handle: NativePointer;

    constructor() {    
        this.handle = Memory.alloc(3 * Process.pointerSize);
    }

    dispose(): void {
        if (!this.isTiny()) {
            //operatorDelete(this.getAllocatedBuffer());
        }
    }

    read(): string {
        //log(hexdump(this.handle, { length: 12 }));
        let str: string | null = null;
        if (this.isTiny()) {
            str = Memory.readUtf8String(this.handle.add(1));  ///////////////////////////  1*Process.pointerSize
        } else {
            str = Memory.readUtf8String(this.getAllocatedBuffer());
        }
        return (str !== null) ? str : "";
    }
    
    private isTiny(): boolean {
        return (Memory.readU8(this.handle) & 1) === 0;
    }

    private getAllocatedBuffer(): NativePointer {
        return Memory.readPointer(this.handle.add(2 * Process.pointerSize));
    }
}