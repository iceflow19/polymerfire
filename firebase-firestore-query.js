import {FirebaseFirestoreCollectionMixin} from "./firebase-firestore-collection-mixin";

import { PolymerElement } from '@polymer/polymer/polymer-element';

class FirebaseFirestoreQuery extends FirebaseFirestoreCollectionMixin(PolymerElement) {
    constructor() {
        super();

        this.__map = {};
    }

    static get properties() {
        return {
            /**
             * [`firebase.firestore.Query`](https://firebase.google.com/docs/reference/js/firebase.firestore.Query#property)
             * object computed by the following parameters.
             */
            query: {
                type: Object,
                computed: '__computeQuery(ref, orderBy, limit, startAt, startAfter, endAt, endBefore, where)',
                observer: '__queryChanged'
            },

            /**
             * Creates a new query that returns only documents that include the specified fields and where
             * the values satisfy the constraints provided.
             *
             * Syntax: [[fieldPath, opStr, value]...]
             *             OR
             *         "fieldPath,opStr,value&&..."
             *   fieldPath - The path to compare.
             *   opStr - The operation string. The operators "<", "<=", "==", ">", and ">=" can be used to
             *           compare a field to a specified value. The operator "array-contains" can be used to find
             *           documents where a field is an array and contains a specified value.
             *   value - The value for comparison
             */
            where: {
                type: Object
            },

            /**
             * The property of each query result to order the query by.
             *
             * Creates a new query where the results are sorted by the specified field,
             * in descending or ascending order.
             *
             * Syntax: [[fieldPath, direction]...]
             *             OR
             *         "fieldPath,direction&&..."
             *   fieldPath - The field to sort by.
             *   direction - Optional {string} Optional direction to sort by ('asc' or 'desc'). If not specified,
             *               the default order is ascending.
             */
            orderBy: {
                type: Object
            },

            /**
             * The value to end at in the query, inclusive.
             *
             * Changing this value generates a new `query` with the specified
             * ending point. The generated `query` includes children which match
             * the specified ending point.
             *
             * Type [`firebase.firestore.Document`](https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference#properties)
             *   OR
             *      `String` of each property, separated by '&&'. Expected same number & order of `orderBy` property
             */
            endAt: {
                type: Object
            },

            /**
             * The value to end at in the query, exclusive.
             *
             * Changing this value generates a new `query` with the specified
             * ending point. The generated `query` includes children which match
             * the specified ending point.
             *
             * Type [`firebase.firestore.Document`](https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference#properties)
             *   OR
             *      `String` of each property, separated by '&&'. Expected same number & order of `orderBy` property
             */
            endBefore: {
                type: Object
            },

            /**
             * The snapshot of the document you want the query to start at or the field values
             * to start this query at, in order of the query's order by, inclusive.
             *
             * Creates a new query where the results start at the provided document (inclusive).
             * The starting position is relative to the order of the query.
             * The document must contain all of the fields provided in the orderBy of the query.
             *
             * Type [`firebase.firestore.Document`](https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference#properties)
             *   OR
             *      `String` of each property, separated by '&&'. Expected same number & order of `orderBy` property
             */
            startAt: {
                type: Object
            },

            /**
             * Specifies a child-key value that must be matched for each candidate result, exclusive.
             *
             * Changing this value generates a new `query` which includes children
             * which match the specified value.
             *
             * Type [`firebase.firestore.Document`](https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference#properties)
             *   OR
             *      `String` of each property, separated by '&&'. Expected same number & order of `orderBy` property
             */
            startAfter: {
                type: Object
            },

            /**
             * The maximum number of documents to include in the query.
             *
             * Creates a new query where the results are limited to the specified number of documents.
             */
            limit: {
                type: Number,
                value: 0
            },

            __map: {
                type: Object,
                notify: true
            },

            whereOptions: {
                type: Array,
                value: ["<", "<=", "==", ">", ">=", "array-contains"]
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();

        this.__queryChanged(this.query, this.query);
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        if (this.query == null) {
            return;
        }

        this.__queryChanged(null, this.query);
    }

    child(key) {
        return this.__map[key];
    }

    get isNew() {
        return this.disabled || !this.__pathReady(this.path);
    }

    get zeroValue() {
        return [];
    }

    memoryPathToStoragePath(path) {
        var storagePath = this.path;

        if (path !== 'data') {
            var parts = path.split('.');
            var index = window.parseInt(parts[1], 10);

            if (index != null && !isNaN(index)) {
                parts[1] = this.data[index] != null && this.data[index].$key;
            }

            storagePath += parts.join('/').replace(/^data\.?/, '');
        }

        return storagePath;
    }

    storagePathToMemoryPath(storagePath) {
        var path = 'data';

        if (storagePath !== this.path) {
            var parts = storagePath.replace(this.path + '/', '').split('/');
            var key = parts[0];
            var datum = this.__map[key];

            if (datum) {
                parts[0] = this.__indexFromKey(key);
            }

            path += '.' + parts.join('.');
        }

        return path;
    }

    setStoredValue(storagePath, value) {
        if (storagePath === this.path || /\$key$/.test(storagePath)) {
            return Promise.resolve();
        } else if (/\/\$val$/.test(storagePath)) {
            return this._setFirebaseValue(storagePath.replace(/\/\$val$/, ''), value);
        } else {
            return this._setFirebaseValue(storagePath, value);
        }
    }

    _propertyToKey(property) {
        var index = window.parseInt(property, 10);
        if (index != null && !isNaN(index)) {
            return this.data[index].$key;
        }
    }

    /**
     *
     * @param {firebase.firestore.CollectionReference} ref
     * @param {Array<Array<String>>} [orderBy]
     * @param {number} [limit]
     * @param {*} [startAt]
     * @param {*} [startAfter]
     * @param {*} [endAt]
     * @param {*} [endBefore]
     * @param {Array<String[3]>} [where]
     * @returns {*}
     * @private
     */
    __computeQuery(ref, orderBy, limit, startAt, startAfter, endAt, endBefore, where) {
        if (ref == null) {
            console.log("ref is null");
            return null;
        }

        console.log("ref is not null");

        var query = ref;

        if (orderBy) {
            if (typeof orderBy === 'string') {
                orderBy = this.__parseQueryParams(orderBy);
            }
            orderBy.forEach(function (eachOrderBy) {
                query = query.orderBy.apply(query, eachOrderBy);
            });

            if (startAt) {
                if (typeof startAt === 'string') {
                    startAt = startAt.split('&&');
                    query = query.startAt.apply(query, startAt);
                } else {
                    query = query.startAt(startAt);
                }
            } else if (startAfter) {
                if (typeof startAfter === 'string') {
                    startAfter = startAfter.split('&&');
                    query = query.startAfter.apply(query, startAfter);
                } else {
                    query = query.startAfter(startAfter);
                }
            }

            if (endAt) {
                if (typeof endAt === 'string') {
                    endAt = endAt.split('&&');
                    query = query.endAt.apply(query, endAt);
                } else {
                    query = query.endAt(endAt);
                }
            } else if (endBefore) {
                if (typeof endBefore === 'string') {
                    endBefore = endBefore.split('&&');
                    query = query.endBefore.apply(query, endBefore);
                } else {
                    query = query.endBefore(endBefore);
                }
            }
        }

        if (limit) {
            query = query.limit(limit);
        }

        if (where) {
            if (typeof where === 'string') {
                where = this.__parseQueryParams(where);
            }
            where.forEach(function (eachWhere) {
                if (eachWhere.length === 3 && this.whereOptions.indexOf(eachWhere[1]) != -1) {
                    query = query.where.apply(query, eachWhere);
                }
            });
        }

        return query;
    }

    __pathChanged(path, oldPath) {
        // we only need to reset the data if the path is null (will also trigged when this element initiates)
        // When path changes and is not null, it triggers a ref change (via __computeRef(db,path)), which then triggers a __queryChanged setting data to zeroValue

        if (path == null) {
            this.syncToMemory(function() {
                this.data = this.zeroValue;
            });
        }
    }

    __queryChanged(query, oldQuery) {
        if (oldQuery) {
            try {
                this.get('_unsubscribe')();
            } catch (e) {
                // console.error(e);
            }

            this.syncToMemory(function() {
                this.__map = {};
                this.set('data', this.zeroValue);
            });
        }

        if (query) {
            if(this._onOnce){ // remove handlers before adding again. Otherwise we get data multiplying
            }

            this._onOnce = true;
            this._query = query;

            // does the on-value first
//                        query.off('value', this.__onFirebaseValue, this);
            query.get().then(this.__onFirebaseValue.bind(this)).catch(this.__onError.bind(this));
        }
    }

    __indexFromKey(key) {
        if (key != null) {
            for (var i = 0; i < this.data.length; i++) {
                if (this.data[i].$key === key) {
                    return i;
                }
            }
        }
        return -1;
    }

    __onFirebaseValue(snapshot) {
        if (!snapshot.empty) {
            var data = [];
            snapshot.forEach(function(childSnapshot) {
                var key = childSnapshot.id;
                var value = this.__valueWithKey(key, childSnapshot.data());

                this.__map[key] = value;
                data.push(value)
            }.bind(this));

            this.set('data', data);
        }

        const query = this.query;

//                    query.off('value', this.__onFirebaseValue, this)

        // ensures that all events are called once
        var unsubscribe = this.get('_unsubscribe');
        if (unsubscribe) {
            unsubscribe();
        }

        this.set('_unsubscribe', query.onSnapshot(this.__onSnapshotUpdate.bind(this), this.__onError.bind(this)));
    }

    __onSnapshotUpdate(snapshot) {
        snapshot.docChanges.forEach(function (docChange) {
            switch (docChange.type) {
                case 'added':
                    this.__addDocument(docChange);
                    break;
                case 'modified':
                    this.__modifyDocument(docChange);
                    break;
                case 'removed':
                    this.__removeDocument(docChange);
                    break;
                default:
                    console.warn("Unable to handle doc change type ", docChange.type);
                    return;
            }
        }.bind(this));
    }

    __addDocument(docChange) {
        var key = docChange.doc.id;

        // check if the key-value pair already exists
        if (this.__indexFromKey(key) >= 0) { return; }

        var value = docChange.doc.data();

        this._log('Firebase child_added:', key, value);
        value = this.__documentToValue(docChange.doc);
        this.__map[key] = value;
        this.splice('data', docChange.newIndex, 0, value);
    }

    __modifyDocument(docChange) {
        var doc = docChange.doc;
        var key = doc.id;
        var prev = this.__map[key];

        this._log('Firebase child_changed:', key, prev);

        if (prev) {
            this.async(function() {
                var index = this.__indexFromKey(key);
                if (index !== docChange.oldIndex) {
                    console.warn("Something went wrong. Data not in expected location.");
                }
                var targetIndex = docChange.newIndex;
                var value = this.__documentToValue(doc);

                this.__map[key] = value;

                this.syncToMemory(function() {
                    this.splice('data', index, 1);
                    this.splice('data', targetIndex, 0, value);

                    // TODO(cdata): Update this as appropriate when dom-repeat
                    // supports custom object key indices.
                    if (value instanceof Object) {
                        for (var property in value) {
                            this.set(['data', index, property], value[property]);
                        }
                        for (var property in prev) {
                            if(!value.hasOwnProperty(property)) {
                                this.set(['data', index, property], null);
                            }
                        }
                    } else {
                        this.set(['data', index], value);
                    }
                });
            });
        }
    }

    __removeDocument(docChange) {
        var doc = docChange.doc;
        var key = doc.id;
        var value = this.__map[key];

        this._log('Firebase child_removed:', key, value);

        if (value) {
            this.__map[key] = null;
            this.async(function() {
                this.syncToMemory(function() {
                    // this only catches already deleted keys (which will return -1)
                    // at least it will not delete the last element from the array (this.splice('data', -1, 1))
                    if (this.__indexFromKey(key) >= 0) {
                        if (!this.__indexFromKey(key) == docChange.oldIndex) {
                            console.warn("Something went wrong. Data not in expected location.");
                        }
                        this.splice('data', this.__indexFromKey(key), 1);
                    }
                });
            });
        }
    }

    __onFirebaseChildMoved(snapshot, previousChildKey) {
        var key = snapshot.key;
        var value = this.__map[key];
        var targetIndex = previousChildKey ? this.__indexFromKey(previousChildKey) + 1 : 0;

        this._log('Firebase child_moved:', key, value,
            'to index', targetIndex);

        if (value) {
            var index = this.__indexFromKey(key);
            value = this.__snapshotToValue(snapshot);

            this.__map[key] = value;

            this.async(function() {
                this.syncToMemory(function() {
                    this.splice('data', index, 1);
                    this.splice('data', targetIndex, 0, value);
                });
            });
        }
    }

    __valueWithKey(key, value) {
        var leaf = typeof value !== 'object';

        if (leaf) {
            value = {$key: key, $val: value};
        } else {
            value.$key = key;
        }
        return value;
    }

    __documentToValue(document) {
        var key = document.id;
        var value = document.data();

        return this.__valueWithKey(key, value);
    }

    reset() {
        this.attached();
    }
}

customElements.define("firebase-firestore-query", FirebaseFirestoreQuery);