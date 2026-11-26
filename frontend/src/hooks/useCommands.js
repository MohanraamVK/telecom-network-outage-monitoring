import { useContext } from "react";
import { CommandContext } from "../components/command/CommandContext";

export function useCommands() {
  const context = useContext(CommandContext);
  if (!context) throw new Error("useCommands must be used inside CommandProvider");
  return context;
}
