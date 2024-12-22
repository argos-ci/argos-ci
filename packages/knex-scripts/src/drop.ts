import { Command } from "commander";
import { oraPromise } from "ora";

import { getConfig } from "./config.js";
import {
  getCommand,
  getCommandEnv,
  preventRunningInProduction,
  runCommand,
} from "./utils.js";

/**
 * Drop the database based on the configuration in the knexfile.
 */
async function dropDatabase() {
  preventRunningInProduction();

  const config = await getConfig();
  const env = getCommandEnv(config);
  const command = getCommand(config, "dropdb --if-exists");
  await runCommand(command, { env });
}

/**
 * Add the "drop" command to the program.
 */
export function addDropCommand(program: Command) {
  program
    .command("drop")
    .description(
      "Drop the database based on the configuration in the knexfile.",
    )
    .action(async () => {
      await oraPromise(dropDatabase(), "Dropping database...");
    });
}
