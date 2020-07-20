import {AppStorageBehavior} from '@polymer/app-storage/app-storage-behavior';
import '../polymerfire/firebase-common-behavior';

export const FirebaseFirestoreDocumentMixin = (superClass) => class extends superClass {
  constructor() {
    super();
  }

  static get properties() {
      return {
          db: {
              type: Object,
              computed: '__computeDb(app)'
          },

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

  static get observers() {
      return [
          '__onlineChanged(online)'
      ];
  }

    /**
     * Set the firebase value.
     * @return {!firebase.Promise<void>}
     */
//      _setFirebaseValue: function(path, value) {
//        this._log('Setting Firebase value at', path, 'to', value)
//        var key = value && value.$key;
//        var leaf = value && value.hasOwnProperty('$val');
//        if (key) {
//          value.$key = null;
//        }
//        var result = this.db.ref(path).set(leaf ? value.$val : value);
//        if (key) {
//          value.$key = key;
//        }
//        return result;
//      },

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

        return db.doc(path);
    }

    /**
     * Override this method if needed.
     * e.g. to detach or attach listeners.
     */
    __refChanged(ref, oldRef){
        return;
    }

    __pathChanged(path, oldPath) {
        console.log("inside firebase-firestore-document-mixin pathChanged function");
        console.log("AppStorageBehavior:");
        console.log(AppStorageBehavior);
        if (!this.disabled && !AppStorageBehavior.valueIsEmpty(this.data)) {
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
        return path && pieces.indexOf('') < 0 && pieces.length % 2 == 0;
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

    setData(data, options) {
        return this.ref.set(data, options);
    }

    updateData(data) {
        return this.ref.update(data);
    }
};