import { useState } from "react";
export function useSettings(definition: {
  schema: { parse: (value: unknown) => unknown };
}) {
  const [values, setValues] = useState(definition.schema.parse({}));
  return {
    status: "ready",
    values,
    revision: "demo",
    saving: false,
    saveError: null,
    save: async (next: unknown) => {
      setValues(next);
      return true;
    },
  };
}
