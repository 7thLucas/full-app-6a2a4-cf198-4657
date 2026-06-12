import {
  prop,
  getModelForClass,
  modelOptions,
  Severity,
} from "@typegoose/typegoose";
import { Types } from "mongoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

/**
 * A logged interaction (call / email / meeting / note) against a contact, and
 * optionally tied to a deal. This is the fast-capture half of the day-one loop.
 */
@modelOptions({
  schemaOptions: {
    collection: "tbl_interactions",
    timestamps: true,
  },
  options: { allowMixed: Severity.ALLOW },
})
export class Interaction extends CommonTypegooseEntity {
  @prop({ type: Types.ObjectId, ref: "Contact", required: true })
  contactId!: Types.ObjectId;

  @prop({ type: Types.ObjectId, ref: "Deal" })
  dealId?: Types.ObjectId;

  /** Interaction type key from configurables (call/email/meeting/note). */
  @prop({ type: String, required: true })
  type!: string;

  @prop({ type: String, trim: true })
  summary?: string;

  @prop({ type: Date, required: true, default: () => new Date() })
  occurredAt!: Date;
}

export const InteractionModel = getModelForClass(Interaction);
