interface PasswordProps {
    resolution: number;
    canvasSize?: {
        width: number;
        height: number;
    };
}

export default class Password {
    canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D;

    private pauseTimer: number = 0;
    private startTime: number | null = 0;
    private animationId: number = 0;

    private flattenedKeys: number[] = [];

    paused: boolean = true;

    private resolution: number = 0;
    private canvasSize: PasswordProps["canvasSize"];

    constructor({
        resolution,
        canvasSize = { width: 500, height: 100 },
    }: PasswordProps) {
        Object.assign(this, { ...this.createCanvas(), resolution, canvasSize });

        this.onLeave = this.onLeave.bind(this);
        this.onPress = this.onPress.bind(this);
    }

    record() {
        this.paused = false;
        this.startTime = null;
        this.reset();

        // add event listeners
        document.body.addEventListener("keydown", this.onPress);
        document.body.addEventListener("keyup", this.onLeave);
    }

    reset() {
        this.startTime = null;
        this.flattenedKeys = [];
        this.paused = true;
    }

    pause() {
        // pause only if possible, if not then pause in a few milliseconds
        clearTimeout(this.pauseTimer);
        if (!this.pausable) {
            this.pauseTimer = setTimeout(() => {
                this.pause();
            }, 500);

            return;
        }

        this.paused = true;

        // remove event listeners
        document.body.removeEventListener("keydown", this.onPress);
        document.body.removeEventListener("keyup", this.onLeave);
    }

    dispose() {
        this.canvas.remove();
        cancelAnimationFrame(this.animationId);
        this.pause();
    }

    // render password to the screen
    render() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            const keys = this.keys;
            if (this.pausable) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = "black";
                for (const segment of keys) {
                    this.ctx.fillRect(
                        segment[0] * this.canvas.width,
                        this.canvas.height / 2,
                        (segment[1] - segment[0]) * this.canvas.width,
                        10
                    );
                }
            }
        };

        animate();
    }

    compare(password: Password) {
        // calculate hammings distance of rhythm array
        const rhythmA = this.generateRhythm();
        const rhythmB = password.generateRhythm();
        let distance = 0;

        const maxLength = Math.max(rhythmA.length, rhythmB.length);
        for (let i = 0; i < maxLength; i++) {
            if (rhythmA[i] !== rhythmB[i]) {
                distance++;
            }
        }

        const error = 1 - distance / maxLength;

        return isNaN(error) ? 0 : error;
    }

    generateRhythm() {
        const rhythm: number[] = [];
        const keys = this.flattenedKeys;

        for (let i = 0; i < keys.length - 2; i++) {
            const pressedDuration = keys[i + 1] - keys[i];
            const restDuration = keys[i + 2] - keys[i + 1];

            for (let i = 0; i < pressedDuration; i++) {
                rhythm.push(1);
            }

            for (let i = 0; i < restDuration; i++) {
                rhythm.push(0);
            }
        }

        return rhythm;
    }

    // determine if recording can be paused
    get pausable() {
        return this.flattenedKeys.length % 2 === 0;
    }

    private createCanvas() {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        if (this.canvasSize) {
            canvas.width = this.canvasSize.width;
            canvas.height = this.canvasSize.height;
        }

        return { canvas, ctx };
    }

    // generate a 2d array of keys [start, end]
    get keys() {
        if (!this.startTime) {
            return [];
        }

        const start = this.startTime || 0;

        const lowerRes = this.flattenedKeys.map(
            (key) =>
                (Math.floor((key - start) / this.resolution) *
                    this.resolution) /
                (this.flattenedKeys[this.flattenedKeys.length - 1] - start)
        );

        const keys = [];
        for (let i = 0; i < lowerRes.length; i += 2) {
            keys.push([lowerRes[i], lowerRes[i + 1]]);
        }

        return keys;
    }

    // event listener for key press
    private onPress(e: KeyboardEvent) {
        // if the key is already pressed, ignore
        if (e.repeat) {
            return;
        }

        // set start time if not already set
        if (!this.startTime) {
            this.startTime = Date.now();
        }

        this.flattenedKeys.push(Date.now());
    }

    // event listener for key release
    private onLeave() {
        this.flattenedKeys.push(Date.now());
    }
}
