import { IWorkItemFormService, WorkItemTrackingServiceIds } from "azure-devops-extension-api/WorkItemTracking";
import * as SDK from "azure-devops-extension-sdk";

async function getWorkItemFormService() {
    const workItemFormService = await SDK.getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService);
    return workItemFormService;
}

async function initialize() {
    try {
        await SDK.init();
        await SDK.ready();

        SDK.register(SDK.getContributionId(), async function () {
            const workItemFormService = await getWorkItemFormService();
            return {
                // Called when the active work item is modified
                onFieldChanged: async function(args: any) {
                    try {
                        const state = await workItemFormService.getFieldValues(["System.State"], { returnOriginalValue: false });
                        const storyPoints = await workItemFormService.getFieldValues(["Microsoft.VSTS.Scheduling.StoryPoints"], { returnOriginalValue: false });
                        const areaPath = await workItemFormService.getFieldValues(["System.AreaPath"], { returnOriginalValue: false });
                        const projectName = await workItemFormService.getFieldValues(["System.TeamProject"], { returnOriginalValue: false });
                        if (areaPath["System.AreaPath"] == projectName["System.TeamProject"]) {
                            workItemFormService.setError("Area path cannot be the same as the project name");
                        }
                        else if (state["System.State"] != "New" && storyPoints["Microsoft.VSTS.Scheduling.StoryPoints"] == 0) {
                            workItemFormService.setError("Active Story Points can't be 0!");
                        } else {
                            workItemFormService.clearError();
                        }
                    } catch (error) {
                        console.error("Error in onFieldChanged:", error);
                    }
                },
            };
        });
    } catch (error) {
        console.error("Error during SDK initialization:", error);
    }
}

// Initialize the extension
initialize();