/* START: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */
export interface FieldSchemaType {
  fieldName?: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "color"
    | "url"
    | "enum"
    | "datetime"
    | "file"
    | "files";
  required?: boolean;
  label?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: string[];
  fields?: FieldSchemaType[];
  item?: FieldSchemaType;
}
/* END: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */

export type ConfigurableSchemas = {
  formSchema: FieldSchemaType[];
};



export const configurableSchemas: ConfigurableSchemas = {
  formSchema: [
    {
      fieldName: "appName",
      type: "string",
      required: true,
      label: "App Name",
    },
    {
      fieldName: "logoUrl",
      type: "url",
      required: true,
      label: "Logo URL",
    },
    {
      fieldName: "brandColor",
      type: "object",
      required: true,
      label: "Brand Color",
      fields: [
        {
          fieldName: "primary",
          type: "color",
          required: true,
          label: "Primary",
        },
        {
          fieldName: "secondary",
          type: "color",
          required: true,
          label: "Secondary",
        },
        {
          fieldName: "accent",
          type: "color",
          required: true,
          label: "Accent",
        },
      ],
    },
    {
      fieldName: "tagline",
      type: "string",
      required: false,
      label: "Tagline",
      maxLength: 140,
    },
    {
      fieldName: "staleAfterDays",
      type: "number",
      required: false,
      label: "Flag deals as stale after (days without activity)",
      min: 1,
      max: 365,
    },
    {
      fieldName: "pipelineStages",
      type: "array",
      required: false,
      label: "Pipeline Stages",
      item: {
        type: "object",
        required: true,
        fields: [
          { fieldName: "key", type: "string", required: true, label: "Key" },
          { fieldName: "label", type: "string", required: true, label: "Label" },
          {
            fieldName: "kind",
            type: "enum",
            required: true,
            label: "Kind",
            options: ["open", "won", "lost"],
          },
        ],
      },
    },
    {
      fieldName: "interactionTypes",
      type: "array",
      required: false,
      label: "Interaction Types",
      item: {
        type: "object",
        required: true,
        fields: [
          { fieldName: "key", type: "string", required: true, label: "Key" },
          { fieldName: "label", type: "string", required: true, label: "Label" },
        ],
      },
    },
  ],
};