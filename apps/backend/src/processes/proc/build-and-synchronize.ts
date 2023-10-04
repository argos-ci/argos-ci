import { job as buildJob } from "@/build/index.js";
import { job as buildNotificationJob } from "@/build-notification/index.js";
import { createJobWorker } from "@/job-core/index.js";
import { job as synchronizeJob } from "@/synchronize/index.js";

import { setup } from "../setup.js";

setup();

createJobWorker(buildJob, synchronizeJob, buildNotificationJob);
