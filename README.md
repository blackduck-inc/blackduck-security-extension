# Black Duck Security Scan for Azure DevOps

**NOTE:** If you are currently using the old Synopsys Security Scan extension, please follow these <a href="https://community.blackduck.com/s/article/integrations-black-duck-migration-instructions">instructions</a> to migrate from Synopsys Security Scan extension to this new Black Duck Security Scan extension. 

Black Duck Security Scan Extension for Azure DevOps enables you to configure your Azure pipeline to run Black Duck security testing and take action on the results.
Black Duck Security Scan leverages Bridge CLI, allowing you to run tests for several Black Duck products from the command line.

To use Black Duck Security Scan, please follow the steps below:

1. Configure Azure DevOps as described in the [Azure Prerequisites](https://documentation.blackduck.com/bundle/bridge/page/documentation/c_azure-prerequisites.html) page.
2. Install and configure Black Duck Security Scan for the Black Duck product you are using. <br/>
[Polaris](https://documentation.blackduck.com/bundle/bridge/page/documentation/c_azure-with-polaris.html) <br/>
[Black Duck SCA](https://documentation.blackduck.com/bundle/bridge/page/documentation/c_azure-with-blackduck.html)  <br/>
[Coverity](https://documentation.blackduck.com/bundle/bridge/page/documentation/c_azure-with-coverity.html) <br/>
3. For additional configuration options, visit the [Additional Azure Configuration](https://documentation.blackduck.com/bundle/bridge/page/documentation/c_additional-azure-parameters.html) page.

As an alternative to Black Duck Security Scan, you also have the option to use Bridge CLI. <br/>
Detailed documentation for Bridge CLI can be found [here](https://documentation.blackduck.com/bundle/bridge/page/documentation/c_overview.html).
