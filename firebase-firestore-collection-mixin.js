import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class'

import {AppStorageBehavior} from '@polymer/app-storage/app-storage-behavior';
import {FirebaseCommonBehavior} from '../polymerfire/firebase-common-behavior';

export const FirebaseFirestoreCollectionMixin = (superClass) => class extends mixinBehaviors([AppStorageBehavior, FirebaseCommonBehavior], superClass) {
    constructor() {
        super();
    }

    static get properties() {
        return {
            db: {
                type: Object,
                computed: '__computeDb(app)'
            },

            /**
             * [`firebase.firestore.Collection`](https://firebase.google.com/docs/reference/js/firebase.firestore.CollectionReference#properties)
             * object computed by the following parameters.
             */
            ref: {
                type: Object,
                computed: '__computeRef(db, path, disabled)',
                observer: '__refChanged'
            },

            /**
             * Path to a Firebase root or endpoint. N.B. `path` is case sensitive.
             * @type {string|null}
             */
            path: {
                type: String,
                value: null,
                observer: '__pathChanged'
            },

            /**
             * When true, Firebase listeners won't be activated. This can be useful
             * in situations where elements are loaded into the DOM before they're
             * ready to be activated (e.g. navigation, initialization scenarios).
             * @type {Boolean}
             */
            disabled: {
                type: Boolean,
                value: false
            },

            /**
             * Reference to the unsubscribe function for turning a listener off.
             * @type {Function}
             * @private
             */
            _unsubscribe: {
                type: Object
            }
        };
    }

    static get observer() {
        return [
            '__onlineChanged(online)'
        ];
    }

    /**
     * Set the firebase value.
     * @return {!firebase.Promise<void>}
     */
//            _setFirebaseValue(path, value) {
//                this._log('Setting Firebase value at', path, 'to', value)
//                var key = value && value.$key;
//                var leaf = value && value.hasOwnProperty('$val');
//                if (key) {
//                    value.$key = null;
//                }
//                var result = this.db.ref(path).set(leaf ? value.$val : value);
//                if (key) {
//                    value.$key = key;
//                }
//                return result;
//            },

    __computeDb(app) {
        return app ? app.firestore() : null;
    }

    __computeRef(db, path) {
        if (db == null ||
            path == null ||
            !this.__pathReady(path) ||
            this.disabled) {
            return null;
        }

        return db.collection(path);
    }

    __parseQueryParams(stringParams) {
        if (stringParams == null || typeof stringParams != 'string' || stringParams.length == 0) {
            return null;
        }

        return stringParams.split('&&').map(function (eachParam) {
            return eachParam.split(',');
        })
    }

    /**
     * Override this method if needed.
     * e.g. to detach or attach listeners.
     */
    __refChanged(ref, oldRef){
        return;
    }

    __pathChanged(path, oldPath) {
        if (!this.disabled && !this.valueIsEmpty(this.data)) {
            this.syncToMemory(function() {
                this.data = this.zeroValue;
                this.__needSetData = true;
            });
        }
    }

    __pathReady(path) {
        if (!path) { return false; }
        var pieces = path.split('/');
        if (!pieces[0].length) {
            pieces = pieces.slice(1);
        }
        return path && pieces.indexOf('') < 0 && pieces.length % 2 == 1;
    }

    __onlineChanged(online) {
        if (!this.ref) {
            return;
        }

        if (online) {
            this.db.goOnline();
        } else {
            this.db.goOffline();
        }
    }

    addData(doc) {
        return this.ref.add(doc);
    }

    setData(docPath, data, options) {
        return this.ref.doc(docPath).set(data, options);
    }

    updateData(docPath, data) {
        return this.ref.doc(docPath).update(data);
    }

    removeData(docPath) {
        return this.ref.doc(docPath).delete();
    }
};