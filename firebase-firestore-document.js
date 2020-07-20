import {FirebaseFirestoreDocumentMixin} from "./firebase-firestore-document-mixin";

import { PolymerElement } from '@polymer/polymer/polymer-element';

class FirebaseFirestoreDocument extends FirebaseFirestoreDocumentMixin(PolymerElement) {
    constructor() {
        super();
    }

    static get properties() {
        return {

        };
    }

    static get observers() {
        return [

        ];
    }

    connectedCallback() {
        super.connectedCallback();

        this.__needSetData = true;
        this.__refChanged(this.ref, this.ref);
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        if (this._unsubscribe) {
            this._unsubscribe();
        }
    }

    get isNew() {
        return this.disabled || !this.__pathReady(this.path);
    }


    get zeroValue() {
        return {};
    }

    /**
     * Update the path and write this.data to that new location.
     *
     * Important note: `this.path` is updated asynchronously.
     *
     * @param {string} parentPath The new firebase location to write to.
     * @param {string=} key The key within the parentPath to write `data` to. If
     *     not given, a random key will be generated and used.
     * @return {Promise} A promise that resolves once this.data has been
     *     written to the new path.
     *
     */
    saveValue(parentPath, key) {
        return new Promise(function(resolve, reject) {
            var path = null;

            if (!this.app) {
                reject(new Error('No app configured!'));
            }

            if (key) {
                path = parentPath + '/' + key;
                resolve(this._setFirebaseValue(path, this.data));
            } else {
                path = firebase.firestore(this.app).collection(parentPath)
                    .add(this.data, function(error) {
                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve();
                    }).path.toString();
            }

            this.path = path;
        }.bind(this));
    }

    reset() {
        this.path = null;
        return Promise.resolve();
    }

    destroy() {
        return this._setFirebaseValue(this.path, null).then(function() {
            return this.reset();
        }.bind(this));
    }

    memoryPathToStoragePath(path) {
        var storagePath = this.path;

        if (path !== 'data') {
            storagePath += path.replace(/^data\.?/, '/').split('.').join('/');
        }

        return storagePath;
    }

    storagePathToMemoryPath(storagePath) {
        var path = 'data';

        storagePath =
            storagePath.replace(this.path, '').split('/').join('.');

        if (storagePath) {
            path += '.' + storagePath;
        }

        return path;
    }

    getStoredValue(path) {
        return new Promise(function(resolve, reject) {
            this.db.doc(path).get(function(snapshot) {
                var value = snapshot.data();
                if (value == null) {
                    resolve(this.zeroValue);
                }
                resolve(value);
            }, this.__onError, this);
        }.bind(this));
    }

    setStoredValue(path, value) {
        return this._setFirebaseValue(path, value);
    }

    __refChanged(ref, oldRef) {
        if (oldRef) {
//        oldRef.off('value', this.__onFirebaseValue, this);
            try {
                this.get('_unsubscribe')();
            } catch (e) {
                // console.error(e);
            }
        }

        if (ref) {
            this.set('_unsubscribe', ref.onSnapshot(this.__onFirebaseValue.bind(this), this.__onError.bind(this)));
//        ref.on('value', this.__onFirebaseValue, this.__onError, this);
        }
    }

    __onFirebaseValue(snapshot) {
        var value = snapshot.data();

        if (value == null) {
            value = this.zeroValue;
            this.__needSetData = true;
        }

        if (!this.isNew) {
            this.async(function() {
                this.syncToMemory(function() {
                    this._log('Updating data from Firebase value:', value);

                    // set the value if:
                    // it is the first time we run this (or the path has changed and we are back with zeroValue)
                    // or if  this.data does not exist
                    // or value is primitive
                    // or if firebase value obj contain less keys than this.data (https://github.com/Polymer/polymer/issues/2565)
                    if (this.__needSetData || !this.data || typeof value !== 'object' || ( Object.keys(value).length <  Object.keys(this.data).length)) {
                        this.__needSetData = false;
                        return this.set('data', value);
                    }

                    // now, we loop over keys
                    for (var prop in value) {
                        if(value[prop] !== this.data[prop]) {
                            this.set(['data', prop], value[prop]);
                        }
                    }
                });
            });
        }
    }
}

customElements.define("firebase-firestore-document", FirebaseFirestoreDocument);