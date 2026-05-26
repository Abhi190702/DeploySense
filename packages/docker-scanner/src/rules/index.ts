import { addRemoteUrlRule } from "./addRemoteUrl";
import { apkNoCacheRule } from "./apkNoCache";
import { aptNoCleanRule } from "./aptNoClean";
import { aptUpdateSplitRule } from "./aptUpdateSplit";
import { badCopyOrderRule } from "./badCopyOrder";
import { curlPipeShellRule } from "./curlPipeShell";
import { largeBaseImageRule } from "./largeBaseImage";
import { latestTagRule } from "./latestTag";
import { multipleRunCommandsRule } from "./multipleRunCommands";
import { npmInstallNotCiRule } from "./npmInstallNotCi";
import { noDockerignoreRule } from "./noDockerignore";
import { noExposeRule } from "./noExpose";
import { noHealthcheckRule } from "./noHealthcheck";
import { noMultiStageRule } from "./noMultiStage";
import { noWorkdirRule } from "./noWorkdir";
import { pipNoCacheDirRule } from "./pipNoCacheDir";
import { rootUserRule } from "./rootUser";
import { secretFileCopyRule } from "./secretFileCopy";
import { secretInEnvRule } from "./secretInEnv";
import { unpinnedDigestRule } from "./unpinnedDigest";

export const dockerRules = [
  latestTagRule,
  unpinnedDigestRule,
  noWorkdirRule,
  noHealthcheckRule,
  rootUserRule,
  secretInEnvRule,
  secretFileCopyRule,
  curlPipeShellRule,
  addRemoteUrlRule,
  badCopyOrderRule,
  aptNoCleanRule,
  aptUpdateSplitRule,
  apkNoCacheRule,
  npmInstallNotCiRule,
  pipNoCacheDirRule,
  noDockerignoreRule,
  noExposeRule,
  largeBaseImageRule,
  noMultiStageRule,
  multipleRunCommandsRule
];

export {
  addRemoteUrlRule,
  apkNoCacheRule,
  aptNoCleanRule,
  aptUpdateSplitRule,
  badCopyOrderRule,
  curlPipeShellRule,
  largeBaseImageRule,
  latestTagRule,
  multipleRunCommandsRule,
  npmInstallNotCiRule,
  noDockerignoreRule,
  noExposeRule,
  noHealthcheckRule,
  noMultiStageRule,
  noWorkdirRule,
  pipNoCacheDirRule,
  rootUserRule,
  secretFileCopyRule,
  secretInEnvRule,
  unpinnedDigestRule
};
