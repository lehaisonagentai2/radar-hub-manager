package services

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"

	"github.com/syndtr/goleveldb/leveldb"
	"github.com/syndtr/goleveldb/leveldb/opt"
	"github.com/syndtr/goleveldb/leveldb/util"
)

// DB wraps a LevelDB instance and provides helper methods for (de)serialising
// JSON structs.  It fits tiny-service needs: one process opens the DB for the
// whole runtime and shares the pointer (no connection pool is required).
//
// Usage:
//     db, _ := service.OpenDB("./data/leveldb")
//     _ = db.PutJSON("station:1", &Station{ ID: 1, Name: "A" })
//     var st Station
//     _ = db.GetJSON("station:1", &st)
//
// NOTE: All values are stored as marshalled JSON ([]byte). The caller is
//       responsible for setting unique keys (e.g. "station:{id}").
//
// Thread-safety: github.com/syndtr/goleveldb/leveldb is safe for concurrent
// use across goroutines, so no extra mutex around *leveldb.DB is needed.

type DB struct {
	*leveldb.DB
}

// OpenDB ensures the directory exists, opens (or creates) LevelDB with
// sane default options, and returns a wrapped *DB.
func OpenDB(dir string) (*DB, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	// Place CURRENT, MANIFEST, *.ldb inside dir
	path := filepath.Clean(dir)

	lvdb, err := leveldb.OpenFile(path, &opt.Options{ErrorIfMissing: false})
	if err != nil {
		return nil, err
	}
	return &DB{DB: lvdb}, nil
}

// Close closes the underlying LevelDB instance.
func (d *DB) Close() error { return d.DB.Close() }

// PutJSON marshals v into JSON and stores it at key.
func (d *DB) PutJSON(key string, v any) error {
	data, err := json.Marshal(v)
	if err != nil {
		return err
	}
	return d.DB.Put([]byte(key), data, nil)
}

// GetJSON fetches the value at key and unmarshals JSON into v.
// Returns leveldb.ErrNotFound if the key does not exist.
func (d *DB) GetJSON(key string, v any) error {
	data, err := d.DB.Get([]byte(key), nil)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, v)
}

// Delete removes a key completely.
func (d *DB) Delete(key string) error {
	return d.DB.Delete([]byte(key), nil)
}

// IteratePrefix iterates over all keys with the given string prefix, in
// lexicographical order.  fn is executed for each (key,value) pair. If fn
// returns an error, iteration stops and the error is returned.
func (d *DB) IteratePrefix(prefix string, fn func(key string, val []byte) error) error {
	iter := d.DB.NewIterator(util.BytesPrefix([]byte(prefix)), nil)
	defer iter.Release()

	for iter.Next() {
		if err := fn(string(iter.Key()), iter.Value()); err != nil {
			return err
		}
	}
	return iter.Error()
}

// MustGetJSON is a helper for tests/bootstrapping. It panics if the key is
// missing or JSON invalid.
func (d *DB) MustGetJSON(key string, v any) {
	if err := d.GetJSON(key, v); err != nil {
		panic(err)
	}
}

// ErrNotFound is a shorthand re-export so callers don't directly import
// leveldb in business code.
var ErrNotFound = leveldb.ErrNotFound

// Exists checks whether a key is present without fetching the value.
func (d *DB) Exists(key string) (bool, error) {
	_, err := d.DB.Get([]byte(key), nil)
	if errors.Is(err, leveldb.ErrNotFound) {
		return false, nil
	}
	return err == nil, err
}
