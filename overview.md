# Black Duck Security Scan for Azure DevOps

Black Duck Security Scan Extension for Azure DevOps enables you to configure your Azure pipeline to run Black Duck security testing and take action on the results.
Black Duck Security Scan leverages Bridge CLI, allowing you to run tests for several Black Duck products from the command line.

Black Duck Security Scan supports Azure integration with the following Black Duck security testing solutions:
- **Polaris**, a SaaS-based solution offering SAST, SCA and Managed Services in a single unified platform
- **Coverity**, using our thin client and cloud-based deployment model
- **Black Duck Hub**, supporting either on-premises or hosted instances

**Note**: Black Duck Security Scan requires appropriate licenses for all Black Duck application used.

Black Duck solution functionality is invoked directly by Bridge CLI, and indirectly by the BlackDuck Security Scan, which downloads Bridge CLI and calls the respective adapters to run corresponding scans.

Documentation - https://documentation.blackduck.com/bundle/bridge/page/documentation/c_additional-azure-parameters.html
