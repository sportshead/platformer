interface Point2D {
	x: number;
	y: number;
}

interface Rect2D extends Point2D {
	width: number;
	height: number;
}

interface RoundRect2D extends Rect2D {
	radius: number;
}

interface Checkpoint2D extends Rect2D {
	spawnPoint: Point2D;
}

interface Level {
	playerStart: Point2D;
	readonly playerStart0: Point2D;
	cutScenes: Cutscene2D[];
	goal: RoundRect2D;
	floors: Rect2D[];
	lasers: RoundRect2D[];
	checkpoints: Checkpoint2D[];
	readonly checkpoints0: Checkpoint2D[];
	nextLevel: number | "end";
}

interface Eventable {
	addEventListener<K extends keyof ElementEventMap>(
		type: K,
		listener: (this: Element, ev: ElementEventMap[K]) => any,
		options?: boolean | AddEventListenerOptions
	): void;
	addEventListener(
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions
	): void;
}

interface PlatformerOptions {
	gameMode: GameMode;
}
