import {
  prop,
  getModelForClass,
  modelOptions,
  Severity,
} from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

/**
 * A person the single owner tracks. Kept intentionally lightweight — name is the
 * only hard requirement so a contact can be captured in seconds.
 */
@modelOptions({
  schemaOptions: {
    collection: "tbl_contacts",
    timestamps: true,
  },
  options: { allowMixed: Severity.ALLOW },
})
export class Contact extends CommonTypegooseEntity {
  @prop({ type: String, required: true, trim: true })
  name!: string;

  @prop({ type: String, trim: true })
  company?: string;

  @prop({ type: String, trim: true })
  email?: string;

  @prop({ type: String, trim: true })
  phone?: string;

  @prop({ type: String })
  notes?: string;
}

export const ContactModel = getModelForClass(Contact);
