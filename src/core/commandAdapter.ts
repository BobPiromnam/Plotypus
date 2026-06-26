export type AdapterCommandResult = {
  label: string;
};

export function createCommandResult(label: string): AdapterCommandResult {
  return { label };
}

export function createReadOnlyCommandResult(commandType: string): AdapterCommandResult {
  return createCommandResult(`Read-only bridge ignored ${commandType}`);
}
