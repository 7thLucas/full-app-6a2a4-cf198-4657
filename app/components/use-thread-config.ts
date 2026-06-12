import { useConfigurables } from "~/modules/configurables";
import {
  defaultConfigurablesData,
  type TPipelineStage,
  type TInteractionType,
} from "~/modules/configurables/src/constants/configurables.default";

/**
 * Thin wrapper over useConfigurables() that guarantees fully-formed, non-placeholder
 * values for the Thread CRM UI. The portal may deliver partial config right after
 * mount, so every field falls back to a sensible default.
 */
export function useThreadConfig() {
  const { config, loading } = useConfigurables();

  const appName =
    config?.appName && !config.appName.startsWith("FILL_")
      ? config.appName
      : defaultConfigurablesData.appName;

  const tagline = config?.tagline || defaultConfigurablesData.tagline || "";

  const logoUrl =
    config?.logoUrl && !config.logoUrl.startsWith("FILL_") ? config.logoUrl : "";

  const staleAfterDays =
    typeof config?.staleAfterDays === "number" && config.staleAfterDays > 0
      ? config.staleAfterDays
      : (defaultConfigurablesData.staleAfterDays ?? 7);

  const pipelineStages: TPipelineStage[] =
    Array.isArray(config?.pipelineStages) && config.pipelineStages.length
      ? config.pipelineStages
      : (defaultConfigurablesData.pipelineStages ?? []);

  const interactionTypes: TInteractionType[] =
    Array.isArray(config?.interactionTypes) && config.interactionTypes.length
      ? config.interactionTypes
      : (defaultConfigurablesData.interactionTypes ?? []);

  return {
    loading,
    appName,
    tagline,
    logoUrl,
    staleAfterDays,
    pipelineStages,
    interactionTypes,
  };
}
