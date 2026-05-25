import type { ErrorPattern } from "../types";

const p = (
  id: string,
  pattern: RegExp,
  title: string,
  severity: ErrorPattern["severity"],
  causes: string[],
  debugCommands: string[],
  fixSteps: string[],
  prevention: string
): ErrorPattern => ({
  id,
  pattern,
  title,
  severity,
  what: title,
  causes,
  debugCommands,
  fixSteps,
  prevention
});

export const patterns: ErrorPattern[] = [
  p("LOG_IMAGE_PULL_BACKOFF", /ImagePullBackOff/i, "Kubernetes cannot pull your container image", "high", ["Image name typo", "Private registry missing credentials", "Image does not exist", "Docker Hub rate limit"], ["kubectl describe pod <pod>", "kubectl get events", "docker pull <image>"], ["Verify image name and tag", "Add imagePullSecrets for private registries", "Push the image before deploying"], "Test image pulls before deployment and pin image tags."),
  p("LOG_CRASH_LOOP", /CrashLoopBackOff/i, "Container keeps crashing and restarting", "high", ["App crashes at startup", "Missing env variable", "Wrong CMD", "Database unreachable", "Port conflict"], ["kubectl logs <pod>", "kubectl logs <pod> --previous", "kubectl describe pod <pod>"], ["Read previous logs", "Validate env vars", "Run the image locally"], "Add health probes and test container startup locally."),
  p("LOG_OOM", /OOMKilled|exit code 137/i, "Container killed because it ran out of memory", "high", ["Memory limit too low", "Memory leak", "Large dataset loaded into memory"], ["kubectl top pod <pod>", "kubectl describe pod <pod>"], ["Increase memory limit", "Profile memory", "Stream data instead of loading all at once"], "Set realistic limits and monitor memory trends."),
  p("LOG_PENDING_RESOURCES", /0\/\d+ nodes are available|Insufficient cpu|Insufficient memory/i, "Pod stuck Pending because resources are unavailable", "high", ["Cluster out of CPU or memory", "Requests too high", "Node selector mismatch"], ["kubectl describe pod <pod>", "kubectl get nodes", "kubectl describe nodes"], ["Lower requests", "Add nodes", "Fix node selectors"], "Capacity-plan resource requests."),
  p("LOG_ERR_IMAGE_NEVER_PULL", /ErrImageNeverPull/i, "Image pull policy prevents pulling from registry", "medium", ["imagePullPolicy is Never", "Image is not present on node"], ["kubectl describe pod <pod>"], ["Use IfNotPresent or Always", "Preload the image on nodes"], "Use registry-hosted images outside local dev."),
  p("LOG_CREATE_CONTAINER_CONFIG", /CreateContainerConfigError/i, "Container cannot be created due to config error", "high", ["Secret missing", "ConfigMap missing", "Invalid env reference"], ["kubectl describe pod <pod>", "kubectl get secret", "kubectl get configmap"], ["Create missing references", "Fix env var names"], "Validate manifests before apply."),
  p("LOG_PORT_ALLOCATED", /port is already allocated|address already in use/i, "Port conflict: another process is using this port", "medium", ["Host port already bound", "Previous container still running"], ["lsof -i :<port>", "docker ps"], ["Stop the old container", "Change the host port"], "Reserve ports and avoid duplicate mappings."),
  p("LOG_NO_SPACE", /no space left on device/i, "Docker host disk is full", "high", ["Unused images", "Large logs", "Build cache growth"], ["df -h", "docker system df", "docker system prune"], ["Prune unused Docker data", "Rotate logs", "Increase disk"], "Monitor disk and prune CI runners regularly."),
  p("LOG_PERMISSION_DENIED", /permission denied/i, "File permission error", "medium", ["Wrong user", "Volume ownership mismatch", "Read-only filesystem"], ["id", "ls -la", "docker exec <container> ls -la"], ["Fix USER instruction", "Adjust mount permissions"], "Run as non-root with explicit ownership."),
  p("LOG_NETWORK_NOT_FOUND", /network .* not found/i, "Docker network does not exist", "medium", ["Compose network removed", "Wrong network name"], ["docker network ls"], ["Create the network", "Fix compose network name"], "Let Compose create named networks."),
  p("LOG_NODE_MODULE_NOT_FOUND", /Cannot find module/i, "Node.js module not found", "medium", ["npm install not run", "Wrong import path", "Dependency missing from package.json"], ["npm ls", "node -p \"require.resolve('module')\""], ["Install dependencies", "Fix import path"], "Use npm ci in Docker and CI."),
  p("LOG_ECONNREFUSED", /ECONNREFUSED/i, "Connection refused: target service is not running or wrong port", "high", ["Service not started", "Wrong port", "Wrong hostname"], ["curl -v <host>:<port>", "docker logs <service>"], ["Start dependency", "Fix service hostname", "Check port mapping"], "Use health checks and service discovery names."),
  p("LOG_EADDRINUSE", /EADDRINUSE/i, "Port already in use inside container", "medium", ["Two processes bind same port", "App starts twice"], ["netstat -tulpn", "ps aux"], ["Change port", "Stop duplicate process"], "Avoid duplicate server startup in entrypoints."),
  p("LOG_CI_EXIT_1", /Process completed with exit code 1/i, "CI step failed with exit code 1", "medium", ["Test failure", "Lint failure", "Build failure"], ["Read previous step output"], ["Fix the command failure above this line"], "Keep CI output focused and fail early."),
  p("LOG_GHA_PERMISSION", /Resource not accessible by integration/i, "GitHub Actions lacks permission for this resource", "high", ["Missing permissions block", "Forked PR restrictions"], ["gh run view --log"], ["Add minimal permissions", "Use pull_request_target carefully"], "Declare least-privilege permissions explicitly."),
  p("LOG_NOT_GIT_REPO", /fatal: not a git repository/i, "actions/checkout was not run before git operations", "medium", ["Repository not checked out", "Wrong working directory"], ["pwd", "ls -la"], ["Add actions/checkout@v4 first"], "Use checkout before git commands."),
  p("LOG_TLS_TIMEOUT", /TLS handshake timeout/i, "Network TLS handshake timed out", "medium", ["Network flake", "Registry slowdown", "Proxy issue"], ["curl -v <url>", "docker pull <image>"], ["Retry", "Check proxy and DNS"], "Use retries around external network calls."),
  p("LOG_IMAGE_PULL", /ErrImagePull/i, "Kubernetes image pull failed", "high", ["Bad image ref", "Registry unavailable"], ["kubectl describe pod <pod>"], ["Fix image ref", "Check registry"], "Pin and preflight image references."),
  p("LOG_BACKOFF_PULL", /Back-off pulling image/i, "Kubernetes is backing off image pulls", "high", ["Repeated pull failures", "Registry throttling"], ["kubectl get events"], ["Fix root image-pull error"], "Monitor registry rate limits."),
  p("LOG_READINESS_FAILED", /Readiness probe failed/i, "Readiness probe is failing", "high", ["Health endpoint wrong", "App not ready", "Port mismatch"], ["kubectl describe pod <pod>", "kubectl logs <pod>"], ["Fix probe path/port", "Increase initialDelaySeconds"], "Test probes locally."),
  p("LOG_LIVENESS_FAILED", /Liveness probe failed/i, "Liveness probe is failing", "high", ["App deadlock", "Probe too aggressive", "Wrong path"], ["kubectl describe pod <pod>"], ["Fix probe config", "Investigate app hang"], "Tune probe thresholds."),
  p("LOG_INVALID_IMAGE_NAME", /InvalidImageName/i, "Container image name is invalid", "high", ["Malformed image name", "Empty env substitution"], ["kubectl describe pod <pod>"], ["Fix image string"], "Validate manifests in CI."),
  p("LOG_SECRET_NOT_FOUND", /secret .* not found/i, "Referenced Kubernetes Secret is missing", "high", ["Secret not created", "Wrong namespace"], ["kubectl get secret -n <ns>"], ["Create the secret", "Fix namespace"], "Deploy secrets before workloads."),
  p("LOG_CONFIGMAP_NOT_FOUND", /configmap .* not found/i, "Referenced ConfigMap is missing", "medium", ["ConfigMap not created", "Wrong name"], ["kubectl get configmap -n <ns>"], ["Create ConfigMap", "Fix reference"], "Package config dependencies with manifests."),
  p("LOG_BIND_EXCEPTION", /BindException/i, "Application failed to bind a port", "medium", ["Port already in use", "Permission on privileged port"], ["netstat -tulpn"], ["Change port", "Use non-root high port"], "Avoid privileged ports in containers."),
  p("LOG_DATABASE_AUTH", /password authentication failed|Access denied for user/i, "Database authentication failed", "high", ["Wrong credentials", "Wrong database user", "Secret mismatch"], ["Check app env", "Check database logs"], ["Rotate/fix credentials"], "Manage DB credentials in a secret manager."),
  p("LOG_MIGRATION_FAILED", /migration failed|schema .* failed/i, "Database migration failed", "high", ["Breaking migration", "Missing permission", "Schema drift"], ["Read migration logs", "Check DB schema"], ["Rollback or fix migration"], "Test migrations against staging snapshots."),
  p("LOG_CERT_EXPIRED", /certificate has expired|x509: certificate/i, "TLS certificate problem", "high", ["Expired certificate", "Wrong CA bundle", "MITM proxy"], ["openssl s_client -connect host:443"], ["Renew cert", "Install CA bundle"], "Monitor certificate expiry."),
  p("LOG_DNS", /ENOTFOUND|getaddrinfo/i, "DNS lookup failed", "medium", ["Wrong hostname", "DNS outage", "Service name typo"], ["nslookup <host>", "dig <host>"], ["Fix hostname", "Check DNS config"], "Use service discovery names and tests."),
  p("LOG_RATE_LIMIT", /rate limit exceeded|429 Too Many Requests/i, "External service rate limit hit", "medium", ["Too many requests", "Missing auth token"], ["Check response headers"], ["Back off and retry", "Authenticate requests"], "Cache and retry external calls."),
  p("LOG_UNAUTHORIZED", /401 Unauthorized|403 Forbidden/i, "Authentication or authorization failed", "high", ["Bad token", "Missing permission", "Expired credentials"], ["Check token scope", "Review IAM policy"], ["Rotate token", "Grant least privilege"], "Use short-lived credentials and validation."),
  p("LOG_MODULE_IMPORT", /ModuleNotFoundError|ImportError/i, "Python module import failed", "medium", ["pip install missing", "Wrong package name", "Virtualenv mismatch"], ["pip freeze", "python -c \"import module\""], ["Install dependency", "Fix requirements.txt"], "Use locked dependency installs."),
  p("LOG_COMMAND_NOT_FOUND", /command not found|executable file not found/i, "Entrypoint command is missing", "high", ["Binary not installed", "Wrong PATH", "Bad CMD"], ["which <command>", "echo $PATH"], ["Install binary", "Fix CMD/ENTRYPOINT"], "Test container command locally.")
];
