// import { Database } from './Database';
const readline = require('readline');

/**
 * In memory DB that handles basic commands
 */
class Database {
	constructor() {
		this.database = {};
		this.pending_transactions = [];

		// hash table of value keys and number of occurences
		this.sameValueCount = {};
	}

	/**
	 * Stores a key value pair in the database array or adds it to the array of pending transactions if not commiting
	 * @param {*} key
	 * @param {*} value
	 * @param {*} commit
	 */
	set(key, value, commiting = false) {
		if (this.pending_transactions && !commiting)
			this.pending_transactions[-1][key] = value;
		else this.database[key] = value;

		// increment value count
		if (!commiting) {
			this.sameValueCount[value] += 1;
			const keyExistsInDB = this.database[key];
			// since we are overwriting an existing variable with a new value we must decrement it's original value's count
			if (keyExistsInDB !== value) this.sameValueCount[keyExistsInDB] -= 1;
		}
	}

	/**
	 * Returns most recent value of a key
	 * @param {*} key
	 */
	get(key) {
		if (this.pending_transactions) {
			// iterate over array in reverse
			for (let i = -1; i >= 0; i--) {
				const valueInTransactions = pending_transactions[i][key];
				if (valueInTransactions) {
					console.log(valueInTransactions);
					return;
				}
			}
		}
		const valueInDB = this.database[key];
		if (valueInDB) console.log(valueInDB);
		else console.log('NULL');
	}

	/**
	 * Removes a key from the DB or pending transactions
	 * @param {*} key
	 * @param {*} commit
	 */
	unset(key, commiting = false) {
		const existingValue = this.database[key];

		if (this.pending_transactions && !commiting) {
			this.pending_transactions[-1][key] = 'NULL';
		} else if (existingValue) delete this.database[key];

		// update value count, ensure count does not become negative
		if (!commiting && existingValue && this.sameValueCount[existingValue] > 0)
			this.sameValueCount[existingValue] -= 1;
	}

	/**
	 * Logs the number of keys equal to a given value
	 * @param {*} value
	 */
	numEqualTo(value) {
		const count = this.sameValueCount[value];
		count ? console.log(count) : console.log('0');
	}

	/**
	 * Create a new transaction block
	 */
	begin() {
		this.pending_transactions.push({});
	}

	/**
	 * Nullify the commands in latest transaction block.
	 */
	rollback() {
		if (this.pending_transactions) {
			const latestTransaction = this.pending_transactions.pop();
			const keysToChange = Object.keys(latestTransaction);

			// ensure keys are not in other transaction blocks
			this.pending_transactions.forEach((transaction) => {
				keysToChange.forEach((key, index) => {
					if (transaction[key] && keysToChange.includes(key))
						// remove from list of keys to update
						keysToChange.splice(index, 1);
				});
			});

			keysToChange.forEach((key) => {
				const existingVal = this.database[key];
				if (existingVal) this.sameValueCount[this.database[key]] += 1;
				if (latestTransaction[key] !== 'NULL')
					this.sameValueCount[latestTransaction[key]] -= 1;
			});
		} else console.log('NO TRANSACTION');
	}

	commit() {
		if (this.pending_transactions) {
			const completed = [];
			// iterate over array in reverse
			for (let i = -1; i >= 0; i--) {
				const currTransaction = this.pending_transactions[i];
				const keys = Object.keys(currTransaction);
				keys &&
					keys.forEach((key) => {
						if (completed.includes(key)) return; // continue or break
						if (currTransaction[key] === 'NULL') this.unset(key, true);
						else this.set(key, currTransaction[key], true);
						completed.push(key);
					});
				completed = [];
			}
		} else console.log('NO TRANSACTION');
	}
}

const handleInput = () => {
	const db = new Database();
	const allowedCommands = [
		'set',
		'get',
		'unset',
		'numequalto',
		'begin',
		'rollback',
		'commit',
	];

	return new Promise((resolve, reject) => {
		let rl = readline.createInterface(process.stdin, process.stdout);
		rl.setPrompt('👉 ');
		rl.prompt();

		rl.on('line', (line) => {
			if (line === 'exit' || line === 'quit' || line == 'q') {
				rl.close();
				return;
			}

			const args = line.split(' ');
			const cmd = args[0].toLowerCase().trim();

			if (allowedCommands.includes(cmd)) {
				db[cmd](args[1]);
			} else console.log('Command was not recognized');

			rl.prompt();
		}).on('close', function () {
			console.log('Bye!');
		});
	});
};

const run = async () => {
	try {
		let replResult = await handleInput();
		console.log('repl result:', replResult);
	} catch (e) {
		console.log('failed:', e);
	}
};

run();
