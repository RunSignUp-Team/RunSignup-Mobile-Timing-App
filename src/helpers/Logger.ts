class Logger {
	log = (msg: unknown, err?: unknown): void => {
		if (__DEV__) {
			if (err !== undefined) {
				console.log(msg, err);
			} else {
				console.log(msg);
			}
		}
	};
}

export default new Logger();