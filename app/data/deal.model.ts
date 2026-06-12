import {
  prop,
  getModelForClass,
  modelOptions,
  Severity,
} from "@typegoose/typegoose";
import { Types } from "mongoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

/**
 * A deal/relationship that moves across pipeline stages. `stage` stores the stage
 * key from the configurable pipeline. `lastActivityAt` powers the "needs attention"
 * surfacing — it is bumped whenever an interaction is logged or the deal is touched.
 */
@modelOptions({
  schemaOptions: {
    collection: "tbl_deals",
    timestamps: true,
  },
  options: { allowMixed: Severity.ALLOW },
})
export class Deal extends CommonTypegooseEntity {
  @prop({ type: String, required: true, trim: true })
  title!: string;

  @prop({ type: Types.ObjectId, ref: "Contact", required: true })
  contactId!: Types.ObjectId;

  @prop({ type: String, required: true })
  stage!: string;

  @prop({ type: Number, default: 0 })
  value!: number;

  @prop({ type: Date })
  nextFollowUpAt?: Date;

  @prop({ type: Date, default: () => new Date() })
  lastActivityAt!: Date;
}

export const DealModel = getModelForClass(Deal);
