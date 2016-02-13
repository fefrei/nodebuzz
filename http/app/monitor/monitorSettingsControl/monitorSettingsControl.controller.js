(function () {
    'use strict';

    angular.module('MonitorApp')
        .controller('monitorSettingsController', monitorSettingsController);

    function monitorSettingsController(buzzersEnabled, dynamicView, scoreBoard, isSoundEnabled, areTeamMembersVisible, monitorStyle, standardView, isTeamListShown, $window, storageFactory, $log, disconnected, audioFactory) {
        var self = this;

        self.buzzersEnabled = buzzersEnabled;
        self.disconnected = disconnected;
        self.isTeamListShown = isTeamListShown;
        self.areTeamMembersVisible = areTeamMembersVisible;
        self.isSoundEnabled = isSoundEnabled;

        self.standardView = standardView;
        self.scoreBoard = scoreBoard;
        self.dynamicView = dynamicView;


        //functions to offer the selected view
        self.chooseStandardViewDynamic = chooseStandardViewDynamic;
        self.chooseStandardViewStatic = chooseStandardViewStatic;
        self.chooseScoreBoardViewDynamic = chooseScoreBoardViewDynamic;
        self.chooseScoreBoardViewStatic = chooseScoreBoardViewStatic;


        activate();


        /**
         * This function is called initially to write the style and the view to the local
         * storage. When the style or the view is changed, the values in the storage are updated
         */
        function activate() {
            $log.log('HASH: ' + $window.location.hash);
            if ($window.location.hash.indexOf("log") > -1) {
                self.activeTab = "log";
            } else {
                self.activeTab = "home";
            }

            if (storageFactory.getItem('monitorStyle')) {
                self.style = storageFactory.getItem('monitorStyle');
                monitorStyle.value = storageFactory.getItem('monitorStyle');
            }
            else {
                style("Superhero");
            }

            if (storageFactory.getItem('view')) {
                var v = storageFactory.getItem('view');
                if (v == 1) {
                    chooseStandardViewDynamic();
                }
                else if (v == 2) {
                    chooseStandardViewStatic();
                }
                else if (v == 3) {
                    chooseScoreBoardViewDynamic();
                }
                else {
                    chooseScoreBoardViewStatic();
                }
            }
            else {
                //if there is no view in the storage, the first view (standard dynamical) is
                // selected
                setStandardView(true);
                setDynamicView(true);
                setScoreBoard(false);
                storageFactory.setItem('view', 1);
            }
        }


        self.setStyle = style;
        self.showTeamMembers = showTeamMembers;
        self.hideTeamMembers = hideTeamMembers;
        self.setMute = setMute;


        /**
         * This function controls the changes of the style and actualizes the value in the storage
         * @param styleName
         */
        function style(styleName) {
            styleName = styleName.toLowerCase();
            storageFactory.setItem('monitorStyle', styleName);
            self.style = styleName;
            monitorStyle.value = styleName;
            $log.log('The style of the Monitor was changed to' + styleName);

        }


        /**
         * Controls whether the members of the team are shown or hidden
         */
        function showTeamMembers() {
            if (scoreBoard.value == false) {
                areTeamMembersVisible.value = true;
                self.areTeamMembersVisible = areTeamMembersVisible;
                $log.log('team members are now visible');
            }
        }

        function hideTeamMembers() {
            if (scoreBoard.value == false) {
                areTeamMembersVisible.value = false;
                self.areTeamMembersVisible = areTeamMembersVisible;
                $log.log('team members are hidden now');
            }
        }


        /**
         * Controls if the monitor can play sounds
         */
        function setMute() {
            if (isSoundEnabled.value) {
                isSoundEnabled.value = false;
                self.isSoundEnabled = isSoundEnabled;
                $log.log('sound is set on mute');
            }
            else {
                isSoundEnabled.value = true;
                self.isSoundEnabled = isSoundEnabled;
                //play a soundless sound to enable sounds in the monitor
                audioFactory.init();
                audioFactory.soundlessbleep();
                audioFactory.soundlessTimeOver();
                $log.log('sound is now audible');
            }
        }

        //setter for different views
        function setScoreBoard(scoreBoardFlag) {
            scoreBoard.value = scoreBoardFlag;
        }

        function setStandardView(standardViewFlag) {
            standardView.value = standardViewFlag;
        }

        function setDynamicView(dynamicViewFlag) {
            dynamicView.value = dynamicViewFlag;

        }


        //these functions are called when a new view is selected
        function chooseStandardViewDynamic() {
            setScoreBoard(false);
            setStandardView(true);
            setDynamicView(true);
            storageFactory.setItem('view', 1);
            $log.log('view 1 is selected');
        }

        function chooseStandardViewStatic() {
            setScoreBoard(false);
            setStandardView(true);
            setDynamicView(false);
            storageFactory.setItem('view', 2);
            $log.log('view 2 is selected');

        }

        function chooseScoreBoardViewDynamic() {
            setScoreBoard(true);
            setStandardView(false);
            setDynamicView(true);
            storageFactory.setItem('view', 3);
            $log.log('view 3 is selected');

        }

        function chooseScoreBoardViewStatic() {
            setScoreBoard(true);
            setStandardView(false);
            setDynamicView(false);
            storageFactory.setItem('view', 4);
            $log.log('view 4 is selected');

        }
    }

})();