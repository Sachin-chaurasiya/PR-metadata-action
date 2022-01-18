const core = require("@actions/core");
const github = require("@actions/github");

const main = async () => {
  try {
    const owner = core.getInput("owner", { required: true });
    const repo = core.getInput("repo", { required: true });
    const pr_number = core.getInput("pr_number", { required: true });
    const token = core.getInput("token", { required: true });

    const octokit = new github.getOctokit(token);

    const { data: changedFiles } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pr_number,
    });

    let diffData = {
      additions: 0,
      deletions: 0,
      changes: 0,
    };
    const labels = [];

    diffData = changedFiles.reduce((acc, file) => {
      acc.additions += file.additions;
      acc.deletions += file.deletions;
      acc.changes += file.changes;
      return acc;
    }, diffData);

    for (const file of changedFiles) {
      const fileExtension = file.filename.split(".").pop();
      switch (fileExtension) {
        case "md":
          labels.push("markdown");

        case "js":
          labels.push("javascript");

        case "yml":
        case "yaml":
          labels.push("yaml");
      }
    }

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pr_number,
      body: `
        Pull Request #${pr_number} metadata: \n
        - ${diffData.changes} changes \n
        - ${diffData.additions} additions \n
        - ${diffData.deletions} deletions \n
        # changed files type 
        [${labels.join(", ")}]

      `,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
};

main();
