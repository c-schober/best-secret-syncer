import { WEBFLOW_API_TOKEN } from "./const";
import { WebflowClient } from "webflow-api";

export const webflow = new WebflowClient({ accessToken: WEBFLOW_API_TOKEN })
