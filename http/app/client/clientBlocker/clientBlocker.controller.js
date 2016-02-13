(function () {
    'use strict';

    angular.module('ClientApp')
        .controller('initBlockerController', initBlockerController);

    /**
     *  This is the blocker controller.
     *
     *  Use:
     *  blockerCtrl.message to display the message.
     *  blockerCtrl.animatedText to display the animated text.
     */

    function initBlockerController(  $log,
                                     $rootScope,
                                     $interval,
                                     rootScopeEvents){
        var self = this;
        self.message = 'Initialize Client. Please wait!';
        self.animatedText = '...';

        $rootScope.$on(rootScopeEvents.setBlockerMessage, setBlockerMessage);
        $rootScope.$on(rootScopeEvents.startBlockerAnimation, startBlockerAnimation);
        $rootScope.$on(rootScopeEvents.stopBlockerAnimation, stopBlockerAnimation);

        var animatedTextInterval;

        /**
         * This is fired when the text of the blocker should be changed.
         * @param event
         * @param msg: string. Text which should be displayed.
         */
        function setBlockerMessage(event, msg){
            self.message = msg;
        }

        /**
         * This is fired when the animated text should start to animate.
         * @param event
         */
        function startBlockerAnimation(event){
            animatedTextInterval = $interval(animateText, 300, -1);
        }

        /**
         * This is fired when the animated text should stop the animation.
         * @param event
         */
        function stopBlockerAnimation(event){
            $interval.cancel(animatedTextInterval);
        }

        /**
         * This is the animation function. It changes the animated text.
         */
        function animateText(){
            switch (self.animatedText){
                case '.':   self.animatedText = '..';
                            break;
                case '..':  self.animatedText = '...';
                            break;
                case '...': self.animatedText = '....';
                            break;
                case '....':self.animatedText = '.....';
                            break;
                default:    self.animatedText = '.';
                            break;
            }
        }
    }

})();