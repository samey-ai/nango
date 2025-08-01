import { getJobsUrl, getPersistAPIUrl } from '@nangohq/shared';
import { ENVS, parseEnvs } from '@nangohq/utils';

export const envs = parseEnvs(ENVS.required({ RUNNER_NODE_ID: true }));

export const heartbeatIntervalMs = 30_000;

export const jobsServiceUrl = getJobsUrl();
export const persistServiceUrl = getPersistAPIUrl();
