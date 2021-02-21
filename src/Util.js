export function waitForConditionThenDo(seconds, conditionCallback, actionCallback, failureCallback) {
    const millisBetweenChecks = 100;
    const doActionIfCondtion = function(retries) {
        if (conditionCallback()) actionCallback()
        else if (retries > 0) {
            setTimeout(function() {
                doActionIfCondtion(--retries);
            }, millisBetweenChecks);
        } else {
            failureCallback();
        }
    }

    // wait up to retires/10 seconds for the condition to become true
    setTimeout(doActionIfCondtion((seconds * 1000) / millisBetweenChecks), millisBetweenChecks);
}
