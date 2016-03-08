
var extensionData = {};
function loadDataFromStorage() {
    chrome.storage.local.get('data', function(data) {
        extensionData = data;
    });
}

chrome.browserAction.onClicked.addListener(function() {
  chrome.tabs.create({'url': chrome.extension.getURL('dynanoscript.html')}, function(tab) {

  });
 });

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if( request.message === "get_extension_data" ) {
            console.log("Getting data...");
            loadDataFromStorage();
            chrome.runtime.sendMessage({"message": "return_extension_data", "data": extensionData});
        } else if( request.message === "save_plugin_data" ) {
            extensionData = request.data;
            chrome.storage.local.set({'data': extensionData}, function() {
                chrome.runtime.sendMessage({"message": "return_save_plugin_data", status: 1});
            })
        } else if( request.message === "reset_plugin_data" ) {
            chrome.storage.local.set({'data': {}}, function() {
                console.log('Data reseted');
            })
        }
    }
);

loadDataFromStorage();
