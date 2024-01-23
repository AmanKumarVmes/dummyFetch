import fetch from "node-fetch";
import core from "@actions/core";

try {
  // get the accessToken to access the github project
  const accessToken = core.getInput("token");

  /**
   * Current Project which is being targated is number 10 (this value can be found in the url of the project page)
   * Currently the number of items that are retrieved from the project is last 100 (100 is the max number of items that can be retrieved)
   * Currently the number of fields that are retrieved from the project is 20
   */

  // Queries to access data in the project
  const itemInfoQuery = `
    query{
      organization(login: "exampathfinder") {
        projectV2(number: 10) {
          items(last: 100) {
            nodes {
              id
              fieldValues(last: 10) {
                nodes {
                  ... on ProjectV2ItemFieldDateValue {
                    date
                    id
                    field {
                      ... on ProjectV2Field {
                        name
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    `;

  const fieldsInfoQuery = `
    query{
      organization(login: "exampathfinder") {
        projectV2(number: 10) {
          title
          id
          fields(last: 20) {
            nodes {
              ... on ProjectV2Field {
                id
                name
              }
            }
          }
        }
      }
    }
    `;

  // Query to mutate project data
  const mutationQuery = (projectId, itemId, fieldId, value) => `
    mutation {
        updateProjectV2ItemFieldValue(
          input: {projectId: "${projectId}", itemId: "${itemId}", fieldId: "${fieldId}", value: {number: ${value}}}
        ) {
          clientMutationId
        }
      }
    `;

  /**
   * Code Block to execute the Query on the project
   */
  const runQuery = async (query) => fetch("https://api.github.com/graphql", {
    method: "POST",
    body: JSON.stringify({ query }),
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((res) => res.text())
    .then((body) => JSON.parse(body))
    .catch((error) => console.error(error));

  /**
   * Code Block to execute the Mutation on the project
   */
  const runMutation = async (mutation) => {
    await fetch("https://api.github.com/graphql", {
      method: "POST",
      body: JSON.stringify({ query: mutation }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => res.text())
      .then((body) => console.log(body))
      .catch((error) => console.error(error));
  };

  // Project id of the currently targated project
  let projectId;
  // Items that are currently present in the project
  let itemsArray = [];
  // Fields that are currently present in the project
  let fieldsArray = [];

  /**
   * Retrieve All the fields which are present in the project
   */
  const getFieldsInfo = async () => {
    const retrievedData = await runQuery(fieldsInfoQuery);
    const project = retrievedData.data.organization.projectV2;
    projectId = project.id;
    fieldsArray = project.fields.nodes;
  };

  /**
   * Retrieve last 100 items from the project
   */
  const runQueryForItemData = async () => {
    const retrievedData = await runQuery(itemInfoQuery);
    const project = retrievedData.data.organization.projectV2;
    itemsArray = project.items.nodes.map((item) => ({
      id: item.id,
      fieldValues: item.fieldValues.nodes,
    }));
  };

  /**
   * Function to check if all the issues in the project have a completion date
   * If the dont have a completion date then compare the target date with current data
   * and update the due days in the project accordingly
   */
  (async () => {
    await getFieldsInfo();
    await runQueryForItemData();

    const targetDateField = fieldsArray.find(
      (item) => item.name === "Target Date",
    );
    const currentDate = new Date();
    const dueDaysField = fieldsArray.find((item) => item.name === "Due Days");
    const completionDateField = fieldsArray.find(
      (item) => item.name === "Completion Date",
    );
    itemsArray.forEach((item) => {
      const targetDateObject = item.fieldValues.find(
        (data) => data?.field?.id === targetDateField.id,
      );
      const completionDateObject = item.fieldValues.find(
        (data) => data?.field?.id === completionDateField.id,
      );
      const targetDate = new Date(`${targetDateObject?.date ? targetDateObject.date : undefined}`);
      if (!completionDateObject?.id && currentDate > targetDate) {
        const dueDays = Math.floor(
          (currentDate.getTime() - targetDate.getTime()) / (1000 * 3600 * 24),
        );
        const mutation = mutationQuery(
          projectId,
          item.id,
          dueDaysField.id,
          dueDays,
        );
        runMutation(mutation);
      }
    });
  })();

  core.setOutput("data", "action worked successfully");
} catch (error) {
  core.setFailed(error.message);
}
