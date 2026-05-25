import { aptNoCleanRule } from "./aptNoClean";
import { badCopyOrderRule } from "./badCopyOrder";
import { largeBaseImageRule } from "./largeBaseImage";
import { latestTagRule } from "./latestTag";
import { multipleRunCommandsRule } from "./multipleRunCommands";
import { noDockerignoreRule } from "./noDockerignore";
import { noExposeRule } from "./noExpose";
import { noHealthcheckRule } from "./noHealthcheck";
import { noMultiStageRule } from "./noMultiStage";
import { noWorkdirRule } from "./noWorkdir";
import { rootUserRule } from "./rootUser";
import { secretInEnvRule } from "./secretInEnv";

export const dockerRules = [
  latestTagRule,
  noWorkdirRule,
  noHealthcheckRule,
  rootUserRule,
  secretInEnvRule,
  badCopyOrderRule,
  aptNoCleanRule,
  noDockerignoreRule,
  noExposeRule,
  largeBaseImageRule,
  noMultiStageRule,
  multipleRunCommandsRule
];

export {
  aptNoCleanRule,
  badCopyOrderRule,
  largeBaseImageRule,
  latestTagRule,
  multipleRunCommandsRule,
  noDockerignoreRule,
  noExposeRule,
  noHealthcheckRule,
  noMultiStageRule,
  noWorkdirRule,
  rootUserRule,
  secretInEnvRule
};
