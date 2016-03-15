DynamoScript = {
    NOTHING : 0,
    SUCCESS : 1,
    ERROR : 2,
    LOADING : 3,

    extensionData : {},
    currentScriptName : "",
    enviroment : "",
    serverJSONHelp: '[{"groupName":"<GROUP_NAME_1>","servers":[{"name":"<SERVER_NAME_1>","host":"<HOST>","port":"<PORT>","username":"<USERNAME>","password":"<PASSWORD>"},{"name":"<SERVER_NAME_2>","host":"<HOST>","port":"<PORT>","username":"<USERNAME>","password":"<PASSWORD>"}]}]',
    scriptJSONHelp: '{"components":[{"component":"<NUCLEUS_COMPONENT>","method":"<METHOD_NAME>"},{"component":"<NUCLEUS_COMPONENT>","property":"<PROPERTY_NAME>","value":"<PROPERTY_VALUE>"}]}',

    addNewScript: function() {
      var scriptName = prompt("Please enter the script name", "");
      if (scriptName) scriptName = scriptName.trim();
      if (scriptName.length > 0) {
        if (this.findScript(scriptName) == -1) {
            $('#scriptsList').append(
              $('<option />')
                   .text(scriptName)
                   .val(scriptName)
            );
        } else {
            alert('Script name already exists!');
        }
      }
    },

    renameScript: function() {
      var oldScriptName = $('#scriptsList').val()[0];
      var newScriptName = prompt("Please enter the script name", oldScriptName);
      if (newScriptName) newScriptName = newScriptName.trim();
      if (newScriptName.length > 0) {
        var index = this.findScript(oldScriptName);
        var checkIndex = this.findScript(newScriptName);
        if (checkIndex > -1) {
          alert('Script name already exists!');
        } else if (index > -1) {
          this.extensionData[this.enviroment]["scripts"][index]["name"] = newScriptName;
          $('#scriptsList').find('option[value="'+oldScriptName+'"]')
            .text(newScriptName)
            .val(newScriptName);
          chrome.runtime.sendMessage({"message": "save_plugin_data", "data": this.extensionData});
        }
      }
    },

    duplicateScript: function() {
        var copyScriptName = $('#scriptsList').val()[0];
        var index = this.findScript(copyScriptName);
        if (index > -1) {
            //Clone is so easy
            var jsonString = JSON.stringify(this.extensionData[this.enviroment]["scripts"][index]);
            var newScript = JSON.parse(jsonString);
            newScript["name"] = this.extensionData[this.enviroment]["scripts"][index]["name"] + " - COPY";
            this.extensionData[this.enviroment]["scripts"].push(newScript);
            $('#scriptsList').append(
              $('<option />')
                   .text(newScript["name"])
                   .val(newScript["name"])
            );
            chrome.runtime.sendMessage({"message": "save_plugin_data", "data": this.extensionData});
        }
    },

    deleteScript: function() {
        var scriptName = $('#scriptsList').val()[0];
        var index = this.findScript(scriptName);
        if ((index > -1) && (confirm("Do you really want to delete " + scriptName + "?"))) {
            delete this.extensionData[this.enviroment]["scripts"][index];
            chrome.runtime.sendMessage({"message": "save_plugin_data", "data": this.extensionData});
            $("#scripts-list-box option[value='" + scriptName + "']").remove();
        }
    },

    editServersData: function() {
        this.hideAllBoxes();
        $('#servers-box').show();
        $('#servers-data').val('');
        this.initEnviroment();
        if (this.extensionData[this.enviroment]) {
            var serversData = this.extensionData[this.enviroment]["servers"];
            if(serversData) {
                $('#servers-data').val(JSON.stringify(serversData, null, 4));
            } else {
                $('#servers-data').val(this.getHelpText(this.serverJSONHelp));
            }
        }
    },

    saveServersData: function() {
        try {
            var stringData = $('#servers-data').val();
            var jsonData = JSON.parse(stringData);
            this.initEnviroment();
            this.extensionData[this.enviroment]["servers"] = jsonData;
            chrome.runtime.sendMessage({"message": "save_plugin_data", "data": this.extensionData});
        } catch(err) {
            alert('Invalid JSON configuration: ' + err);
        }
    },

    editScriptData: function(scriptName) {
        this.hideAllBoxes();
        $('#import-export-box').hide();
        $('#script-box').show();
        this.loadServers();
        this.currentScriptName = scriptName;
        $('#script-data').val('');
        if (this.extensionData[this.enviroment]) {
            if(this.extensionData[this.enviroment]["scripts"]) {
                for (i in this.extensionData[this.enviroment]["scripts"]) {
                    if (this.extensionData[this.enviroment]["scripts"][i]["name"] == this.currentScriptName) {
                        $('#target-servers').val(this.extensionData[this.enviroment]["scripts"][i]["target"]);
                        $('#script-data').val(JSON.stringify(this.extensionData[this.enviroment]["scripts"][i]["script"], null, 4));
                    }
                }
            }
        }

        if ($('#script-data').val() == '') {
            $('#script-data').val(this.getHelpText(this.scriptJSONHelp));
        }
    },

    findScript: function(scriptName) {
        var index = -1;
        for(i in this.extensionData[this.enviroment]["scripts"]) {
            if (this.extensionData[this.enviroment]["scripts"][i]["name"] == scriptName) {
                index = i;
                break;
            }
        }
        return index;
    },

    findServers: function(groupName) {
        var index = -1;
        for(i in this.extensionData[this.enviroment]["servers"]) {
            if (this.extensionData[this.enviroment]["servers"][i]["groupName"] == groupName) {
                index = i;
                break;
            }
        }
        return index;
    },

    saveScriptData: function() {
        try {
            var stringData = $('#script-data').val();
            var jsonData = JSON.parse(stringData);
            var target = $('#target-servers').val();
            if (target) {
                this.initEnviroment();
                if (!this.extensionData[this.enviroment]["scripts"]) {
                    this.extensionData[this.enviroment]["scripts"] = [];
                }

                var index = this.findScript(this.currentScriptName);

                if (index > -1) {
                    this.extensionData[this.enviroment]["scripts"][index]["script"] = jsonData;
                    this.extensionData[this.enviroment]["scripts"][index]["target"] = target;
                } else {
                    script = {
                        "name": this.currentScriptName,
                        "script": jsonData,
                        "target": target
                    }
                    this.extensionData[this.enviroment]["scripts"].push(script);
                }
                chrome.runtime.sendMessage({"message": "save_plugin_data", "data": this.extensionData});
            }
        } catch(err) {
            alert('Invalid JSON configuration: ' + err);
        }
    },

    loadServers: function() {
        $('#target-servers').empty();
        if (this.extensionData[this.enviroment] && this.extensionData[this.enviroment]["servers"]) {
            for(i in this.extensionData[this.enviroment]["servers"]) {
                $('#target-servers').append(
                  $('<option />')
                       .text(this.extensionData[this.enviroment]["servers"][i]["groupName"])
                       .val(this.extensionData[this.enviroment]["servers"][i]["groupName"])
                );
            }
        }
    },

    cleanScriptData: function() {
        $('#script-data').val('');
    },

    getEnviroment: function() {
        return $('#enviroment').val();
    },

    initEnviroment: function() {
        this.setLocalEnviroment();
        if (!this.extensionData[this.enviroment]) {
            this.extensionData[this.enviroment] = {};
        }
    },

    scriptListClickEvent: function() {
        var scriptName = $('#scriptsList').val()[0];
        if (scriptName) {
            this.editScriptData(scriptName);
        } else {
            this.cleanScriptData();
        }
    },

    listScriptsExtensionData: function () {
    //   HADOUKEN
        $('#scriptsList').empty();
        if (this.extensionData) {
            for (env in this.extensionData) {
                if ((env == $('#enviroment').val()) && (this.extensionData[env]["scripts"])) {
                    for (i in this.extensionData[env]["scripts"]) {
                        $('#scriptsList').append(
                          $('<option />')
                               .text(this.extensionData[env]["scripts"][i]["name"])
                               .val(this.extensionData[env]["scripts"][i]["name"])
                        );
                    }
                }
            }
        }
    },

    runScript: function() {
        var scriptName = $('#scriptsList').val()[0];
        var index = this.findScript(scriptName);
        if ((index > -1) && (confirm("Confirm the execution of the script " + scriptName + "?"))) {
            var scriptConfig = this.extensionData[this.enviroment]["scripts"][index];
            this.initRunScript(scriptConfig);
        }
    },

    initRunScript: function(scriptConfig) {
        var servers = {};
        var execPlan = [];
        var groupServersName = "";
        this.hideAllBoxes();
        $('#logging-box').show();
        $('#logging-box').html('');

        this.logProcess("Preparing things...");
        this.logProcess("");

        var index = this.findServers(scriptConfig["target"]);
        if (index > -1) {
            groupServersName = this.extensionData[this.enviroment]["servers"][index]["groupName"];
            servers = this.extensionData[this.enviroment]["servers"][index]["servers"];
        }

        for (idxServer in servers) {
            for (idxComponents in scriptConfig["script"]["components"]) {
                var script = {
                    "server": servers[idxServer],
                    "script": scriptConfig["script"]["components"][idxComponents]
                };
                execPlan.push(script);
            }
        }

        if (execPlan.length) {
            this.logProcess("Starting script " + scriptConfig["name"] + " on target " + groupServersName + "...");
            this.doRunScript(execPlan, 0);
        } else {
            this.logProcess("");
            this.logProcess("Nothing to do...");
        }
    },

    doRunScript: function(execPlan, index) {
        var thisObj = this;

        if (index > 0) {
            this.logProcess("");
            this.logProcess("");
        }

        if (index < execPlan.length) {
            var script = execPlan[index];

            this.logProcess("Starting script on server " + script["server"]["name"] + "...");

            var serverHost = script["server"]["host"];
            var serverPort = script["server"]["port"];
            var serverUsername = script["server"]["username"];
            var serverPassword = script["server"]["password"];

            var serverUrl = "http://"+serverHost+":"+serverPort+"/dyn/admin/nucleus" + script["script"]["component"];

            this.logProcess("");
            this.logProcess("Running script on component " + script["script"]["component"] + "...");
            console.log(script["script"]);
            var postData = null;
            if (script["script"]["method"]) {
                this.logProcess("Firing method " + script["script"]["method"] + "...", this.LOADING);
                postData = {invokeMethod: script["script"]["method"], submit: "Invoke Method"};
            } else if (script["script"]["property"]) {
                this.logProcess("Setting property " + script["script"]["property"] + " to " + script["script"]["value"] + "...", this.LOADING);
                postData = {propertyName: script["script"]["property"], newValue: script["script"]["value"], change: "Change Value"};
            } else {
                this.logProcess("Ooohh! Ooohh! Nothing to do here...");
            }

            if (postData) {
                $.ajax({
                    type: "POST",
                    url: serverUrl,
                    async: true,
                    data: postData,
                    headers: {
                        'Authorization': "Basic " + btoa(serverUsername+":"+serverPassword)
                    },
                    timeout: 60000,
                    crossDomain: true,
                    success: function(data, textStatus, jqXHR) {
                        thisObj.logProcess('Success - Status: ' + jqXHR.status, thisObj.SUCCESS);
                        thisObj.doRunScript(execPlan, index + 1);
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        thisObj.logProcess('Error - Status: ' + jqXHR.status + " - " + textStatus, thisObj.ERROR);
                        thisObj.doRunScript(execPlan, index + 1);
                    }
                });
            } else {
                this.doRunScript(execPlan, index + 1);
            }
        } else {
            this.logProcess("The process has finished...");
        }
    },

    logProcess: function(log, status) {
        var logStatus = status || this.NOTHING;
        var logContent = $('#logging-box').html();
        if (logContent)
            logContent = logContent + '<br />';
        console.log(logStatus);
        logContent = logContent + log;

        if (logStatus == this.LOADING) {
            logContent = logContent + '&nbsp;<img class="loading" src="images/loading.gif" />';
        } else if (logStatus == this.SUCCESS) {
            logContent = logContent + '&nbsp;<span class="glyphicon glyphicon-ok-sign" aria-hidden="true" style="color:green;"></span>';
        } else if (logStatus == this.ERROR) {
            logContent = logContent + '&nbsp;<span class="glyphicon glyphicon-remove-sign" aria-hidden="true" style="color:red;"></span>';
        }

        $('#logging-box').html(logContent);

        if (logStatus != this.LOADING) {
            $('.loading').remove();
        }
    },

    setLocalEnviroment: function() {
        this.enviroment = $("#enviroment").val();
    },

    showExportData: function() {
      this.hideAllBoxes();
      $('#import-export-box').show();
      $('#import-export-data').val(JSON.stringify(this.extensionData, null, 4));
      $('#import-data').hide();
    },

    showImportData: function() {
      this.hideAllBoxes();
      $('#import-export-box').show();
      $('#import-data').show();
      $('#import-export-data').val('');
    },

    importData: function() {
        try {
            var stringData = $('#import-export-data').val();
            var jsonData = JSON.parse(stringData);
            this.initEnviroment();
            if (confirm("Do you really want to import this configuration and loose all your data?")) {
              this.extensionData = jsonData;
              chrome.runtime.sendMessage({"message": "save_plugin_data", "data": this.extensionData});
              this.setLocalEnviroment();
              this.listScriptsExtensionData();
              alert('Import finished!');
            }
        } catch(err) {
            alert('Invalid JSON configuration: ' + err);
        }
    },

    exportScripts: function() {
      chrome.fileSystem.chooseEntry({type: 'saveFile'}, function(writableFileEntry) {
          writableFileEntry.createWriter(function(writer) {
            writer.onerror = errorHandler;
            writer.onwriteend = function(e) {
              console.log('export completed');
            };
            writer.write(JSON.stringify(this.extensionData, null, 4), {type: 'text/plain'});
          }, errorHandler);
      });
    },

    hideAllBoxes: function() {
        $('#script-box').hide();
        $('#servers-box').hide();
        $('#logging-box').hide();
        $('#import-export-box').hide();
    },

    cleanWindow: function() {
        this.hideAllBoxes();
        $('#logging-box').html('');
        $('#logging-box').show();
    },

    getHelpText: function(text) {
        var j = JSON.parse(text);
        return JSON.stringify(j, null, 4)
    },

    init: function() {
        var thisObj = this;

        $('#add-new-script').click(function() { thisObj.addNewScript() });
        $('#edit-servers').click(function() { thisObj.editServersData() });
        $('#rename-script').click(function() { thisObj.renameScript() });
        $('#duplicate-script').click(function() { thisObj.duplicateScript() });
        $('#delete-script').click(function() { thisObj.deleteScript() });
        $('#run-script').click(function() { thisObj.runScript() });
        $('#save-servers-data').click(function() { thisObj.saveServersData() });
        $('#scriptsList').click(function() { thisObj.scriptListClickEvent() });
        $('#save-script-data').click(function() { thisObj.saveScriptData() });
        $('#show-export-data').click(function() { thisObj.showExportData() });
        $('#show-import-data').click(function() { thisObj.showImportData() });
        $('#import-data').click(function() { thisObj.importData() });
        $('#cancel-edit-servers').click(function() { thisObj.cleanWindow() });
        $('#cancel-edit-script').click(function() { thisObj.cleanWindow() });

        $('#enviroment').change(function() {
            thisObj.cleanWindow();
            thisObj.initEnviroment();
            thisObj.listScriptsExtensionData();
        });

        chrome.runtime.sendMessage({"message": "get_extension_data"});
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if( request.message === "return_extension_data" ) {
            if (request.data['data']) {
              DynamoScript.extensionData = request.data['data'];
            } else {
              DynamoScript.extensionData = {};
            }
            DynamoScript.setLocalEnviroment();
            DynamoScript.listScriptsExtensionData();
        } else if( request.message === "return_save_plugin_data" ) {
            if (request.status == 1) {
                DynamoScript.currentScriptName = '';
                DynamoScript.hideAllBoxes();
                $('#loggingBox').show();
            } else {
                alert('Error on saving');
            }
        }
    }
);

$(document).ready(function() {
    DynamoScript.init();
});
