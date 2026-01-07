const prompts = require("prompts");

async function getProjectDetails(initialProjectName) {
  let projectName = initialProjectName;
  let templateType = "react-js"; // default

  const questions = [];

  if (!projectName) {
    questions.push({
      type: "text",
      name: "projectName",
      message: "Project name:",
      initial: "my-dovite-app",
    });
  }

  questions.push({
    type: "select",
    name: "template",
    message: "Select a template:",
    choices: [
      { title: "React JavaScript", value: "react-js" },
      { title: "React TypeScript", value: "react-ts" },
      // Vue templates coming soon in a future release
      // { title: "Vue JavaScript", value: "vue-js" },
      // { title: "Vue TypeScript", value: "vue-ts" },
    ],
    initial: 0,
  });

  if (questions.length > 0) {
    const response = await prompts(questions, {
      onCancel: () => {
        console.log("Operation cancelled");
        process.exit(0);
      },
    });

    if (!projectName) projectName = response.projectName || projectName;
    templateType = response.template;
  }

  if (!projectName) {
    console.error("Please specify a project name");
    process.exit(1);
  }

  return { projectName, templateType };
}

module.exports = { getProjectDetails };
