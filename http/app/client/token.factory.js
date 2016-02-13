(function () {
    'use strict';

    angular.module('ClientApp')
        .factory('tokenFactory', tokenFactory);

    /**
     * Use the factory to load and delete the client token.
     * This factory only works if the local storage is available.
     *
     *
     * Use:
     *
     * saveToken(value) - set the new value and saves the token. Only works if local storage is
     * available.
     *
     * loadToken() - loads the token from the local storage. Token will be EMPTY_TOKEN when there
     * is no token saved or local storage is not available.
     *
     * deleteToken() - delete the token from the local storage. This will set the token to
     * EMPTY_TOKEN.
     *
     * localStorageAvailable() - returns true if local storage is available, false otherwise
     */

    function tokenFactory(  $log,
                            token,
                            storageFactory,
                            clientValuesFactory){
        return {
            saveToken: save,
            loadToken: load,
            deleteToken: del,
            localStorageAvailable: checkStorage
        };

        /**
         * Saves the token to local storage.
         * @param tokenValue: tokens nuw value. This value will be saved in the local storage.
         */
        function save(tokenValue) {
            if (checkStorage()) {
                clientValuesFactory.setToken(tokenValue);
                storageFactory.setItem('clientToken', token.value);
            }
        }

        /**
         * Loads the value of the token from the local storage. If no value was saved than the
         * token will has the value EMPTY_TOKEN. The token will has this value also when there is
         * no local storage available.
         */
        function load() {
            var loadedValue = '';
            if (checkStorage()) {
                loadedValue = storageFactory.getItem('clientToken');
                if (loadedValue == null) {
                    clientValuesFactory.setToken('EMPTY_TOKEN');
                } else {
                    clientValuesFactory.setToken(loadedValue);
                }
            } else {
                clientValuesFactory.setToken('EMPTY_TOKEN');
            }
        }

        /**
         * Delete the value from local storage.
         */
        function del() {
            if (checkStorage()) {
                storageFactory.removeItem("clientToken");
                clientValuesFactory.setToken('EMPTY_TOKEN');
            }
        }

        /**
         * Perform a check if the browser supports local storage.
         * Returns true if local storage is supported, false otherwise.
         * (copied from, storageFactory.)
         */
        function checkStorage(){
            if (!Storage)
                return false;
            else {
                try {
                    var test = localStorage.getItem('someItem');
                    return true;
                } catch (err) {
                    return false;
                }
            }
            return true;
        }
    }

})();