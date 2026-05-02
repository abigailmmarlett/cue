import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('cue.db');

export default db;
