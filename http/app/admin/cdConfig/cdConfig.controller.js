angular.module('ServerApp')
    .controller('adminConfigController', adminConfigController);

function adminConfigController(counterValue, changeConfigFactory) {
    var self = this;
    self.counterValue = counterValue.value;
    self.configFormInValid = configFormInValid;
    self.resetLocalCountDown = resetLocalCountdown;
    self.checkNewCounter = checkNewCounter;
    self.submitConfigForm = submitConfigForm;
    changeConfigFactory.onChangeConfigAdmin(onChangeConfig);

    function submitConfigForm(configForm) {

        if (configFormInValid(configForm))
            return;

        counterValue.value = self.counterValue;
        changeConfigFactory.changeCountdown(self.counterValue);
        configForm.$setPristine();

    }

    function configFormInValid(configForm) {
        return configForm.$invalid || configForm.$pristine || !self.checkNewCounter();
    }



    function checkNewCounter() {
        return self.counterValue != counterValue.value;
    }


    function resetLocalCountdown(configForm) {
        self.counterValue = counterValue.value;
        configForm.$setPristine();
    }

    function onChangeConfig(data) {
        counterValue.value = data.countdown;
        self.counterValue = data.countdown;
    }
}
